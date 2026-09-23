import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AskNnooAssistantService } from '@/server/ai';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_FORBIDDEN',
            message: 'Authentication is required.',
            retryable: false,
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { businessId, message, idempotencyKey } = body;

    if (!businessId || !message || !idempotencyKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ASK_NNOO_INVALID_MESSAGE',
            message: 'businessId, message, and idempotencyKey are required.',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    // Verify membership
    const { data: membership } = await supabase
      .from('business_memberships')
      .select('role, membership_status')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('membership_status', 'active')
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ASK_NNOO_FORBIDDEN',
            message: 'User does not belong to the specified business or membership is inactive.',
            retryable: false,
          },
        },
        { status: 403 }
      );
    }

    const result = await AskNnooAssistantService.processMessage({
      supabase,
      businessId,
      userId: user.id,
      userRole: membership.role,
      conversationId: conversationId === 'new' ? undefined : conversationId,
      message,
      idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string; retryable?: boolean };
    const code = errorObj.code || 'AI_INTERNAL_ERROR';
    const status =
      code.includes('FORBIDDEN') || code.includes('RESTRICTED')
        ? 403
        : code.includes('RATE_LIMITED')
        ? 429
        : 400;

    return NextResponse.json(
      {
        success: false,
        error: {
          code,
          message: errorObj.message || 'An error occurred while processing message turn.',
          retryable: errorObj.retryable ?? false,
        },
      },
      { status }
    );
  }
}
