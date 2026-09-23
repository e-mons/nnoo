import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WhatsAppLinkingService } from '@/server/ai';

/**
 * GET /api/v1/ai/whatsapp/link?businessId=<id>
 * Fetches current user WhatsApp connection status and available businesses.
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
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string };
    const statusCode = errorObj.code === 'ASK_NNOO_FORBIDDEN' ? 403 : 500;
    return NextResponse.json(
      { success: false, error: { code: errorObj.code || 'WHATSAPP_PROVIDER_ERROR', message: errorObj.message || 'Failed to fetch connection summary' } },
      { status: statusCode }
    );
  }
}

/**
 * POST /api/v1/ai/whatsapp/link
 * Generates a one-time link code for connecting WhatsApp.
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

    const linkResult = await WhatsAppLinkingService.createLinkRequest(supabase as any, businessId, user.id);

    return NextResponse.json({
      success: true,
      data: linkResult,
    });
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string };
    const statusCode = errorObj.code === 'ASK_NNOO_FORBIDDEN' ? 403 : 500;
    return NextResponse.json(
      { success: false, error: { code: errorObj.code || 'WHATSAPP_PROVIDER_ERROR', message: errorObj.message || 'Failed to generate link code' } },
      { status: statusCode }
    );
  }
}
