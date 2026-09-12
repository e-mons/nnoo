import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BusinessCreditPassportService } from '@/server/ai';
import { ExplainCreditPassportInputSchema } from '@nnoo/validation';

export async function POST(request: NextRequest) {
  try {
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
            code: 'CREDIT_PASSPORT_FORBIDDEN',
            message: 'You must be authenticated to request Credit Passport explanations.',
            retryable: false,
          },
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

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
            code: 'CREDIT_PASSPORT_FORBIDDEN',
            message: 'You do not have an active membership in this business.',
            retryable: false,
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = ExplainCreditPassportInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_INVALID_INPUT',
            message: 'Parameter snapshotId is required.',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    const explanation = await BusinessCreditPassportService.explainPassport({
      supabase,
      businessId,
      userId: user.id,
      userRole: membership.role,
      input: parsed.data,
    });

    return NextResponse.json({
      success: true,
      data: explanation,
    });
  } catch (err: any) {
    const status =
      err?.code === 'CREDIT_PASSPORT_FORBIDDEN'
        ? 403
        : err?.code === 'CREDIT_PASSPORT_NOT_FOUND'
        ? 404
        : err?.code === 'CREDIT_PASSPORT_EXPLANATION_INVALID'
        ? 422
        : 500;

    return NextResponse.json(
      {
        success: false,
        error: {
          code: err?.code || 'CREDIT_PASSPORT_EXPLANATION_FAILED',
          message: err?.message || 'Failed to generate Credit Passport explanation.',
          retryable: false,
        },
      },
      { status }
    );
  }
}
