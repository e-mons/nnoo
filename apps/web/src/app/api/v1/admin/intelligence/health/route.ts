import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/server/ai/admin/auth';
import { IntelligenceOverviewService } from '@/server/ai/admin/overview-service';
import { IntelligenceReportingPeriodSchema } from '@nnoo/validation/ai';
import { AISafeError } from '@/server/ai/service';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    await requirePlatformAdmin(supabase);

    const { searchParams } = new URL(req.url);
    const periodParam = searchParams.get('period') || '24h';
    const parsedPeriod = IntelligenceReportingPeriodSchema.safeParse(periodParam);
    const period = parsedPeriod.success ? parsedPeriod.data : '24h';

    const metrics = await IntelligenceOverviewService.getHealthMetrics(supabase, period);
    return NextResponse.json(metrics);
  } catch (error: any) {
    if (error instanceof AISafeError) {
      const status = error.code === 'ADMIN_UNAUTHENTICATED' ? 401 : error.code === 'ADMIN_FORBIDDEN' ? 403 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    return NextResponse.json({ error: error.message || 'Internal server error', code: 'ADMIN_INTERNAL_ERROR' }, { status: 500 });
  }
}
