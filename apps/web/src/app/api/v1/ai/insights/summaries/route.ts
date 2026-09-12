import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AIBusinessInsightService } from '@/server/ai';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
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
            message: 'You must be authenticated to view summary history.',
            retryable: false,
          },
        },
        { status: 401 }
      );
    }

    // 2. Resolve businessId & membership
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_INVALID_INPUT',
            message: 'Parameter businessId is required.',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    const { data: membership, error: memberError } = await supabase
      .from('business_memberships')
      .select('role, membership_status')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership || membership.membership_status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_BUSINESS_RESTRICTED',
            message: 'You do not have active membership in this business.',
            retryable: false,
          },
        },
        { status: 403 }
      );
    }

    // 3. Fetch history
    const history = await AIBusinessInsightService.getSummaryHistory(supabase, businessId, user.id, limit);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string; retryable?: boolean };
    const code = errorObj.code || 'AI_INTERNAL_ERROR';
    const message = errorObj.message || 'An unexpected error occurred while fetching summary history.';
    const status = code.includes('FORBIDDEN') || code.includes('RESTRICTED') ? 403 : 400;

    return NextResponse.json(
      {
        success: false,
        error: {
          code,
          message,
          retryable: errorObj.retryable ?? false,
        },
      },
      { status }
    );
  }
}
