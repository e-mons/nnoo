import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AutomationService, AISafeError } from '@/server/ai';
import { RunAutomationNowInputSchema } from '@nnoo/validation';

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
        { success: false, error: { code: 'AI_AUTOMATION_FORBIDDEN', message: 'Insufficient permissions to trigger automations.' } },
        { status: 403 }
      );
    }

    const validatedInput = RunAutomationNowInputSchema.parse(body);

    const result = await AutomationService.runNow(
      supabase,
      businessId,
      user.id,
      membership.role,
      validatedInput.automationType,
      validatedInput.idempotencyKey
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    if (err instanceof AISafeError) {
      return NextResponse.json({ success: false, error: { code: err.code, message: err.message } }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: { code: 'AI_AUTOMATION_RUN_FAILED', message: err?.message || 'Failed to trigger automation' } },
      { status: 500 }
    );
  }
}
