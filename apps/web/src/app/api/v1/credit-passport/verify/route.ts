import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BusinessCreditPassportService } from '@/server/ai';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const hash = searchParams.get('hash') || undefined;

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_INVALID_INPUT',
            message: 'Query parameter "code" is required.',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    const verificationResult = await BusinessCreditPassportService.verifyPassport({
      supabase,
      passportCode: code,
      artifactHash: hash,
    });

    return NextResponse.json({
      success: true,
      data: verificationResult,
    });
  } catch (err: any) {
    const status = err?.code === 'CREDIT_PASSPORT_NOT_FOUND' ? 404 : 400;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: err?.code || 'CREDIT_PASSPORT_VERIFICATION_FAILED',
          message: err?.message || 'Verification failed.',
          retryable: false,
        },
      },
      { status }
    );
  }
}
