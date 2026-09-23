import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BusinessNotification } from '@nnoo/contracts';
import { WhatsAppProviderAdapter } from './adapter';
import { WHATSAPP_TEMPLATE_REGISTRY } from './template-registry';
import { AISafeError } from '../service';

export interface DeliverWhatsAppNotificationResult {
  status: 'SENT' | 'SKIPPED' | 'FAILED';
  deliveryId?: string;
  providerMessageId?: string;
  skipReason?: string;
  error?: string;
}

export class WhatsAppDeliveryService {
  /**
   * Dispatches an outbound business notification via WhatsApp.
   * Enforces connection status, consent, category preferences, and current RBAC.
   */
  public static async deliverNotification(
    supabase: SupabaseClient,
    params: {
      notification: BusinessNotification;
    },
    options?: {
      adapter?: WhatsAppProviderAdapter;
    }
  ): Promise<DeliverWhatsAppNotificationResult> {
    const { notification } = params;
    const adapter = options?.adapter || new WhatsAppProviderAdapter();
    const idempotencyKey = `${notification.id}_WHATSAPP_${notification.recipientUserId}`;

    // 1. Check for existing delivery record (idempotency)
    const { data: existingDelivery } = await supabase
      .from('whatsapp_deliveries')
      .select('id, status, provider_message_id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existingDelivery && ['SENT', 'DELIVERED', 'READ'].includes(existingDelivery.status)) {
      return {
        status: 'SENT',
        deliveryId: existingDelivery.id,
        providerMessageId: existingDelivery.provider_message_id || undefined,
      };
    }

    // 2. Look up active recipient WhatsApp connection for this business
    const { data: connection } = await supabase
      .from('whatsapp_connections')
      .select('id, masked_phone, phone_lookup_key, status, consent_status, provider_phone_number_id')
      .eq('business_id', notification.businessId)
      .eq('user_id', notification.recipientUserId)
      .maybeSingle();

    if (!connection || connection.status !== 'ACTIVE' || connection.consent_status !== 'CONSENTED') {
      return {
        status: 'SKIPPED',
        skipReason: 'NO_ACTIVE_WHATSAPP_CONNECTION_OR_OPTED_OUT',
      };
    }

    // 3. Check WhatsApp category preference
    const { data: preference } = await supabase
      .from('notification_preferences')
      .select('enabled')
      .eq('business_id', notification.businessId)
      .eq('user_id', notification.recipientUserId)
      .eq('category', notification.notificationCategory)
      .eq('channel', 'WHATSAPP')
      .maybeSingle();

    // Default to true if no preference record exists yet, or respect explicit false
    if (preference && preference.enabled === false) {
      return {
        status: 'SKIPPED',
        skipReason: 'USER_PREFERENCE_DISABLED',
      };
    }

    // 4. Re-verify active membership and current role RBAC
    const { data: membership } = await supabase
      .from('business_memberships')
      .select('role, membership_status')
      .eq('business_id', notification.businessId)
      .eq('user_id', notification.recipientUserId)
      .eq('membership_status', 'active')
      .maybeSingle();

    if (!membership) {
      return {
        status: 'SKIPPED',
        skipReason: 'INACTIVE_BUSINESS_MEMBERSHIP',
      };
    }

    // Validate that current role still satisfies required capabilities
    if (notification.requiredCapabilities && notification.requiredCapabilities.length > 0) {
      const isOwnerOrAdmin = ['owner', 'business_admin', 'manager'].includes(membership.role);
      const isAccountant = membership.role === 'accountant';
      const isSalesStaff = membership.role === 'sales_staff';
      const isInventoryStaff = membership.role === 'inventory_staff';

      const satisfiesAll = notification.requiredCapabilities.every((cap) => {
        if (cap.includes('profitability') || cap.includes('reports.view') || cap.includes('expenses.view')) {
          return isOwnerOrAdmin || isAccountant;
        }
        if (cap.includes('sales.view')) {
          return isOwnerOrAdmin || isAccountant || isSalesStaff;
        }
        if (cap.includes('inventory.view') || cap.includes('products.view')) {
          return isOwnerOrAdmin || isInventoryStaff;
        }
        return isOwnerOrAdmin;
      });

      if (!satisfiesAll) {
        return {
          status: 'SKIPPED',
          skipReason: 'ROLE_CAPABILITY_RESTRICTION',
        };
      }
    }

    // 5. Template and Body Resolution
    const templateConfig = WHATSAPP_TEMPLATE_REGISTRY[notification.notificationType];
    const renderedBody = templateConfig
      ? templateConfig.renderFallbackText(notification)
      : `📢 *NNOO Notification*\n\n${notification.title}\n${notification.body}`;

    // 6. Record or update delivery entry in DB
    const { data: delivery, error: insertError } = await supabase
      .from('whatsapp_deliveries')
      .upsert(
        {
          notification_id: notification.id,
          business_id: notification.businessId,
          recipient_user_id: notification.recipientUserId,
          connection_id: connection.id,
          channel: 'WHATSAPP',
          provider: 'meta_cloud_api',
          template_key: templateConfig?.templateName || null,
          idempotency_key: idempotencyKey,
          status: 'QUEUED',
          message_type: 'template',
          rendered_body: renderedBody,
          queued_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'idempotency_key' }
      )
      .select('id')
      .single();

    if (insertError || !delivery) {
      throw new AISafeError('AI_INTERNAL_ERROR', `Failed to record delivery: ${insertError?.message}`, false);
    }

    // 7. Dispatch to Meta WhatsApp Cloud API
    try {
      let sendResult;

      // Note: We format with recipient phone from connection
      // In production, template messages are preferred for business-initiated outbound alerts
      if (templateConfig) {
        sendResult = await adapter.sendTemplateMessage({
          recipientPhone: connection.masked_phone || '',
          templateName: templateConfig.templateName,
          languageCode: templateConfig.languageCode,
          components: templateConfig.buildComponents(notification),
        });
      } else {
        sendResult = await adapter.sendTextMessage({
          recipientPhone: connection.masked_phone || '',
          body: renderedBody,
        });
      }

      // Update delivery record to SENT
      await supabase
        .from('whatsapp_deliveries')
        .update({
          status: 'SENT',
          provider_message_id: sendResult.providerMessageId,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', delivery.id);

      return {
        status: 'SENT',
        deliveryId: delivery.id,
        providerMessageId: sendResult.providerMessageId,
      };
    } catch (err: any) {
      // Mark delivery FAILED
      await supabase
        .from('whatsapp_deliveries')
        .update({
          status: 'FAILED',
          error_code: err.code || 'DELIVERY_FAILED',
          error_message: err.message || 'Unknown provider error',
          failed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', delivery.id);

      return {
        status: 'FAILED',
        deliveryId: delivery.id,
        error: err.message,
      };
    }
  }
}
