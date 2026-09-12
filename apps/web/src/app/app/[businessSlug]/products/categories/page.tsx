import { Metadata } from 'next';
import { getProductCategories } from '@/lib/actions/catalog';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { CategoryClientList } from '@/components/catalog/CategoryClientList';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Product Categories | NNOO',
  description: 'Manage your product and service categories.',
};

export default async function CategoriesPage({
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
    notFound();
  }

  const { data: categories, error } = await getProductCategories(business.id);

  if (error) {
    return <div className="text-red-400 p-8 text-center">Error loading categories: {error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-4">
        <Link 
          href={`/app/${resolvedParams.businessSlug}/products`}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Products
        </Link>
      </div>

      <CategoryClientList 
        businessId={business.id} 
        categories={categories || []} 
      />
    </div>
  );
}
