import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AskNnooRenderedPayload } from '@nnoo/contracts';
import { WhatsAppProviderAdapter } from './adapter';
import { WhatsAppLinkingService } from './linking-service';
import { WhatsAppCommandRouter } from './command-router';
import { AskNnooAssistantService } from '../assistant/assistant-service';
import { getWhatsAppConfig } from './config';
import { type GeminiClientInterface } from '../gemini/client';

export interface InboundWhatsAppMessageEvent {
  messageId: string;
  senderPhone: string;
  textBody: string;
  timestamp?: string;
}

export interface InboundProcessResult {
  status: 'handled' | 'ignored' | 'unlinked' | 'error';
  replySent: boolean;
  replyText?: string;
  error?: string;
}

export class WhatsAppInboundHandler {
  /**
   * Renders Ask NNOO rich payload into clean, WhatsApp-friendly formatted text.
   */
  public static formatAssistantResponseForWhatsApp(payload: AskNnooRenderedPayload): string {
    const parts: string[] = [];

    if (payload.headline) {
      parts.push(`*${payload.headline}*\n`);
    }

    for (const segment of payload.segments) {
      if (segment.type === 'TEXT') {
        parts.push(segment.text || '');
      } else if (segment.type === 'FACT') {
        parts.push(`*${segment.formattedValue || segment.text || ''}*`);
      } else if (segment.type === 'SAFE_ENTITY_LABEL') {
        parts.push(`_${segment.label || segment.text || ''}_`);
      }
    }

    let text = parts.join(' ').replace(/\n\s+\n/g, '\n\n').trim();

    if (payload.facts && payload.facts.length > 0) {
      text += `\n\n_✓ Verified from NNOO business records_`;
    }

    return text;
  }


