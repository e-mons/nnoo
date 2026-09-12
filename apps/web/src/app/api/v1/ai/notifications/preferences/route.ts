import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { NotificationService } from '@/server/ai';
import { UpdateNotificationPreferenceInputSchema } from '@nnoo/validation';

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

    const preferences = await NotificationService.getPreferences(supabase, {
      businessId,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      data: { preferences },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'NOTIFICATION_PROCESSING_FAILED', message: err?.message || 'Failed to fetch preferences' } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}));
    const parseResult = UpdateNotificationPreferenceInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: { code: 'NOTIFICATION_PREFERENCE_INVALID', message: parseResult.error.message } },
        { status: 400 }
      );
    }

    const updated = await NotificationService.updatePreference(supabase, {
      businessId,
      userId: user.id,
      category: parseResult.data.category,
      channel: parseResult.data.channel,
      enabled: parseResult.data.enabled,
    });

    return NextResponse.json({
      success: true,
      data: { preference: updated },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'NOTIFICATION_PROCESSING_FAILED', message: err?.message || 'Failed to update preference' } },
      { status: 500 }
    );
  }
}
