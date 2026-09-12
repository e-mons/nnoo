import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AIBookkeeperReviewService } from '@/server/ai';
import { ReviewDetailView } from '@/components/bookkeeper/ReviewDetailView';

interface BookkeeperDetailPageProps {
  params: Promise<{ businessSlug: string; classificationId: string }>;
}

export default async function BookkeeperDetailPage({ params }: BookkeeperDetailPageProps) {
  const { businessSlug, classificationId } = await params;
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    notFound();
  }

  // 2. Fetch Business & Membership
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('id, name, currency_code')
    .eq('id', businessSlug)
    .maybeSingle();

  if (bizError || !business) {
    notFound();
  }

  const { data: membership, error: memError } = await supabase
    .from('business_memberships')
    .select('role, membership_status')
    .eq('business_id', business.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (memError || !membership || membership.membership_status !== 'active') {
    notFound();
  }

  // 3. Fetch Classification Details via Review Service
  const reviewService = new AIBookkeeperReviewService(supabase as any);
  let classification;
  try {
    classification = await reviewService.getDetail(
      {
        businessId: business.id,
        userId: user.id,
        role: membership.role || 'read_only',
      },
      classificationId
    );
  } catch (err) {
    notFound();
  }

  // 4. Fetch Contextual Options (Categories, Suppliers, Customers, Catalog Items, Unpaid Receivables/Payables)
  const [
    categoriesRes,
    suppliersRes,
    customersRes,
    catalogItemsRes,
    unpaidSalesRes,
    unpaidExpensesRes,
    unpaidStockReceiptsRes,
  ] = await Promise.all([
    supabase
      .from('expense_categories')
      .select('id, name')
      .eq('business_id', business.id)
      .eq('status', 'active')
      .order('name'),
    supabase
      .from('suppliers')
      .select('id, name')
      .eq('business_id', business.id)
      .eq('status', 'active')
      .order('name'),
    supabase
      .from('customers')
      .select('id, name')
      .eq('business_id', business.id)
      .eq('status', 'active')
      .order('name'),
    supabase
      .from('catalog_items')
      .select('id, name, selling_price_minor, cost_price_minor')
      .eq('business_id', business.id)
      .eq('status', 'active')
      .order('name'),
    supabase
      .from('sales')
      .select('id, sale_number, total_minor, payment_status, customers(name)')
      .eq('business_id', business.id)
      .neq('payment_status', 'paid')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('expenses')
      .select('id, expense_number, total_minor, payment_status, expense_categories(name), suppliers(name)')
      .eq('business_id', business.id)
      .neq('payment_status', 'paid')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('stock_receipts')
      .select('id, receipt_number, total_minor, payment_status, suppliers(name)')
      .eq('business_id', business.id)
      .neq('payment_status', 'paid')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  return (
    <ReviewDetailView
      classification={classification}
      businessId={business.id}
      businessSlug={businessSlug}
      categories={categoriesRes.data || []}
      suppliers={suppliersRes.data || []}
      customers={customersRes.data || []}
      catalogItems={catalogItemsRes.data || []}
      unpaidSales={(unpaidSalesRes.data as any) || []}
      unpaidExpenses={(unpaidExpensesRes.data as any) || []}
      unpaidStockReceipts={(unpaidStockReceiptsRes.data as any) || []}
    />
  );
}
