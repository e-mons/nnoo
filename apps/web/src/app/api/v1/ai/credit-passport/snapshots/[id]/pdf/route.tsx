import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToStream } from '@react-pdf/renderer';
import { CreditPassportPDF } from '@/lib/pdf/CreditPassportPDF';
import { BusinessCreditPassportService } from '@/server/ai';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CREDIT_PASSPORT_FORBIDDEN',
            message: 'You must be authenticated to download Credit Passport PDF.',
            retryable: false,
          },
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_INVALID_INPUT',
            message: 'Parameter businessId is required.',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    const { data: membership, error: memberError } = await supabase
      .from('business_memberships')
      .select('role, membership_status')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership || membership.membership_status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CREDIT_PASSPORT_FORBIDDEN',
            message: 'You do not have an active membership in this business.',
            retryable: false,
          },
        },
        { status: 403 }
      );
    }

    const snapshot = await BusinessCreditPassportService.getSnapshot({
      supabase,
      businessId,
      userRole: membership.role,
      snapshotId: id,
    });

    const stream = await renderToStream(<CreditPassportPDF snapshot={snapshot} />);

    const safeBizName = snapshot.payload.businessIdentity.name
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();
    const filename = `nnoo_credit_passport_${safeBizName}_v${snapshot.passportVersion}.pdf`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `inline; filename="${filename}"`);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - ReadableStream is compatible with Web Stream API in Next.js App Router
    return new NextResponse(stream, { headers });
  } catch (err: any) {
    console.error('Credit Passport PDF Generation Error:', err);
    const status = err?.code === 'CREDIT_PASSPORT_FORBIDDEN' ? 403 : err?.code === 'CREDIT_PASSPORT_NOT_FOUND' ? 404 : 500;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: err?.code || 'CREDIT_PASSPORT_PDF_FAILED',
          message: err?.message || 'Failed to generate Credit Passport PDF.',
          retryable: false,
        },
      },
      { status }
    );
  }
}
