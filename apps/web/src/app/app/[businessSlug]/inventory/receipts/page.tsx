import { getStockReceiptsList } from '@/lib/actions/inventory';
import Link from 'next/link';

const formatMoney = (minor: number, currency: string = 'NGN') =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(minor / 100);

export default async function StockReceiptsPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const resolvedParams = await params;
  const receipts = await getStockReceiptsList(resolvedParams.businessSlug);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Stock Receipts</h1>
          <p className="text-white/60">Purchase receipts for inventory items.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/app/${resolvedParams.businessSlug}/inventory`}
            className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors"
          >
            ← Inventory
          </Link>
          <Link
            href={`/app/${resolvedParams.businessSlug}/inventory/receipts/new`}
            className="bg-[#B8F25C] text-[#0A1C16] px-4 py-2 rounded-xl font-medium hover:bg-[#a3d951] transition-colors"
          >
            New Receipt
          </Link>
        </div>
      </div>

      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
        {receipts.length === 0 ? (
          <div className="p-8 text-center text-white/50">
            No stock receipts recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-white">
              <thead className="bg-black/20 text-white/60 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Number</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {receipts.map((receipt: any) => (
                  <tr key={receipt.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <Link
                        href={`/app/${resolvedParams.businessSlug}/inventory/receipts/${receipt.id}`}
                        className="hover:underline"
                      >
                        {receipt.receipt_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(receipt.effective_date).toLocaleDateString('en-US')}
                    </td>
                    <td className="px-6 py-4">
                      {receipt.suppliers?.name || <span className="text-white/40">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {formatMoney(receipt.total_minor, receipt.currency_code)}
                    </td>
                    <td className="px-6 py-4">
                      {receipt.payment_status === 'paid' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Paid
                        </span>
                      ) : receipt.payment_status === 'partially_paid' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          Partial
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          Unpaid
                        </span>
                      )}
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
