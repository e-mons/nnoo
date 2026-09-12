import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WhatsAppLinkingService } from '@/server/ai';

/**
 * POST /api/v1/ai/whatsapp/disconnect
 * Disconnects WhatsApp for the active business.
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

    const result = await WhatsAppLinkingService.disconnect(supabase as any, businessId, user.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'WHATSAPP_PROVIDER_ERROR', message: err?.message || 'Failed to disconnect WhatsApp' } },
      { status: 500 }
    );
  }
}
