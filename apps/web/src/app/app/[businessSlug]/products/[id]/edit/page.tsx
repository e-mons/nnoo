import { Metadata } from 'next';
import { getProductCategories, getCatalogItem } from '@/lib/actions/catalog';
import { createClient } from '@/lib/supabase/server';
import { CatalogItemForm } from '../../components/CatalogItemForm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Edit Catalog Item | NNOO',
};

export default async function EditCatalogItemPage({
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
    return <div className="text-white">Business not found.</div>;
  }

  const [categoriesRes, itemRes] = await Promise.all([
    getProductCategories(business.id),
    getCatalogItem(business.id, resolvedParams.id)
  ]);

  if (!itemRes.success || !itemRes.data) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href={`/app/${resolvedParams.businessSlug}/products`}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Item</h1>
          <p className="text-white/60 text-sm mt-1">
            Update {itemRes.data.name} in {business.name}.
          </p>
        </div>
      </div>

      <CatalogItemForm 
        businessId={business.id} 
        businessSlug={resolvedParams.businessSlug} 
        categories={categoriesRes.data || []} 
        initialData={itemRes.data}
      />
    </div>
  );
}
