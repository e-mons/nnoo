import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Users } from 'lucide-react';
import { CustomerForm } from '@/components/customers/customer-form';
import { getCustomer } from '@/lib/actions/customer';

export const metadata: Metadata = {
  title: 'Edit Customer | NNOO',
  description: 'Edit a customer record.',
};

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ businessSlug: string; id: string }>;
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

  const { data: customer, error } = await getCustomer(business.id, resolvedParams.id);

  if (error || !customer) {
    return <div className="text-white p-8">Customer not found or access denied.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-[#B8F25C]" />
          Edit Customer
        </h1>
        <p className="text-white/60 text-sm mt-1">
          Updating record for {customer.name}
        </p>
      </div>

      <CustomerForm 
        businessId={business.id} 
        businessSlug={resolvedParams.businessSlug}
        customerId={customer.id}
        isEdit={true}
        initialData={{
          customerType: customer.customerType,
          name: customer.name,
          companyName: customer.companyName || '',
          phone: customer.phone || '',
          email: customer.email || '',
          addressLine1: customer.addressLine1 || '',
          addressLine2: customer.addressLine2 || '',
          city: customer.city || '',
          state: customer.state || '',
          countryCode: customer.countryCode || '',
          notes: customer.notes || '',
        }}
      />
    </div>
  );
}
