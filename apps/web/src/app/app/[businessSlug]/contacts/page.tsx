import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCustomerList } from '@/lib/actions/customer';
import { getSupplierList } from '@/lib/actions/supplier';
import { ContactsHubClient } from '@/components/contacts/ContactsHubClient';

export const metadata: Metadata = {
  title: 'Customers & Suppliers | NNOO',
  description: 'Manage customers, suppliers, balances, and contact details in one place.',
};

interface ContactsPageProps {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ContactsHubPage({ params, searchParams }: ContactsPageProps) {
  const { businessSlug } = await params;
  const { tab } = await searchParams;

  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('id', businessSlug)
    .single();

  if (!business) {
    notFound();
  }

  // Fetch customers and suppliers in parallel
  const [customersResult, suppliersResult] = await Promise.all([
    getCustomerList(business.id, { pageSize: 100 }),
    getSupplierList(business.id, { pageSize: 100 }),
  ]);

  return (
    <ContactsHubClient
      businessId={business.id}
      businessSlug={businessSlug}
      initialTab={tab || 'customers'}
      customers={customersResult.data || []}
      suppliers={suppliersResult.data || []}
    />
  );
}
