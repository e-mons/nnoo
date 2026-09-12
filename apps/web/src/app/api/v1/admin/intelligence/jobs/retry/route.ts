import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { JobAdminService } from '@/server/ai/admin/job-admin-service';
import { RetryFailedJobInputSchema } from '@nnoo/validation/ai';
import { AISafeError } from '@/server/ai/service';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const parsed = RetryFailedJobInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid retry parameters: ' + parsed.error.issues.map((i) => i.message).join(', '), code: 'ADMIN_INVALID_FILTER' },
        { status: 400 }
      );
    }

    const result = await JobAdminService.retryFailedJob(supabase, parsed.data);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof AISafeError) {
      const status = error.code === 'ADMIN_UNAUTHENTICATED' ? 401 : error.code === 'ADMIN_FORBIDDEN' ? 403 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    return NextResponse.json({ error: error.message || 'Internal server error', code: 'ADMIN_INTERNAL_ERROR' }, { status: 500 });
  }
}
