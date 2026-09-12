import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PushDeviceService } from '@/server/ai';
import { RevokePushDeviceInputSchema } from '@nnoo/validation';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'PUSH_UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = RevokePushDeviceInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PUSH_DEVICE_INVALID',
            message: 'Invalid revocation input.',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    await PushDeviceService.revokeDevice(supabase, user.id, parsed.data.installationId);

    return NextResponse.json({ success: true, data: { revoked: true } }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to revoke push device';
    return NextResponse.json(
      { success: false, error: { code: 'PUSH_DEVICE_NOT_FOUND', message } },
      { status: 500 }
    );
  }
}
