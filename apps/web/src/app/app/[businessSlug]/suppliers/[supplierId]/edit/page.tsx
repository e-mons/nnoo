import { Metadata } from 'next';
import { SupplierForm } from '@/components/suppliers/supplier-form';
import { Truck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getSupplier } from '@/lib/actions/supplier';

export const metadata: Metadata = {
  title: 'Edit Supplier | NNOO',
  description: 'Edit a supplier.',
};

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ businessSlug: string; supplierId: string }>;
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

  const { data: supplier, error } = await getSupplier(business.id, resolvedParams.supplierId);

  if (error || !supplier) {
    return <div className="text-white p-8">Supplier not found or access denied.</div>;
  }

  const initialData = {
    supplierType: supplier.supplierType,
    name: supplier.name,
    companyName: supplier.companyName,
    contactPerson: supplier.contactPerson,
    phone: supplier.phone,
    email: supplier.email,
    addressLine1: supplier.addressLine1,
    addressLine2: supplier.addressLine2,
    city: supplier.city,
    state: supplier.state,
    countryCode: supplier.countryCode,
    notes: supplier.notes,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#B8F25C]/20 flex items-center justify-center shrink-0">
          <Truck className="w-6 h-6 text-[#B8F25C]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Supplier</h1>
          <p className="text-white/60 text-sm mt-1">
            Update {supplier.name} details for {business.name}
          </p>
        </div>
      </div>

      <SupplierForm 
        businessId={business.id} 
        businessSlug={resolvedParams.businessSlug} 
        initialData={initialData}
        supplierId={supplier.id}
        isEdit
      />
    </div>
  );
}
