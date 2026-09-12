import { Metadata } from 'next';
import { getProductCategories } from '@/lib/actions/catalog';
import { createClient } from '@/lib/supabase/server';
import { CatalogItemForm } from '../components/CatalogItemForm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'New Catalog Item | NNOO',
};

export default async function NewCatalogItemPage({
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
    return <div className="text-white">Business not found.</div>;
  }

  const { data: categories } = await getProductCategories(business.id);

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
          <h1 className="text-2xl font-bold text-white">Add New Item</h1>
          <p className="text-white/60 text-sm mt-1">
            Create a new product or service for {business.name}.
          </p>
        </div>
      </div>

      <CatalogItemForm 
        businessId={business.id} 
        businessSlug={resolvedParams.businessSlug} 
        categories={categories || []} 
      />
    </div>
  );
}
