import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToStream } from '@react-pdf/renderer';
import { ReceiptPDF } from '@/lib/pdf/ReceiptPDF';
import { Receipt } from '@nnoo/contracts';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const supabase = await createClient();

  const { data: receipt, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !receipt) {
    return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
  }

  try {
    const stream = await renderToStream(
      <ReceiptPDF receipt={receipt as unknown as Receipt} />
    );

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `inline; filename="receipt_${receipt.receipt_number}.pdf"`);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - ReadableStream is compatible with Web Stream API in Next.js App Router
    return new NextResponse(stream, { headers });
  } catch (err) {
    console.error('PDF Generation Error:', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
