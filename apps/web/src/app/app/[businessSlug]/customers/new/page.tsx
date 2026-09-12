import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Users } from 'lucide-react';
import { CustomerForm } from '@/components/customers/customer-form';

export const metadata: Metadata = {
  title: 'New Customer | NNOO',
  description: 'Add a new customer to your business.',
};

export default async function NewCustomerPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const resolvedParams = await params;
  const supabase = await createClient();
  
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('id', resolvedParams.businessSlug)
    .single();

  if (!business) {
    return <div className="text-white p-8">Business not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-[#B8F25C]" />
          New Customer
        </h1>
        <p className="text-white/60 text-sm mt-1">
          Create a new customer record for {business.name}.
        </p>
      </div>

      <CustomerForm 
        businessId={business.id} 
        businessSlug={resolvedParams.businessSlug} 
      />
    </div>
  );
}
