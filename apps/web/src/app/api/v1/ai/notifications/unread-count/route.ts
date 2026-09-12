import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { NotificationService } from '@/server/ai';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

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

    const unreadCount = await NotificationService.getUnreadCount(supabase, {
      businessId,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      data: { unreadCount },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'NOTIFICATION_PROCESSING_FAILED', message: err?.message || 'Failed to fetch unread count' } },
      { status: 500 }
    );
  }
}
