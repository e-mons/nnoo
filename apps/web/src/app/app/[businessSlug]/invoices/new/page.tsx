import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCatalogList } from '@/lib/actions/catalog';
import { getCustomerList } from '@/lib/actions/customer';
import { NewInvoiceForm } from '@/components/invoices/NewInvoiceForm';

export default async function NewInvoicePage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const resolvedParams = await params;
  const businessSlug = resolvedParams.businessSlug;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, currency_code')
    .eq('id', businessSlug)
    .single();

  if (!business) notFound();

  // Fetch active catalog and active customers
  const catalogParams = new URLSearchParams();
  catalogParams.set('status', 'active');
  const { data: catalog } = await getCatalogList(business.id, catalogParams);
  
  const customerParams = { status: 'active' as const };
  const customersRes = await getCustomerList(business.id, customerParams);
  const customers = customersRes.data || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href={`/app/${businessSlug}/invoices`}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Create Invoice</h1>
          <p className="text-white/60">Draft a new invoice for a customer</p>
        </div>
      </div>

      <NewInvoiceForm
        businessId={business.id}
        businessSlug={businessSlug}
        currencyCode={business.currency_code}
        catalogItems={catalog || []}
        customers={customers || []}
      />
    </div>
  );
}
