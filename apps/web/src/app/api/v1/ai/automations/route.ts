import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AutomationService, AISafeError } from '@/server/ai';
import { UpdateAutomationInputSchema } from '@nnoo/validation';

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

    const automations = await AutomationService.getAutomations(supabase, businessId);

    return NextResponse.json({
      success: true,
      data: { automations },
    });
  } catch (err: any) {
    if (err instanceof AISafeError) {
      return NextResponse.json({ success: false, error: { code: err.code, message: err.message } }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: { code: 'AI_INTERNAL_ERROR', message: err?.message || 'Failed to fetch automations' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const validatedInput = UpdateAutomationInputSchema.parse(body);

    const updated = await AutomationService.updateAutomation(supabase, businessId, user.id, validatedInput);

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
