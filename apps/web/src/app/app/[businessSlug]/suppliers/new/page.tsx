import { Metadata } from 'next';
import { SupplierForm } from '@/components/suppliers/supplier-form';
import { Truck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'New Supplier | NNOO',
  description: 'Add a new supplier to your business.',
};

export default async function NewSupplierPage({
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
    redirect('/app');
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#B8F25C]/20 flex items-center justify-center shrink-0">
          <Truck className="w-6 h-6 text-[#B8F25C]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Add New Supplier</h1>
          <p className="text-white/60 text-sm mt-1">
            Create a new supplier record for {business.name}
          </p>
        </div>
      </div>

      <SupplierForm 
        businessId={business.id} 
        businessSlug={resolvedParams.businessSlug} 
      />
    </div>
  );
}
