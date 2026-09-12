import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WhatsAppLinkingService } from '@/server/ai';

/**
 * POST /api/v1/ai/whatsapp/switch-business
 * Switches the active business context for WhatsApp interactions.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json().catch(() => ({}));
    const targetBusinessId = body.targetBusinessId;

    if (!targetBusinessId) {
      return NextResponse.json(
        { success: false, error: { code: 'AI_INVALID_INPUT', message: 'Field targetBusinessId is required.' } },
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

    const result = await WhatsAppLinkingService.switchActiveBusiness(supabase as any, user.id, targetBusinessId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'WHATSAPP_PROVIDER_ERROR', message: err?.message || 'Failed to switch active business' } },
      { status: 500 }
    );
  }
}
