import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PushDeviceService } from '@/server/ai';
import { RegisterPushDeviceInputSchema } from '@nnoo/validation';

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
    const parsed = RegisterPushDeviceInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PUSH_DEVICE_INVALID',
            message: 'Invalid device registration input.',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const device = await PushDeviceService.registerDevice(supabase, user.id, parsed.data);

    return NextResponse.json({ success: true, data: device }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to register push device';
    return NextResponse.json(
      { success: false, error: { code: 'PUSH_DEVICE_INVALID', message } },
      { status: 500 }
    );
  }
}

export async function GET() {
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

    const devices = await PushDeviceService.listActiveDevices(supabase, user.id);

    return NextResponse.json({ success: true, data: devices }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list push devices';
    return NextResponse.json(
      { success: false, error: { code: 'PUSH_DEVICE_INVALID', message } },
      { status: 500 }
    );
  }
}
