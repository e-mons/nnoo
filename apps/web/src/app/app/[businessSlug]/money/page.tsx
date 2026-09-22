import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSalesList } from '@/lib/actions/sales';
import { getInvoicesList } from '@/lib/actions/invoices';
import { getExpensesList } from '@/lib/actions/expenses';
import { MoneyHubClient } from '@/components/money/MoneyHubClient';

export const metadata: Metadata = {
  title: 'Money & Sales | NNOO',
  description: 'Manage sales, expenses, invoices, and cashflow in one unified hub.',
};

interface MoneyPageProps {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function MoneyHubPage({ params, searchParams }: MoneyPageProps) {
  const { businessSlug } = await params;
  const { tab } = await searchParams;

  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, currency_code')
    .eq('id', businessSlug)
    .single();

  if (!business) {
    notFound();
  }

  // Fetch sales, invoices, expenses, and receipts in parallel
  const [sales, invoices, expenses, receiptsResult] = await Promise.all([
    getSalesList(business.id, { limit: 100 }),
    getInvoicesList(business.id, { limit: 100 }),
    getExpensesList(business.id),
    supabase
      .from('receipts')
      .select(`
        id,
        receipt_number,
        amount_minor,
        currency_code,
        payment_occurred_at,
        payment_method_snapshot,
        customer_snapshot,
        sale_number_snapshot
      `)
      .eq('business_id', business.id)
      .order('payment_occurred_at', { ascending: false })
      .limit(100),
  ]);

  return (
    <MoneyHubClient
      businessId={business.id}
      businessSlug={businessSlug}
      currencyCode={business.currency_code || 'NGN'}
      initialTab={tab || 'activity'}
      sales={sales || []}
      invoices={invoices || []}
      receipts={receiptsResult.data || []}
      expenses={expenses || []}
    />
  );
}
