import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AutomationService, AISafeError } from '@/server/ai';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

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

    const { runs, total } = await AutomationService.getRunHistory(supabase, businessId, limit, offset);

    return NextResponse.json({
      success: true,
      data: { runs, total, limit, offset },
    });
  } catch (err: any) {
    if (err instanceof AISafeError) {
      return NextResponse.json({ success: false, error: { code: err.code, message: err.message } }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: { code: 'AI_INTERNAL_ERROR', message: err?.message || 'Failed to fetch run history' } },
      { status: 500 }
    );
  }
}
