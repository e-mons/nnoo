import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToStream } from '@react-pdf/renderer';
import { InvoicePDF } from '@/lib/pdf/InvoicePDF';
import { InvoiceWithLines } from '@nnoo/contracts';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      lines:invoice_lines(*)
    `)
    .eq('id', id)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const { data: membership, error: memError } = await supabase
    .from('business_memberships')
    .select('role')
    .eq('business_id', invoice.business_id)
    .eq('user_id', user.id)
    .eq('membership_status', 'active')
    .maybeSingle();

  if (memError || !membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const stream = await renderToStream(
      <InvoicePDF invoice={invoice as unknown as InvoiceWithLines} />
    );

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `inline; filename="invoice_${invoice.invoice_number || 'draft'}.pdf"`);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - ReadableStream is compatible with Web Stream API in Next.js App Router
    return new NextResponse(stream, { headers });
  } catch (err) {
    console.error('PDF Generation Error:', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
