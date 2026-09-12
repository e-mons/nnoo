import { getSupplierList } from '@/lib/actions/supplier';
import { getCatalogList } from '@/lib/actions/catalog';
import { CreateStockReceiptForm } from '@/components/inventory/CreateStockReceiptForm';

export default async function NewStockReceiptPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const resolvedParams = await params;
  // Fetch suppliers and catalog items (products that track inventory)
  const [suppliersResponse, catalogResponse] = await Promise.all([
    getSupplierList(resolvedParams.businessSlug),
    getCatalogList(resolvedParams.businessSlug, new URLSearchParams({ type: 'product' }))
  ]);

  const suppliers = suppliersResponse.data || [];
  const catalogItems = catalogResponse.data?.filter(item => item.trackInventory) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
        <h1 className="text-2xl font-bold text-white mb-6">Record Stock Receipt</h1>
        <CreateStockReceiptForm 
          businessId={resolvedParams.businessSlug} 
          suppliers={suppliers}
          catalogItems={catalogItems}
        />
      </div>
    </div>
  );
}
