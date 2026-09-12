import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AutomationService, AISafeError } from '@/server/ai';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json().catch(() => ({}));
    const businessId = body.businessId;

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: { code: 'AI_INVALID_INPUT', message: 'Field businessId is required.' } },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'AI_AUTOMATION_FORBIDDEN', message: 'Authentication required.' } },
        { status: 401 }
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
        { success: false, error: { code: 'AI_AUTOMATION_FORBIDDEN', message: 'You do not have access to this business.' } },
        { status: 403 }
      );
    }

    if (!['owner', 'business_admin', 'manager', 'accountant'].includes(membership.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'AI_AUTOMATION_FORBIDDEN', message: 'Insufficient permissions to modify automations.' } },
        { status: 403 }
      );
    }

    // Look up existing automation for this ID
    const { data: existing, error: findError } = await supabase
      .from('business_automations')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessId)
      .single();

    if (findError || !existing) {
      return NextResponse.json(
        { success: false, error: { code: 'AI_NOT_FOUND', message: 'Automation not found.' } },
        { status: 404 }
      );
    }

    const updated = await AutomationService.updateAutomation(supabase, businessId, user.id, {
      automationType: existing.automation_type as any,
      enabled: body.enabled !== undefined ? body.enabled : existing.enabled,
      frequency: (body.frequency || existing.frequency || 'daily') as any,
      scheduleLocalTime: body.scheduleLocalTime || existing.schedule_local_time || '09:00',
      scheduleWeekday: body.scheduleWeekday !== undefined ? body.scheduleWeekday : existing.schedule_weekday,
      scheduleMonthday: body.scheduleMonthday !== undefined ? body.scheduleMonthday : existing.schedule_monthday,
    });

    return NextResponse.json({
      success: true,
      data: { automation: updated },
    });
  } catch (err: any) {
    if (err instanceof AISafeError) {
      return NextResponse.json({ success: false, error: { code: err.code, message: err.message } }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: { code: 'AI_INVALID_INPUT', message: err?.message || 'Failed to update automation' } },
      { status: 400 }
    );
  }
}
