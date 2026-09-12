import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BusinessHealthService } from '@/server/ai';
import { ExplainBusinessHealthScoreInputSchema } from '@nnoo/validation';

export async function POST(request: NextRequest) {
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
            code: 'BUSINESS_HEALTH_FORBIDDEN',
            message: 'You must be authenticated to request an AI explanation.',
            retryable: false,
          },
        },
        { status: 401 }
      );
    }

    // 2. Parse request payload
    const body = await request.json().catch(() => ({}));
    const businessId = body.businessId;

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_INVALID_INPUT',
            message: 'Field businessId is required.',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    const validatedInput = ExplainBusinessHealthScoreInputSchema.parse(body);

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
            code: 'BUSINESS_HEALTH_FORBIDDEN',
            message: 'You do not have an active membership in this business.',
            retryable: false,
          },
        },
        { status: 403 }
      );
    }

    // 3. Generate grounded Gemini explanation
    const explanation = await BusinessHealthService.explainScore(
      {
        supabase,
        businessId,
        userId: user.id,
        userRole: membership.role,
      },
      validatedInput
    );

    return NextResponse.json({
      success: true,
      data: explanation,
    });
  } catch (error: any) {
    const status = error.code === 'BUSINESS_HEALTH_FORBIDDEN' ? 403 : 500;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'BUSINESS_HEALTH_EXPLANATION_FAILED',
          message: error.message || 'An unexpected error occurred while generating score explanation.',
          retryable: error.retryable ?? false,
        },
      },
      { status }
    );
  }
}
