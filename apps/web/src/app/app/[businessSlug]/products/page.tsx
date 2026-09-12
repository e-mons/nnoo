import { Metadata } from 'next';
import { getCatalogList } from '@/lib/actions/catalog';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Package, Tag, Settings } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Products & Services | NNOO',
  description: 'Manage your product catalogue and services.',
};

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  
  // Resolve businessId from slug
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, currency_code')
    .eq('id', resolvedParams.businessSlug)
    .single();

  if (!business) {
    return <div className="text-white">Business not found.</div>;
  }

  // Parse search params for filtering
  const searchParamsObj = new URLSearchParams();
  if (resolvedSearchParams.q) searchParamsObj.set('q', resolvedSearchParams.q as string);
  if (resolvedSearchParams.type) searchParamsObj.set('type', resolvedSearchParams.type as string);
  if (resolvedSearchParams.status) searchParamsObj.set('status', resolvedSearchParams.status as string);

  const { data: items, error } = await getCatalogList(business.id, searchParamsObj);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-[#B8F25C]" />
            Products & Services
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Manage your offerings for {business.name}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href={`/app/${resolvedParams.businessSlug}/products/categories`}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-all"
          >
            <Tag className="w-4 h-4" />
            Categories
          </Link>
          <Link
            href={`/app/${resolvedParams.businessSlug}/products/new`}
            className="flex items-center gap-2 px-4 py-2 bg-[#B8F25C] hover:bg-[#A3D94E] text-[#0A1C16] rounded-xl text-sm font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            New Item
          </Link>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-[#143628]/40 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
        <form className="flex flex-col sm:flex-row gap-4 items-center">
          <input
            type="text"
            name="q"
            defaultValue={resolvedSearchParams.q as string}
            placeholder="Search by name, SKU..."
            className="bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white w-full sm:w-64 focus:outline-none focus:border-[#B8F25C]/50"
          />
          <select
            name="type"
            defaultValue={resolvedSearchParams.type as string}
            className="bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white w-full sm:w-40 focus:outline-none focus:border-[#B8F25C]/50 appearance-none"
          >
            <option value="">All Types</option>
            <option value="product">Products</option>
            <option value="service">Services</option>
          </select>
          <select
            name="status"
            defaultValue={resolvedSearchParams.status as string || 'active'}
            className="bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white w-full sm:w-40 focus:outline-none focus:border-[#B8F25C]/50 appearance-none"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
            <option value="all">All Statuses</option>
          </select>
          <button
            type="submit"
            className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-6 py-2 text-sm font-medium transition-colors w-full sm:w-auto"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
        {error ? (
          <div className="p-8 text-center text-red-400">
            Failed to load catalogue: {error}
          </div>
        ) : !items || items.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No items found</h3>
            <p className="text-white/50 text-sm max-w-md mx-auto">
              Get started by adding your first product or service to the catalogue.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-white/50 uppercase bg-black/20">
                <tr>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Price ({business.currency_code})</th>
                  <th className="px-6 py-4 font-semibold">Cost</th>
                  <th className="px-6 py-4 font-semibold">Inventory</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{item.name}</div>
                      {(item.sku || item.barcode) && (
                        <div className="text-xs text-white/40 mt-1">
                          {item.sku ? `SKU: ${item.sku}` : ''}
                          {item.sku && item.barcode ? ' • ' : ''}
                          {item.barcode ? `Bar: ${item.barcode}` : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize ${
                        item.itemType === 'product' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                      }`}>
                        {item.itemType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {(Number(item.sellingPriceMinor) / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {item.costPriceMinor 
                        ? (Number(item.costPriceMinor) / 100).toFixed(2)
                        : <span className="italic text-white/30">Hidden</span>}
                    </td>
                    <td className="px-6 py-4">
                      {item.trackInventory ? (
                        <span className="text-green-400 font-medium">Tracked</span>
                      ) : (
                        <span className="text-white/40">Not Tracked</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/app/${resolvedParams.businessSlug}/products/${item.id}/edit`}
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg inline-flex transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
