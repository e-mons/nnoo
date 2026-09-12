import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AIBusinessInsightService } from '@/server/ai';
import { GenerateBusinessSummaryInputSchema } from '@nnoo/validation';

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
            code: 'AI_FORBIDDEN',
            message: 'You must be authenticated to generate business summaries.',
            retryable: false,
          },
        },
        { status: 401 }
      );
    }

    // 2. Validate payload
    const body = await request.json();
    const parsed = GenerateBusinessSummaryInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_INVALID_INPUT',
            message: 'Invalid summary generation payload.',
            retryable: false,
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { summaryType, startDate, endDate, idempotencyKey } = parsed.data;
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId') || body.businessId;

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

    // 3. Generate summary
    const summary = await AIBusinessInsightService.generateSummary({
      supabase,
      businessId,
      userId: user.id,
      userRole: membership.role,
      summaryType,
      startDate,
      endDate,
      idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string; retryable?: boolean };
    const code = errorObj.code || 'AI_INTERNAL_ERROR';
    const message = errorObj.message || 'An unexpected error occurred while generating business summary.';
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
          message,
          retryable: errorObj.retryable ?? false,
        },
      },
      { status }
    );
  }
}