  /**
   * Processes an incoming WhatsApp message webhook event end-to-end.
   */
  public static async handleInboundMessage(
    supabase: SupabaseClient,
    event: InboundWhatsAppMessageEvent,
    options?: {
      adapter?: WhatsAppProviderAdapter;
      geminiClient?: GeminiClientInterface;
    }
  ): Promise<InboundProcessResult> {
    const adapter = options?.adapter || new WhatsAppProviderAdapter();
    const config = getWhatsAppConfig();
    const cleanPhone = WhatsAppProviderAdapter.normalizePhoneNumber(event.senderPhone);
    const phoneLookupKey = WhatsAppProviderAdapter.computePhoneLookupKey(cleanPhone, config.pepper);

    // 1. Webhook Deduplication via whatsapp_webhook_receipts
    const { data: existingReceipt } = await supabase
      .from('whatsapp_webhook_receipts')
      .select('id, status')
      .eq('provider_event_id', event.messageId)
      .maybeSingle();

    if (existingReceipt) {
      return {
        status: 'ignored',
        replySent: false,
      };
    }

    // Record receipt
    await supabase.from('whatsapp_webhook_receipts').insert({
      provider_event_id: event.messageId,
      event_type: 'message',
      sender_lookup_key: phoneLookupKey,
      recipient_phone: cleanPhone,
      status: 'received',
      received_at: new Date().toISOString(),
    });

    const trimmedText = event.textBody.trim();

    // 2. Check for Account Linking Command (CONNECT NNOO-XXXX or NNOO-XXXX)
    const isLinkCode =
      trimmedText.toUpperCase().startsWith('CONNECT') ||
      /^NNOO-[A-Z0-9]{4,8}$/i.test(trimmedText);

    if (isLinkCode) {
      const linkResult = await WhatsAppLinkingService.verifyAndLink(supabase, cleanPhone, trimmedText);
      await adapter.sendTextMessage({
        recipientPhone: cleanPhone,
        body: linkResult.message,
      });

      await supabase
        .from('whatsapp_webhook_receipts')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('provider_event_id', event.messageId);

      return {
        status: 'handled',
        replySent: true,
        replyText: linkResult.message,
      };
    }

    // 3. Look up sender connection in whatsapp_connections
    const { data: connections } = await supabase
      .from('whatsapp_connections')
      .select('id, business_id, user_id, status, consent_status, active_business_context')
      .eq('phone_lookup_key', phoneLookupKey)
      .in('status', ['ACTIVE', 'OPTED_OUT']);

    if (!connections || connections.length === 0) {
      const unlinkedReply =
        `👋 *Welcome to NNOO Business AI*\n\n` +
        `This WhatsApp number is not linked to an active NNOO account.\n\n` +
        `*To connect your account:*\n` +
        `1. Log in to your NNOO dashboard\n` +
        `2. Go to *Settings → WhatsApp*\n` +
        `3. Click *Connect WhatsApp* and send your 6-character link code here.\n\n` +
        `_Visit nnoo.africa to get started._`;

      await adapter.sendTextMessage({
        recipientPhone: cleanPhone,
        body: unlinkedReply,
      });

      await supabase
        .from('whatsapp_webhook_receipts')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('provider_event_id', event.messageId);

      return {
        status: 'unlinked',
        replySent: true,
        replyText: unlinkedReply,
      };
    }

    // Select active business connection
    const activeConnection =
      connections.find((c) => c.active_business_context) || connections[0];

    // 4. Verify sender has active business membership in active business
    const { data: membership } = await supabase
      .from('business_memberships')
      .select('role, membership_status, businesses!inner(id, name, currency_code, timezone)')
      .eq('business_id', activeConnection.business_id)
      .eq('user_id', activeConnection.user_id)
      .eq('membership_status', 'active')
      .maybeSingle();

    if (!membership) {
      const revokedReply =
        `🚫 *Access Restricted*\n\n` +
        `Your membership in this business is no longer active.\n` +
        `Please contact your business owner or type *BUSINESS* to switch to another business.`;

      await adapter.sendTextMessage({
        recipientPhone: cleanPhone,
        body: revokedReply,
      });

      await supabase
        .from('whatsapp_webhook_receipts')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('provider_event_id', event.messageId);

      return {
        status: 'handled',
        replySent: true,
        replyText: revokedReply,
      };
    }

    // 5. Command Routing (HELP, STOP, START, BUSINESS, mutation blocking)
    const commandResult = await WhatsAppCommandRouter.routeInboundMessage(
      supabase,
      activeConnection.user_id,
      activeConnection.business_id,
      trimmedText
    );

    if (commandResult.isHandled && commandResult.replyText) {
      await adapter.sendTextMessage({
        recipientPhone: cleanPhone,
        body: commandResult.replyText,
      });

      await supabase
        .from('whatsapp_webhook_receipts')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('provider_event_id', event.messageId);

      return {
        status: 'handled',
        replySent: true,
        replyText: commandResult.replyText,
      };
    }

    // 6. Inbound Ask NNOO Business AI Query (T3-P05 Reuse)
    try {
      const bizData = (membership as any).businesses;
      const currencyCode = bizData?.currency_code || 'NGN';
      const timezone = bizData?.timezone || 'Africa/Lagos';

      const askResult = await AskNnooAssistantService.processMessage({
        supabase,
        businessId: activeConnection.business_id,
        userId: activeConnection.user_id,
        userRole: membership.role,
        message: commandResult.query || trimmedText,
        idempotencyKey: `wa_${event.messageId}`,
        currencyCode,
        timezone,
        geminiClient: options?.geminiClient,
      });

      const payload = askResult.assistantMessage.assistantResponsePayload;
      const formattedReply = payload
        ? WhatsAppInboundHandler.formatAssistantResponseForWhatsApp(payload)
        : 'Thank you for your message. Verified records have been updated in NNOO.';

      await adapter.sendTextMessage({
        recipientPhone: cleanPhone,
        body: formattedReply,
      });


      await supabase
        .from('whatsapp_webhook_receipts')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('provider_event_id', event.messageId);

      return {
        status: 'handled',
        replySent: true,
        replyText: formattedReply,
      };
    } catch (err: any) {
      const errorReply =
        `⚠️ *Unable to process request*\n\n${err.message || 'An unexpected error occurred.'}\n\n` +
        `Please try again or open the NNOO app.`;

      await adapter.sendTextMessage({
        recipientPhone: cleanPhone,
        body: errorReply,
      });

      await supabase
        .from('whatsapp_webhook_receipts')
        .update({ status: 'failed', processed_at: new Date().toISOString() })
        .eq('provider_event_id', event.messageId);

      return {
        status: 'error',
        replySent: true,
        error: err.message,
      };
    }
  }
}
