import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function InventoryReportPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const resolvedParams = await params;
  const { businessSlug } = resolvedParams;
  
  const supabase = await createClient();
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, currency_code')
    .eq('id', businessSlug)
    .single();

  if (!business) notFound();

  // Fetch inventory positions
  const { data: positions, error } = await supabase
    .from('inventory_positions')
    .select('id, quantity_on_hand, inventory_value_minor, catalog_items(id, name, sku, track_inventory)')
    .eq('business_id', business.id);

  if (error) {
    console.error(error);
  }

  const formatMoney = (minor: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: business.currency_code
    }).format(minor / 100);
  };

  const totalValue = positions?.reduce((sum, p) => sum + Number(p.inventory_value_minor), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Inventory Value</h2>
          <p className="text-sm text-white/60">Current stock on hand and valuation.</p>
        </div>
        <div className="bg-[#143628] border border-white/10 px-6 py-3 rounded-xl flex items-center gap-4">
          <span className="text-white/60 text-sm">Total Asset Value:</span>
          <span className="text-xl font-bold text-[#B8F25C]">{formatMoney(totalValue)}</span>
        </div>
      </div>

      <div className="bg-[#143628]/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-white">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 font-semibold">Item Name</th>
                <th className="px-6 py-3 font-semibold">SKU</th>
                <th className="px-6 py-3 font-semibold text-right">Qty On Hand</th>
                <th className="px-6 py-3 font-semibold text-right">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {positions?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-white/50">
                    No inventory records found.
                  </td>
                </tr>
              )}
              {positions?.filter((p: any) => p.catalog_items?.track_inventory).map((p: any) => (
                <tr key={p.id} className="hover:bg-white/5">
                  <td className="px-6 py-4">
                    <Link href={`/app/${businessSlug}/products/${p.catalog_items?.id}/edit`} className="hover:underline font-medium">
                      {p.catalog_items?.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-white/70">{p.catalog_items?.sku || '-'}</td>
                  <td className="px-6 py-4 text-right font-medium">
                    {parseFloat(p.quantity_on_hand).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-[#B8F25C]">{formatMoney(p.inventory_value_minor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
