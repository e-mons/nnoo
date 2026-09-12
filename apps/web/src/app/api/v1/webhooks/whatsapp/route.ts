import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getWhatsAppConfig } from '@/server/ai/whatsapp/config';
import { WhatsAppProviderAdapter } from '@/server/ai/whatsapp/adapter';
import { WhatsAppInboundHandler } from '@/server/ai/whatsapp/message-handler';

/**
 * GET /api/v1/webhooks/whatsapp
 * Meta WhatsApp Webhook Verification Handshake.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const config = getWhatsAppConfig();

  if (mode === 'subscribe' && token === config.webhookVerifyToken && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

/**
 * POST /api/v1/webhooks/whatsapp
 * Inbound Meta WhatsApp Webhook Event Ingestion.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get('x-hub-signature-256');

  const adapter = new WhatsAppProviderAdapter();

  // Validate HMAC-SHA256 signature
  const isValid = adapter.verifyWebhookSignature(rawBody, signatureHeader);
  if (!isValid && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  // Create admin/service Supabase client for webhook processing
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );

  // Process entries and messages
  const entries = payload?.entry || [];

  for (const entry of entries) {
    const changes = entry?.changes || [];
    for (const change of changes) {
      const value = change?.value;
      if (!value) continue;

      // Handle delivery status updates (sent, delivered, read, failed)
      if (value.statuses && Array.isArray(value.statuses)) {
        for (const statusObj of value.statuses) {
          const providerMessageId = statusObj.id;
          const status = statusObj.status; // sent, delivered, read, failed
          const timestamp = statusObj.timestamp ? new Date(Number(statusObj.timestamp) * 1000).toISOString() : new Date().toISOString();

          const updateData: Record<string, any> = {
            status: status.toUpperCase(),
            updated_at: new Date().toISOString(),
          };

          if (status === 'delivered') updateData.delivered_at = timestamp;
          else if (status === 'read') updateData.read_at = timestamp;
          else if (status === 'failed') {
            updateData.failed_at = timestamp;
            updateData.error_code = statusObj.errors?.[0]?.code ? String(statusObj.errors[0].code) : 'DELIVERY_FAILED';
            updateData.error_message = statusObj.errors?.[0]?.message || 'Provider reported delivery failure';
          }

          await (supabase as any)
            .from('whatsapp_deliveries')
            .update(updateData)
            .eq('provider_message_id', providerMessageId);
        }
      }

      // Handle inbound user messages
      if (value.messages && Array.isArray(value.messages)) {
        for (const message of value.messages) {
          const messageId = message.id;
          const senderPhone = message.from;
          const messageType = message.type;

          let textBody = '';
          if (messageType === 'text') {
            textBody = message.text?.body || '';
          } else if (messageType === 'button') {
            textBody = message.button?.text || message.button?.payload || '';
          } else if (messageType === 'interactive') {
            textBody = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || '';
          }

          if (!textBody) continue;

          await WhatsAppInboundHandler.handleInboundMessage(supabase as any, {
            messageId,
            senderPhone,
            textBody,
            timestamp: message.timestamp,
          });
        }
      }
    }
  }

  // Fast HTTP 200 acknowledgment to Meta Cloud API
  return NextResponse.json({ success: true, processed: true }, { status: 200 });
}
