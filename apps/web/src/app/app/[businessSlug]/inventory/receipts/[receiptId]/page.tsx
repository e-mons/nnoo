import { getStockReceiptDetails } from '@/lib/actions/inventory';
import Link from 'next/link';
import { Truck, Receipt, Calendar, User } from 'lucide-react';

const formatMoney = (minor: number, currency: string = 'NGN') =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(minor / 100);

export default async function StockReceiptDetailsPage({
  params,
}: {
  params: Promise<{ businessSlug: string; receiptId: string }>;
}) {
  const resolvedParams = await params;
  const { receipt, items, payments } = await getStockReceiptDetails(
    resolvedParams.businessSlug,
    resolvedParams.receiptId
  );

  if (!receipt) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12 text-white/60">
        Receipt not found.
      </div>
    );
  }

  const currency = receipt.currency_code;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link
            href={`/app/${resolvedParams.businessSlug}/inventory/receipts`}
            className="text-white/40 hover:text-white transition-colors"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Receipt {receipt.receipt_number}
          </h1>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full border ${
              receipt.status === 'reversed'
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {receipt.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Details */}
        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-6">
          <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-4">
            Receipt Information
          </h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <div className="text-xs text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" /> Supplier
              </div>
              <div className="font-medium text-white">
                {receipt.suppliers?.name || 'Unknown Supplier'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Date
              </div>
              <div className="font-medium text-white">
                {new Date(receipt.effective_date).toLocaleDateString('en-US')}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" /> Supplier Ref
              </div>
              <div className="font-medium text-white">
                {receipt.supplier_reference || '—'}
              </div>
            </div>
          </div>

          {receipt.notes && (
            <div className="space-y-1 pt-4 border-t border-white/5">
              <div className="text-xs text-white/50 uppercase tracking-wider">Notes</div>
              <div className="text-sm text-white/80">{receipt.notes}</div>
            </div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-6">
          <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-4">
            Summary
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/60">Total Cost</span>
              <span className="text-white font-medium">
                {formatMoney(receipt.total_minor, currency)}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-white/60">Total Paid</span>
              <span className="text-emerald-400 font-medium">
                {formatMoney(
                  payments.reduce((sum: number, p: any) => sum + p.amount_minor, 0),
                  currency
                )}
              </span>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="font-medium text-white">Balance Due</span>
              <span className="text-xl font-bold text-orange-400">
                {formatMoney(
                  receipt.total_minor - payments.reduce((sum: number, p: any) => sum + p.amount_minor, 0),
                  currency
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Received Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white">
            <thead className="bg-black/20 text-white/60 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4 text-right">Quantity</th>
                <th className="px-6 py-4 text-right">Unit Cost</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {items.map((item: any) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    {item.item_name_snapshot}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {parseFloat(item.quantity)} {item.unit_code_snapshot || ''}
                  </td>
                  <td className="px-6 py-4 text-right font-mono">
                    {formatMoney(item.unit_cost_minor, currency)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-white/90">
                    {formatMoney(item.line_total_minor, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payments Timeline */}
      {payments.length > 0 && (
        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Payments Recorded</h2>
          </div>
          <div className="p-6 space-y-4">
            {payments.map((payment: any) => (
              <div key={payment.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                <div>
                  <div className="font-medium text-white capitalize">
                    {payment.payment_method.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-white/50 flex items-center gap-2 mt-1">
                    {new Date(payment.effective_date).toLocaleDateString('en-US')}
                    {payment.reference && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        Ref: {payment.reference}
                      </>
                    )}
                  </div>
                </div>
                <div className="text-lg font-mono font-medium text-emerald-400">
                  {formatMoney(payment.amount_minor, payment.currency_code)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
