import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BusinessCreditPassportService } from '@/server/ai';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createClient();

    const projection = await BusinessCreditPassportService.getExternalShare({
      supabase,
      token,
    });

    return NextResponse.json({
      success: true,
      data: projection,
    });
  } catch (err: any) {
    const status =
      err?.code === 'CREDIT_PASSPORT_SHARE_EXPIRED'
        ? 410
        : err?.code === 'CREDIT_PASSPORT_SHARE_REVOKED'
        ? 403
        : err?.code === 'CREDIT_PASSPORT_SHARE_NOT_FOUND'
        ? 404
        : 500;

    return NextResponse.json(
      {
        success: false,
        error: {
          code: err?.code || 'CREDIT_PASSPORT_SHARE_NOT_FOUND',
          message: err?.message || 'This Credit Passport is currently unavailable.',
          retryable: false,
        },
      },
      { status }
    );
  }
}
