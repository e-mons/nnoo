import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BusinessCreditPassportService } from '@/server/ai';

export async function DELETE(
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
            message: 'You must be authenticated to revoke a share.',
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

    const result = await BusinessCreditPassportService.revokeShare({
      supabase,
      businessId,
      userId: user.id,
      userRole: membership.role,
      shareId: id,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    const status = err?.code === 'CREDIT_PASSPORT_SHARE_FORBIDDEN' ? 403 : 500;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: err?.code || 'CREDIT_PASSPORT_GENERATION_FAILED',
          message: err?.message || 'Failed to revoke share.',
          retryable: false,
        },
      },
      { status }
    );
  }
}
