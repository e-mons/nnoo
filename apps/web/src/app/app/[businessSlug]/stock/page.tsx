import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCatalogList } from '@/lib/actions/catalog';
import { getInventoryPositions } from '@/lib/actions/inventory';
import { StockHubClient } from '@/components/stock/StockHubClient';

export const metadata: Metadata = {
  title: 'Items & Stock | NNOO',
  description: 'Manage products, prices, live inventory quantities, and stock alerts.',
};

interface StockPageProps {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function StockHubPage({ params, searchParams }: StockPageProps) {
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

  // Fetch catalog, inventory positions, and categories in parallel
  const [catalogResult, positions, categoriesResult] = await Promise.all([
    getCatalogList(business.id, new URLSearchParams()),
    getInventoryPositions(business.id),
    supabase
      .from('product_categories')
      .select('*')
      .eq('business_id', business.id)
      .order('name', { ascending: true }),
  ]);

  return (
    <StockHubClient
      businessId={business.id}
      businessSlug={businessSlug}
      currencyCode={business.currency_code || 'NGN'}
      initialTab={tab || 'items'}
      catalogItems={catalogResult.data || []}
      inventoryPositions={positions || []}
      categories={categoriesResult.data || []}
    />
  );
}
