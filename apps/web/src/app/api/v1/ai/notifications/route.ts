import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { NotificationService } from '@/server/ai';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20;
    const cursor = searchParams.get('cursor');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: { code: 'AI_INVALID_INPUT', message: 'Parameter businessId is required.' } },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOTIFICATION_FORBIDDEN', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const { data: membership, error: memberError } = await supabase
      .from('business_memberships')
      .select('role, membership_status')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError || !membership || membership.membership_status !== 'active') {
      return NextResponse.json(
        { success: false, error: { code: 'NOTIFICATION_FORBIDDEN', message: 'Active membership required.' } },
        { status: 403 }
      );
    }

    const feed = await NotificationService.getNotifications(supabase, {
      businessId,
      userId: user.id,
      limit,
      cursor,
      unreadOnly,
    });

    return NextResponse.json({
      success: true,
      data: feed,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'NOTIFICATION_PROCESSING_FAILED', message: err?.message || 'Failed to fetch notifications' } },
      { status: 500 }
    );
  }
}
