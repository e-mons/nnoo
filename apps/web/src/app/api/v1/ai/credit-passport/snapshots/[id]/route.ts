import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BusinessCreditPassportService } from '@/server/ai';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
            message: 'You must be authenticated to view Credit Passport.',
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

    const snapshot = await BusinessCreditPassportService.getSnapshot({
      supabase,
      businessId,
      userRole: membership.role,
      snapshotId: id,
    });

    return NextResponse.json({
      success: true,
      data: snapshot,
    });
  } catch (err: any) {
    const status = err?.code === 'CREDIT_PASSPORT_NOT_FOUND' ? 404 : err?.code === 'CREDIT_PASSPORT_FORBIDDEN' ? 403 : 500;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: err?.code || 'CREDIT_PASSPORT_NOT_FOUND',
          message: err?.message || 'Credit Passport snapshot not found.',
          retryable: false,
        },
      },
      { status }
    );
  }
}
