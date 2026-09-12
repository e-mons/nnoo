import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CorrectBookkeepingInputSchema } from '@nnoo/validation';
import { AIBookkeeperReviewService, AISafeError } from '@/server/ai';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = CorrectBookkeepingInputSchema.safeParse({ ...body, classificationId: id });

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'AI_BOOKKEEPER_INVALID_INPUT', message: 'Invalid correction payload.', details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId') || body.businessId;

    if (!businessId) {
      return NextResponse.json(
        { error: { code: 'AI_BOOKKEEPER_INVALID_INPUT', message: 'businessId is required.' } },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'AI_FORBIDDEN', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const { data: membership, error: memError } = await supabase
      .from('business_memberships')
      .select('role, membership_status')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (memError || !membership || membership.membership_status !== 'active') {
      return NextResponse.json(
        { error: { code: 'AI_FORBIDDEN', message: 'Active business membership is required.' } },
        { status: 403 }
      );
    }

    const service = new AIBookkeeperReviewService(supabase as any);
    const result = await service.correctSuggestion(parsed.data, {
      businessId,
      userId: user.id,
      role: membership.role || 'read_only',
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof AISafeError) {
      const status =
        error.code === 'AI_BOOKKEEPER_REVIEW_NOT_FOUND'
          ? 404
          : error.code === 'AI_FORBIDDEN' || error.code === 'AI_BOOKKEEPER_REVIEW_FORBIDDEN'
          ? 403
          : 400;
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status });
    }
    return NextResponse.json(
      { error: { code: 'AI_INTERNAL_ERROR', message: error.message || 'Internal server error.' } },
      { status: 500 }
    );
  }
}
