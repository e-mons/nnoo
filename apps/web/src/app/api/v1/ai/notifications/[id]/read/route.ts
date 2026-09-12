import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { NotificationService } from '@/server/ai';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: notificationId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const businessId = body.businessId;

    if (!businessId || !notificationId) {
      return NextResponse.json(
        { success: false, error: { code: 'AI_INVALID_INPUT', message: 'Parameters businessId and notificationId are required.' } },
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

    await NotificationService.markAsRead(supabase, {
      businessId,
      userId: user.id,
      notificationId,
    });

    return NextResponse.json({
      success: true,
      data: { markedRead: true },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'NOTIFICATION_PROCESSING_FAILED', message: err?.message || 'Failed to mark notification as read' } },
      { status: 500 }
    );
  }
}
