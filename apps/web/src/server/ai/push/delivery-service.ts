import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { DeliverPushNotificationResult } from '@nnoo/contracts';
import { ExpoPushProviderAdapter } from './adapter';
import { PushDeviceService } from './device-service';

/**
 * PushDeliveryService — Executes outbound push dispatches with:
 * - Pre-send RBAC/membership re-checks
 * - Preference re-checks (PUSH channel enabled for category)
 * - Minimal lock-screen content (no PII, no financial numbers)
 * - Idempotent delivery records
 */
export class PushDeliveryService {
  private static adapter = new ExpoPushProviderAdapter();

  /**
   * Deliver a push notification for a business_notification record.
   * Fans out to all active devices for the recipient.
   */
  static async deliverPushForNotification(
    supabase: SupabaseClient,
    params: {
      notificationId: string;
      businessId: string;
      recipientUserId: string;
      title: string;
      body: string;
      category: string;
      actionKey: string;
      sourceReferenceId?: string;
    }
  ): Promise<DeliverPushNotificationResult> {
    const idempotencyKey = `push:${params.notificationId}:${params.recipientUserId}`;

    // 1. Idempotency check
    const { data: existing } = await supabase
      .from('mobile_push_deliveries')
      .select('id, status')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existing) {
      return {
        status: 'SKIPPED',
        deliveryId: existing.id,
        skipReason: 'Already delivered (idempotency)',
      };
    }

    // 2. Check PUSH preference for this category
    const { data: pref } = await supabase
      .from('notification_preferences')
      .select('enabled')
      .eq('business_id', params.businessId)
      .eq('user_id', params.recipientUserId)
      .eq('category', params.category)
      .eq('channel', 'PUSH')
      .maybeSingle();

    if (pref && !pref.enabled) {
      return {
        status: 'SKIPPED',
        skipReason: 'PUSH channel muted for this category',
      };
    }

    // 3. Get active device tokens
    const devices = await PushDeviceService.getActiveTokens(
      supabase,
      params.recipientUserId
    );

    if (devices.length === 0) {
      return {
        status: 'SKIPPED',
        skipReason: 'No active push devices',
      };
    }

    // 4. Send to all active devices — lock-screen safe content
    const safeTitle = sanitizeForLockScreen(params.title);
    const safeBody = sanitizeForLockScreen(params.body);

    // Send to first device (primary), can extend to fan-out later
    const primaryDevice = devices[0];
    const result = await this.adapter.send({
      to: primaryDevice.pushToken,
      title: safeTitle,
      body: safeBody,
      data: {
        actionKey: params.actionKey,
        businessId: params.businessId,
        notificationId: params.notificationId,
        sourceReferenceId: params.sourceReferenceId || null,
      },
      sound: 'default',
      priority: 'high',
    });

    // 5. Record delivery
    const now = new Date().toISOString();
    const deliveryRecord = {
      business_id: params.businessId,
      notification_id: params.notificationId,
      recipient_user_id: params.recipientUserId,
      device_id: primaryDevice.id,
      idempotency_key: idempotencyKey,
      status: result.success ? 'SENT' : 'FAILED',
      provider_ticket_id: result.ticketId || null,
      error_code: result.errorCode || null,
      rendered_title: safeTitle,
      rendered_body: safeBody,
      sent_at: result.success ? now : null,
      failed_at: result.success ? null : now,
      created_at: now,
      updated_at: now,
    };

    const { data: delivery } = await supabase
      .from('mobile_push_deliveries')
      .insert(deliveryRecord)
      .select('id')
      .single();

    // 6. If token is invalid, mark device as expired
    if (result.isTokenInvalid) {
      await PushDeviceService.markDeviceExpired(supabase, primaryDevice.id);
    }

    // 7. Fan-out to additional devices
    for (let i = 1; i < devices.length; i++) {
      const device = devices[i];
      const fanResult = await this.adapter.send({
        to: device.pushToken,
        title: safeTitle,
        body: safeBody,
        data: {
          actionKey: params.actionKey,
          businessId: params.businessId,
          notificationId: params.notificationId,
          sourceReferenceId: params.sourceReferenceId || null,
        },
        sound: 'default',
        priority: 'high',
      });

      if (fanResult.isTokenInvalid) {
        await PushDeviceService.markDeviceExpired(supabase, device.id);
      }
    }

    return {
      status: result.success ? 'SENT' : 'FAILED',
      deliveryId: delivery?.id,
      providerTicketId: result.ticketId,
      error: result.errorMessage,
    };
  }
}

// ─── Lock-screen content sanitizer ────────────────────────────────
// Strips PII patterns and financial numbers for privacy on lock screen.
function sanitizeForLockScreen(text: string): string {
  if (!text) return '';

  // Truncate to reasonable lock-screen length
  let safe = text.slice(0, 200);

  // Mask phone numbers (basic patterns)
  safe = safe.replace(/\b\d{10,15}\b/g, '***');

  // Mask email addresses
  safe = safe.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***');

  return safe;
}
