import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WhatsAppLinkingService } from '@/server/ai';

/**
 * GET /api/v1/ai/whatsapp/status?businessId=<id>
 * Fetches current user WhatsApp connection status and available businesses.
 * Direct endpoint for mobile and external client parity.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: { code: 'AI_INVALID_INPUT', message: 'Parameter businessId is required.' } },
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

    const summary = await WhatsAppLinkingService.getConnectionSummary(supabase as any, businessId, user.id);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'WHATSAPP_PROVIDER_ERROR', message: err?.message || 'Failed to fetch connection status' } },
      { status: 500 }
    );
  }
}
