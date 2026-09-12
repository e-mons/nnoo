import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  WhatsAppOperationsMetrics,
  IntelligenceReportingPeriod,
  RetryFailedWhatsAppDeliveryInput,
  RetryFailedWhatsAppDeliveryResult,
  IntelligenceSystemStatus,
} from '@nnoo/contracts/ai';
import { AISafeError } from '../service';
import { requirePlatformAdmin } from './auth';
import { AiOperationsService } from './ai-operations-service';
import { getWhatsAppConfig } from '../whatsapp/config';
import { WHATSAPP_TEMPLATE_REGISTRY } from '../whatsapp/template-registry';
import { WhatsAppProviderAdapter } from '../whatsapp/adapter';

import { hasPermission } from '@/lib/auth/rbac-client';
import { CATEGORY_FEATURE_MAP } from '../notifications/policy-registry';

export class WhatsAppAdminService {
  /**
   * Retrieves WhatsApp operations telemetry.
   */
  public static async getWhatsAppMetrics(
    supabase: SupabaseClient,
    period: IntelligenceReportingPeriod = '24h'
  ): Promise<WhatsAppOperationsMetrics> {
    const config = getWhatsAppConfig();
    const isConfigured = Boolean(
      config.accessToken &&
        config.accessToken.trim() !== '' &&
        config.phoneNumberId &&
        config.phoneNumberId.trim() !== ''
    );

    const periodStart = AiOperationsService.getPeriodStartTimestamp(period);

    // 1. WhatsApp Connections counts
    const { data: connections } = await supabase
      .from('whatsapp_connections')
      .select('status, consent_status');

    let activeConnectionsCount = 0;
    let optedOutConnectionsCount = 0;

    for (const c of connections || []) {
      if (c.status === 'ACTIVE' && c.consent_status === 'CONSENTED') {
        activeConnectionsCount++;
      } else if (c.consent_status === 'OPTED_OUT') {
        optedOutConnectionsCount++;
      }
    }

    // 2. Deliveries in the period
    const { data: deliveries, error: delError } = await supabase
      .from('whatsapp_deliveries')
      .select('*')
      .gte('created_at', periodStart)
      .order('created_at', { ascending: false });

    if (delError) {
      throw new AISafeError(
        'ADMIN_INTERNAL_ERROR' as any,
        `Failed to retrieve WhatsApp deliveries: ${delError.message}`,
        false
      );
    }

    const allDeliveries = deliveries || [];
    let messagesSent = 0;
    let messagesDelivered = 0;
    let messagesRead = 0;
    let messagesFailed = 0;

    for (const d of allDeliveries) {
      if (d.status === 'SENT') messagesSent++;
      else if (d.status === 'DELIVERED') {
        messagesSent++;
        messagesDelivered++;
      } else if (d.status === 'READ') {
        messagesSent++;
        messagesDelivered++;
        messagesRead++;
      } else if (d.status === 'FAILED') {
        messagesFailed++;
      }
    }

    // 3. Webhook Receipts in period
    const { data: receipts } = await supabase
      .from('whatsapp_webhook_receipts')
      .select('*')
      .gte('received_at', periodStart)
      .order('received_at', { ascending: false });

    let lastValidWebhookAt: string | null = null;
    let invalidSignatureCount = 0;

    for (const r of receipts || []) {
      if (r.status === 'processed' || r.status === 'received') {
        if (!lastValidWebhookAt) lastValidWebhookAt = r.received_at;
      } else if (r.status === 'signature_failed' || r.status === 'invalid') {
        invalidSignatureCount++;
      }
    }

    // Webhook & System status
    let webhookHealth: 'HEALTHY' | 'DEGRADED' | 'NOT_CONFIGURED' = 'HEALTHY';
    let status: IntelligenceSystemStatus = 'HEALTHY';

    if (!isConfigured) {
      webhookHealth = 'NOT_CONFIGURED';
      status = 'NOT_CONFIGURED';
    } else if (invalidSignatureCount > 5) {
      webhookHealth = 'DEGRADED';
    }

    if (status === 'HEALTHY' && allDeliveries.length > 0) {
      const failRate = messagesFailed / allDeliveries.length;
      if (failRate > 0.25) status = 'DEGRADED';
    }

    // Template registry listing
    const templateRegistry = Object.entries(WHATSAPP_TEMPLATE_REGISTRY).map(
      ([key, val]) => ({
        templateKey: key,
        providerTemplateName: val.templateName,
        category: key,
        status: (isConfigured ? 'APPROVED' : 'FALLBACK_TEXT_ONLY') as
          | 'APPROVED'
          | 'PENDING'
          | 'FALLBACK_TEXT_ONLY',
      })
    );


    const recentFailures = allDeliveries
      .filter((d) => d.status === 'FAILED')
      .slice(0, 15)
      .map((d) => ({
        id: d.id,
        businessId: d.business_id,
        templateKey: d.template_key,
        status: d.status,
        errorCode: d.error_code || 'DELIVERY_FAILED',
        failedAt: d.failed_at || d.created_at,
      }));

    return {
      period,
      status,
      isProviderConfigured: isConfigured,
      webhookHealth,
      lastValidWebhookAt,
      invalidSignatureCount,
      activeConnectionsCount,
      optedOutConnectionsCount,
      messagesSent,
      messagesDelivered,
      messagesRead,
      messagesFailed,
      templateRegistry,
      recentFailures,
    };
  }

