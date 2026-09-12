import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get('type');
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const businessId = searchParams.get('businessId');

  if (!type || !start || !end || !businessId) {
    return new NextResponse('Missing required parameters', { status: 400 });
  }

  const supabase = await createClient();

  // Validate business membership (RLS protects queries, but good to check explicit access)
  const { data: membership, error: memError } = await supabase
    .from('business_memberships')
    .select('role')
    .eq('business_id', businessId)
    .single();

  if (memError || !membership) {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  let csvRows: string[] = [];

  // Protect against CSV Injection (Formula Injection)
  const escapeCell = (val: string | number | null | undefined) => {
    if (val === null || val === undefined) return '';
    let str = String(val).replace(/"/g, '""');
    if (str.match(/^[=@+-]/)) {
      str = "'" + str;
    }
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str}"`;
    }
    return str;
  };

  if (type === 'sales') {
    const { data: sales, error } = await supabase
      .from('sales')
      .select('sale_number, effective_date, total_minor, currency_code, payment_status, refund_status')
      .eq('business_id', businessId)
      .gte('effective_date', start)
      .lte('effective_date', end)
      .order('effective_date', { ascending: true });
      
    if (error) return new NextResponse('Error fetching data', { status: 500 });

    csvRows.push(['Date', 'Sale Number', 'Currency', 'Total Minor', 'Payment Status', 'Refund Status'].map(escapeCell).join(','));
    sales?.forEach(s => {
      csvRows.push([
        s.effective_date,
        s.sale_number,
        s.currency_code,
        s.total_minor,
        s.payment_status,
        s.refund_status
      ].map(escapeCell).join(','));
    });
  } else {
    return new NextResponse('Unknown report type', { status: 400 });
  }

  const csvString = csvRows.join('\n');
  const headers = new Headers();
  headers.set('Content-Type', 'text/csv');
  headers.set('Content-Disposition', `attachment; filename="${type}_report_${start}_to_${end}.csv"`);

  return new NextResponse(csvString, { status: 200, headers });
}
