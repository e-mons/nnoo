import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BookkeepingClassificationInputSchema } from '@nnoo/validation';
import { aiBookkeeperService } from '@/server/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = BookkeepingClassificationInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'AI_BOOKKEEPER_INVALID_INPUT',
            message: 'Invalid bookkeeping classification input.',
            details: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: 'AI_FORBIDDEN',
            message: 'Authentication is required for AI Bookkeeper operations.',
          },
        },
        { status: 401 }
      );
    }

    // 2. Resolve Business ID
    const businessId = parsed.data.businessId;
    if (!businessId) {
      return NextResponse.json(
        {
          error: {
            code: 'AI_BOOKKEEPER_INVALID_INPUT',
            message: 'businessId is required.',
          },
        },
        { status: 400 }
      );
    }

    // 3. Verify Business Membership & Role
    const { data: membership, error: membershipError } = await supabase
      .from('business_memberships')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        {
          error: {
            code: 'AI_BOOKKEEPER_FORBIDDEN',
            message: 'User is not an active member of this business.',
          },
        },
        { status: 403 }
      );
    }

    // Idempotency Header fallback
    const headerIdempotencyKey = request.headers.get('x-idempotency-key');
    const idempotencyKey = parsed.data.idempotencyKey || headerIdempotencyKey || undefined;

    // 4. Delegate to AI Bookkeeper Service
    const result = await aiBookkeeperService.classify(
      {
        ...parsed.data,
        idempotencyKey,
      },
      {
        userId: user.id,
        businessId,
        userRole: membership.role,
      }
    );

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err: any) {
    const statusCode =
      err.code === 'AI_BOOKKEEPER_FORBIDDEN' || err.code === 'AI_FORBIDDEN'
        ? 403
        : err.code === 'AI_BOOKKEEPER_IDEMPOTENCY_CONFLICT'
        ? 409
        : err.code === 'AI_BOOKKEEPER_INVALID_INPUT' || err.code === 'AI_INVALID_INPUT'
        ? 400
        : err.code === 'AI_RATE_LIMITED' || err.code === 'AI_PROVIDER_RATE_LIMITED'
        ? 429
        : err.code === 'AI_PROVIDER_TIMEOUT' || err.code === 'AI_PROVIDER_UNAVAILABLE'
        ? 503
        : 500;

    return NextResponse.json(
      {
        error: {
          code: err.code || 'AI_INTERNAL_ERROR',
          message: err.message || 'An unexpected error occurred during transaction classification.',
          details: err.details,
        },
      },
      { status: statusCode }
    );
  }
}
