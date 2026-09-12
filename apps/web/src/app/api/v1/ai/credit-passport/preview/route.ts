import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BusinessCreditPassportService } from '@/server/ai';

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
            code: 'CREDIT_PASSPORT_FORBIDDEN',
            message: 'You must be authenticated to view Credit Passport.',
            retryable: false,
          },
        },
        { status: 401 }
      );
    }

    // 2. Resolve businessId and membership
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

    // 3. Build current preview
    const preview = await BusinessCreditPassportService.getPreview({
      supabase,
      businessId,
      userRole: membership.role,
    });

    return NextResponse.json({
      success: true,
      data: preview,
    });
  } catch (err: any) {
    const status = err?.code === 'CREDIT_PASSPORT_FORBIDDEN' ? 403 : 500;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: err?.code || 'CREDIT_PASSPORT_GENERATION_FAILED',
          message: err?.message || 'Failed to retrieve Credit Passport preview.',
          retryable: err?.retryable ?? true,
        },
      },
      { status }
    );
  }
}
