import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BusinessHealthService } from '@/server/ai';

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
            code: 'BUSINESS_HEALTH_FORBIDDEN',
            message: 'You must be authenticated to view Business Health Score.',
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
            code: 'BUSINESS_HEALTH_FORBIDDEN',
            message: 'You do not have an active membership in this business.',
            retryable: false,
          },
        },
        { status: 403 }
      );
    }

    // 3. Retrieve deterministic health score
    const scoreResult = await BusinessHealthService.getCurrentScore({
      supabase,
      businessId,
      userId: user.id,
      userRole: membership.role,
    });

    return NextResponse.json({
      success: true,
      data: scoreResult,
    });
  } catch (error: any) {
    const status = error.code === 'BUSINESS_HEALTH_FORBIDDEN' ? 403 : 500;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'BUSINESS_HEALTH_CALCULATION_FAILED',
          message: error.message || 'An unexpected error occurred while calculating Business Health Score.',
          retryable: error.retryable ?? false,
        },
      },
      { status }
    );
  }
}
