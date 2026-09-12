import { getInventoryPositions } from '@/lib/actions/inventory';
import Link from 'next/link';
import { InventoryActionsClient } from '@/components/inventory/InventoryActionsClient';

const formatMoney = (minor: number, currency: string = 'NGN') =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(minor / 100);

export default async function InventoryPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const resolvedParams = await params;
  const positions = await getInventoryPositions(resolvedParams.businessSlug);

  const initialized = positions.filter((p: any) => p.status === 'initialized');
  const pending = positions.filter((p: any) => p.status === 'pending_initialization');

  const totalValue = initialized.reduce(
    (sum: number, p: any) => sum + Number(p.inventory_value_minor),
    0
  );
  const totalItems = initialized.reduce(
    (sum: number, p: any) => sum + parseFloat(p.quantity_on_hand),
    0
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Inventory</h1>
          <p className="text-white/60">Track stock, receipts, and movements.</p>
        </div>
        <Link
          href={`/app/${resolvedParams.businessSlug}/inventory/receipts/new`}
          className="bg-[#B8F25C] text-[#0A1C16] px-4 py-2 rounded-xl font-medium hover:bg-[#a3d951] transition-colors"
        >
          New Stock Receipt
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#143628]/40 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
          <div className="text-white/60 text-sm">Total Stock Value</div>
          <div className="text-2xl font-bold text-white mt-1">{formatMoney(totalValue)}</div>
        </div>
        <div className="bg-[#143628]/40 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
          <div className="text-white/60 text-sm">Total Units</div>
          <div className="text-2xl font-bold text-white mt-1">{totalItems.toFixed(2)}</div>
        </div>
        <div className="bg-[#143628]/40 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
          <div className="text-white/60 text-sm">Tracked Products</div>
          <div className="text-2xl font-bold text-white mt-1">{positions.length}</div>
          {pending.length > 0 && (
            <div className="text-xs text-orange-400 mt-1">{pending.length} pending initialization</div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex gap-3">
        <Link
          href={`/app/${resolvedParams.businessSlug}/inventory/receipts`}
          className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Stock Receipts
        </Link>
      </div>

      {/* Pending Initialization */}
      {pending.length > 0 && (
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-3xl overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-orange-500/20">
            <h2 className="text-lg font-semibold text-orange-400">Awaiting Initialization</h2>
            <p className="text-white/50 text-sm">Set opening stock quantities and values for these products.</p>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-white">
              <thead className="bg-black/20 text-white/60 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {pending.map((pos: any) => (
                  <tr key={pos.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3 font-medium">{pos.catalog_items?.name || 'Unknown'}</td>
                    <td className="px-6 py-3 text-white/60">{pos.catalog_items?.sku || '—'}</td>
                    <td className="px-6 py-3 text-right">
                      <InventoryActionsClient
                        businessId={resolvedParams.businessSlug}
                        position={pos}
                        mode="initialize"
                        currencyCode={pos.catalog_items?.currency_code || 'NGN'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Initialized Inventory Table */}
      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Stock Positions</h2>
        </div>
        {initialized.length === 0 ? (
          <div className="p-8 text-center text-white/50">
            No inventory positions initialized yet.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-white">
              <thead className="bg-black/20 text-white/60 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3 text-right">Qty on Hand</th>
                  <th className="px-6 py-3 text-right">Avg Cost</th>
                  <th className="px-6 py-3 text-right">Total Value</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {initialized.map((pos: any) => {
                  const qty = parseFloat(pos.quantity_on_hand);
                  const value = Number(pos.inventory_value_minor);
                  const avgCost = qty > 0 ? value / qty : 0;
                  const currency = pos.catalog_items?.currency_code || 'NGN';

                  return (
                    <tr key={pos.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-3 font-medium">{pos.catalog_items?.name || 'Unknown'}</td>
                      <td className="px-6 py-3 text-white/60">{pos.catalog_items?.sku || '—'}</td>
                      <td className="px-6 py-3 text-right font-mono">
                        {qty % 1 === 0 ? qty.toFixed(0) : qty.toFixed(2)}
                        {pos.catalog_items?.unit_code && (
                          <span className="text-white/40 text-xs ml-1">{pos.catalog_items.unit_code}</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right font-mono">{formatMoney(avgCost, currency)}</td>
                      <td className="px-6 py-3 text-right font-mono">{formatMoney(value, currency)}</td>
                      <td className="px-6 py-3 text-right">
                        <InventoryActionsClient
                          businessId={resolvedParams.businessSlug}
                          position={pos}
                          mode="adjust"
                          currencyCode={currency}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
