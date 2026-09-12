import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BusinessCreditPassportService } from '@/server/ai';
import { CreateCreditPassportShareInputSchema } from '@nnoo/validation';

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
            message: 'You must be authenticated to share a Credit Passport.',
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
    const parsed = CreateCreditPassportShareInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_INVALID_INPUT',
            message: 'Invalid share payload.',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    const origin = request.nextUrl.origin;
    const share = await BusinessCreditPassportService.createShare({
      supabase,
      businessId,
      userId: user.id,
      userRole: membership.role,
      input: parsed.data,
      baseUrl: origin,
    });

    return NextResponse.json({
      success: true,
      data: share,
    });
  } catch (err: any) {
    const status = err?.code === 'CREDIT_PASSPORT_SHARE_FORBIDDEN' ? 403 : 500;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: err?.code || 'CREDIT_PASSPORT_GENERATION_FAILED',
          message: err?.message || 'Failed to create share link.',
          retryable: false,
        },
      },
      { status }
    );
  }
}

export async function GET(request: NextRequest) {
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
            message: 'You must be authenticated to view shares.',
            retryable: false,
          },
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const snapshotId = searchParams.get('snapshotId') || undefined;

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

    const shares = await BusinessCreditPassportService.listShares({
      supabase,
      businessId,
      userRole: membership.role,
      snapshotId,
    });

    return NextResponse.json({
      success: true,
      data: shares,
    });
  } catch (err: any) {
    const status = err?.code === 'CREDIT_PASSPORT_FORBIDDEN' ? 403 : 500;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: err?.code || 'CREDIT_PASSPORT_GENERATION_FAILED',
          message: err?.message || 'Failed to retrieve shares.',
          retryable: false,
        },
      },
      { status }
    );
  }
}
