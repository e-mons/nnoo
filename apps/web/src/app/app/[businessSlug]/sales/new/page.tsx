import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { NewSaleForm } from '@/components/sales/NewSaleForm';
import { getCatalogList } from '@/lib/actions/catalog';
import { getCustomerList } from '@/lib/actions/customer';

export const metadata: Metadata = {
  title: 'New Sale | NNOO',
  description: 'Create a new sale.',
};

export default async function NewSalePage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const resolvedParams = await params;
  const supabase = await createClient();
  
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, currency_code')
    .eq('id', resolvedParams.businessSlug)
    .single();

  if (!business) {
    return <div className="text-white">Business not found.</div>;
  }

  // Pre-fetch active catalog and active customers
  const catalogParams = new URLSearchParams();
  catalogParams.set('status', 'active');
  const { data: catalog } = await getCatalogList(business.id, catalogParams);
  
  const customerParams = { status: 'active' as const };
  const customersRes = await getCustomerList(business.id, customerParams);
  const customers = customersRes.data || [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Create New Sale</h1>
        <p className="text-white/60 text-sm mt-1">
          Record a new sale for {business.name}
        </p>
      </div>

      <NewSaleForm 
        businessId={business.id}
        businessSlug={resolvedParams.businessSlug}
        currencyCode={business.currency_code}
        catalogItems={catalog || []}
        customers={customers || []}
      />
    </div>
  );
}