  /**
   * Safely retries a failed WhatsApp delivery.
   * Strictly rechecks current user membership, role RBAC, WhatsApp connection & STOP consent, and notification preferences.
   */
  public static async retryFailedDelivery(
    supabase: SupabaseClient,
    input: RetryFailedWhatsAppDeliveryInput
  ): Promise<RetryFailedWhatsAppDeliveryResult> {
    const { user, adminRecord } = await requirePlatformAdmin(supabase);

    if (!input.reason || input.reason.trim().length < 3) {
      throw new AISafeError(
        'ADMIN_REASON_REQUIRED' as any,
        'A valid audit reason (at least 3 characters) is required to retry a WhatsApp delivery.',
        false
      );
    }

    // 1. Fetch original failed delivery
    const { data: delivery, error: delErr } = await supabase
      .from('whatsapp_deliveries')
      .select('*')
      .eq('id', input.deliveryId)
      .maybeSingle();

    if (delErr || !delivery) {
      throw new AISafeError(
        'ADMIN_DELIVERY_NOT_FOUND' as any,
        `WhatsApp delivery '${input.deliveryId}' was not found.`,
        false
      );
    }

    if (delivery.status !== 'FAILED') {
      throw new AISafeError(
        'ADMIN_DELIVERY_NOT_RETRYABLE' as any,
        `Only failed deliveries can be retried. Current status: '${delivery.status}'.`,
        false
      );
    }

    // 2. Fetch active WhatsApp connection
    const { data: connection } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('business_id', delivery.business_id)
      .eq('user_id', delivery.recipient_user_id)
      .maybeSingle();

    if (!connection || connection.status !== 'ACTIVE') {
      throw new AISafeError(
        'ADMIN_DELIVERY_RETRY_BLOCKED' as any,
        'User is no longer actively connected to WhatsApp for this business.',
        false
      );
    }

    // STRICT INVARIANT: If user opted out (STOP), retry is unconditionally blocked!
    if (connection.consent_status === 'OPTED_OUT' || connection.consent_status === 'REVOKED') {
      throw new AISafeError(
        'ADMIN_DELIVERY_RETRY_BLOCKED' as any,
        'User has opted out of WhatsApp messages. Platform Admin cannot override user STOP consent.',
        false
      );
    }

    // 3. Re-verify active business membership and role RBAC
    const { data: membership } = await supabase
      .from('business_memberships')
      .select('role, membership_status')
      .eq('business_id', delivery.business_id)
      .eq('user_id', delivery.recipient_user_id)
      .eq('membership_status', 'active')
      .maybeSingle();

    if (!membership) {
      throw new AISafeError(
        'ADMIN_DELIVERY_RETRY_BLOCKED' as any,
        'Recipient is no longer an active member of this business.',
        false
      );
    }

    // If linked notification exists, check category permission
    if (delivery.notification_id) {
      const { data: notif } = await supabase
        .from('business_notifications')
        .select('notification_category')
        .eq('id', delivery.notification_id)
        .maybeSingle();

      if (notif) {
        const requiredModule = (CATEGORY_FEATURE_MAP as Record<string, any>)[notif.notification_category];
        if (requiredModule && !hasPermission(membership.role, requiredModule)) {
          throw new AISafeError(
            'ADMIN_DELIVERY_RETRY_BLOCKED' as any,
            `Recipient role '${membership.role}' lacks permission for notification category '${notif.notification_category}'.`,
            false
          );
        }

        // Check channel preference
        const { data: pref } = await supabase
          .from('notification_preferences')
          .select('enabled')
          .eq('business_id', delivery.business_id)
          .eq('user_id', delivery.recipient_user_id)
          .eq('category', notif.notification_category)
          .eq('channel', 'WHATSAPP')
          .maybeSingle();

        if (pref && !pref.enabled) {
          throw new AISafeError(
            'ADMIN_DELIVERY_RETRY_BLOCKED' as any,
            'Recipient has muted WhatsApp notifications for this category.',
            false
          );
        }
      }
    }

    const now = new Date().toISOString();

    // 4. Log audit event
    await supabase.from('platform_audit_events').insert({
      actor_id: adminRecord.id,
      action: 'platform.whatsapp.retry',
      target_type: 'whatsapp_delivery',
      target_id: delivery.id,
      reason: input.reason.trim(),
      metadata: {
        originalDeliveryId: delivery.id,
        businessId: delivery.business_id,
        recipientUserId: delivery.recipient_user_id,
        adminUserId: user.id,
      },
      created_at: now,
    });

    // 5. Execute provider send retry
    const adapter = new WhatsAppProviderAdapter();
    try {
      const sendResult = await adapter.sendTextMessage({
        recipientPhone: delivery.recipient_user_id,
        body: delivery.rendered_body,
      });

      await supabase
        .from('whatsapp_deliveries')
        .update({
          status: 'SENT',
          provider_message_id: sendResult.providerMessageId || null,
          sent_at: now,
          error_code: null,
          updated_at: now,
        })
        .eq('id', delivery.id);

      return {
        success: true,
        deliveryId: delivery.id,
        status: 'SENT',
        message: 'WhatsApp delivery retried and sent successfully.',
      };
    } catch (err: any) {
      await supabase
        .from('whatsapp_deliveries')
        .update({
          status: 'FAILED',
          error_code: err?.code || err?.message || 'PROVIDER_RETRY_FAILED',
          failed_at: now,
          updated_at: now,
        })
        .eq('id', delivery.id);

      return {
        success: false,
        deliveryId: delivery.id,
        status: 'FAILED',
        message: `WhatsApp provider retry failed: ${err.message}`,
      };
    }

  }
}
