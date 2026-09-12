import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WhatsAppAdminService } from '@/server/ai/admin/whatsapp-admin-service';
import { RetryFailedWhatsAppDeliveryInputSchema } from '@nnoo/validation/ai';
import { AISafeError } from '@/server/ai/service';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const parsed = RetryFailedWhatsAppDeliveryInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid retry parameters: ' + parsed.error.issues.map((i) => i.message).join(', '), code: 'ADMIN_INVALID_FILTER' },
        { status: 400 }
      );
    }

    const result = await WhatsAppAdminService.retryFailedDelivery(supabase, parsed.data);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof AISafeError) {
      const status = error.code === 'ADMIN_UNAUTHENTICATED' ? 401 : error.code === 'ADMIN_FORBIDDEN' ? 403 : error.code === 'ADMIN_DELIVERY_RETRY_BLOCKED' ? 409 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    return NextResponse.json({ error: error.message || 'Internal server error', code: 'ADMIN_INTERNAL_ERROR' }, { status: 500 });
  }
}
