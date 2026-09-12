import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/server/ai/admin/auth';
import { PlatformFeatureControlsService } from '@/server/ai/admin/feature-controls-service';
import { UpdatePlatformFeatureControlInputSchema } from '@nnoo/validation/ai';
import { AISafeError } from '@/server/ai/service';

export async function GET() {
  try {
    const supabase = await createClient();
    await requirePlatformAdmin(supabase);

    const controls = await PlatformFeatureControlsService.getControls(supabase);
    return NextResponse.json({ controls });
  } catch (error: any) {
    if (error instanceof AISafeError) {
      const status = error.code === 'ADMIN_UNAUTHENTICATED' ? 401 : error.code === 'ADMIN_FORBIDDEN' ? 403 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    return NextResponse.json({ error: error.message || 'Internal server error', code: 'ADMIN_INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const parsed = UpdatePlatformFeatureControlInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid control update payload: ' + parsed.error.issues.map((i) => i.message).join(', '), code: 'ADMIN_INVALID_FILTER' },
        { status: 400 }
      );
    }

    const updated = await PlatformFeatureControlsService.updateControl(supabase, parsed.data);
    return NextResponse.json({ control: updated });
  } catch (error: any) {
    if (error instanceof AISafeError) {
      const status = error.code === 'ADMIN_UNAUTHENTICATED' ? 401 : error.code === 'ADMIN_FORBIDDEN' ? 403 : error.code === 'ADMIN_REASON_REQUIRED' ? 400 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    return NextResponse.json({ error: error.message || 'Internal server error', code: 'ADMIN_INTERNAL_ERROR' }, { status: 500 });
  }
}
