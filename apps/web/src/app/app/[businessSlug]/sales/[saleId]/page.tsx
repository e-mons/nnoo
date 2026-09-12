import { Metadata } from 'next';
import { getSaleDetails } from '@/lib/actions/sales';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Receipt, User, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { RecordPaymentDialog } from '@/components/sales/RecordPaymentDialog';
import { RefundSaleDialog } from '@/components/sales/RefundSaleDialog';
import { GenerateInvoiceButton } from '@/components/sales/GenerateInvoiceButton';

export const metadata: Metadata = {
  title: 'Sale Details | NNOO',
  description: 'View sale details and history.',
};

export default async function SaleDetailsPage({
  params,
}: {
  params: Promise<{ businessSlug: string; saleId: string }>;
}) {
  const resolvedParams = await params;
  const supabase = await createClient();
  
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, currency_code')
    .eq('id', resolvedParams.businessSlug)
    .single();

  if (!business) {
    return <div className="text-white">Business not found.</div>;
  }

  const { sale, items, payments, refunds } = await getSaleDetails(business.id, resolvedParams.saleId);

  if (!sale) {
    notFound();
  }

  const formatMoney = (minor: number) => (minor / 100).toFixed(2);

  const totalPaid = payments.reduce((sum: number, p: any) => sum + Number(p.amount_minor), 0);
  const totalCashRefunded = refunds.reduce((sum: number, r: any) => sum + Number(r.cash_refund_minor), 0);
  const totalRefunded = refunds.reduce((sum: number, r: any) => sum + Number(r.total_minor), 0);

  const netSale = Number(sale.total_minor) - totalRefunded;
  const netPaid = totalPaid - totalCashRefunded;
  const balanceDueMinor = netSale - netPaid;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href={`/app/${resolvedParams.businessSlug}/sales`}
          className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#B8F25C]" />
            {sale.sale_number}
          </h1>
          <p className="text-white/60 text-sm mt-1 flex items-center gap-4">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(sale.occurred_at).toLocaleString()}</span>
            <span className="flex items-center gap-1"><User className="w-4 h-4" /> {sale.customers ? sale.customers.name : 'Walk-in Customer'}</span>
          </p>
        </div>
        
        <div className="ml-auto flex items-center gap-3">
          <RefundSaleDialog 
            businessId={business.id}
            sale={sale}
            items={items}
            refundItems={refunds.flatMap((r: any) => r.sale_refund_items)}
          />
          {balanceDueMinor > 0 && !sale.invoices?.some((i: any) => i.document_status !== 'voided') && sale.customer_id && (
            <GenerateInvoiceButton 
              businessSlug={resolvedParams.businessSlug} 
              saleId={sale.id} 
            />
          )}
          <RecordPaymentDialog 
            businessId={business.id}
            saleId={sale.id}
            balanceDueMinor={balanceDueMinor}
            currencyCode={business.currency_code}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Details (Items) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-lg font-medium text-white">Line Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-white/50 uppercase bg-black/20">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Item</th>
                    <th className="px-6 py-4 font-semibold">Qty</th>
                    <th className="px-6 py-4 font-semibold">Price</th>
                    <th className="px-6 py-4 font-semibold">Disc</th>
                    <th className="px-6 py-4 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((item: any) => (
                    <tr key={item.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">{item.item_name_snapshot}</td>
                      <td className="px-6 py-4 text-white/80">{item.quantity}</td>
                      <td className="px-6 py-4 text-white/80">{formatMoney(item.unit_price_minor)}</td>
                      <td className="px-6 py-4 text-red-400">{item.discount_minor > 0 ? `-${formatMoney(item.discount_minor)}` : '-'}</td>
                      <td className="px-6 py-4 font-medium text-white text-right">{formatMoney(item.line_total_minor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar (Summary, Payments, Refunds) */}
        <div className="space-y-6">
          
          <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-medium text-white mb-4">Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-white/60">
                <span>Subtotal</span>
                <span>{formatMoney(Number(sale.subtotal_minor))}</span>
              </div>
              {sale.discount_total_minor > 0 && (
                <div className="flex justify-between text-sm text-red-400">
                  <span>Discount</span>
                  <span>-{formatMoney(Number(sale.discount_total_minor))}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold text-white pt-2 border-t border-white/10">
                <span>Total</span>
                <span>{business.currency_code} {formatMoney(Number(sale.total_minor))}</span>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-white/10">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-white/60">Status</span>
                <span className={`capitalize ${
                  sale.payment_status === 'paid' ? 'text-green-400' : 'text-orange-400'
                }`}>{sale.payment_status.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-white/60">Balance Due</span>
                <span className="text-orange-400">{business.currency_code} {formatMoney(balanceDueMinor)}</span>
              </div>
            </div>
          </div>

          {payments.length > 0 && (
            <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
              <h2 className="text-lg font-medium text-white mb-4">Payments</h2>
              <div className="space-y-3">
                {payments.map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center text-sm p-3 bg-white/5 rounded-xl border border-white/5">
                    <div>
                      <div className="text-white capitalize">{p.payment_method.replace('_', ' ')}</div>
                      <div className="text-xs text-white/40">{new Date(p.occurred_at).toLocaleDateString('en-US')}</div>
                    </div>
                    <div className="font-medium text-green-400">+{formatMoney(p.amount_minor)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {refunds.length > 0 && (
            <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
              <h2 className="text-lg font-medium text-white mb-4">Refunds</h2>
              <div className="space-y-3">
                {refunds.map((r: any) => (
                  <div key={r.id} className="flex flex-col gap-1 text-sm p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                    <div className="flex justify-between items-center">
                      <div className="text-white font-medium">{r.refund_number}</div>
                      <div className="font-medium text-red-400">-{formatMoney(r.total_minor)}</div>
                    </div>
                    <div className="text-xs text-white/60 flex justify-between">
                      <span className="capitalize">{r.reason.replace('_', ' ')}</span>
                      <span>{new Date(r.occurred_at).toLocaleDateString('en-US')}</span>
                    </div>
                    {r.cash_refund_minor > 0 && (
                      <div className="text-xs text-orange-300 mt-1 pt-1 border-t border-red-500/20">
                        Cash returned: {formatMoney(r.cash_refund_minor)} ({r.cash_refund_method})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
