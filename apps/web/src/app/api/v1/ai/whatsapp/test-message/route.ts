import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WhatsAppProviderAdapter } from '@/server/ai';

/**
 * POST /api/v1/ai/whatsapp/test-message
 * Sends a test WhatsApp verification message to the connected number.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json().catch(() => ({}));
    const businessId = body.businessId;

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: { code: 'AI_INVALID_INPUT', message: 'Field businessId is required.' } },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'WHATSAPP_UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    // Check connection
    const { data: conn } = await supabase
      .from('whatsapp_connections')
      .select('masked_phone, status')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!conn || conn.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: { code: 'WHATSAPP_CONNECTION_NOT_FOUND', message: 'No active WhatsApp connection found.' } },
        { status: 400 }
      );
    }

    const adapter = new WhatsAppProviderAdapter();
    const result = await adapter.sendTextMessage({
      recipientPhone: conn.masked_phone || '',
      body: `✨ *NNOO Test Message*\n\nYour WhatsApp Business integration is working perfectly! You will receive verified alerts and can ask business questions anytime.\n\n_Reply with HELP to see available commands._`,
    });

    return NextResponse.json({
      success: true,
      data: {
        providerMessageId: result.providerMessageId,
        sentAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'WHATSAPP_DELIVERY_FAILED', message: err?.message || 'Failed to send test message' } },
      { status: 500 }
    );
  }
}
