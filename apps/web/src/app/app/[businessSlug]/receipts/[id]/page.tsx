import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { InvoiceCustomerSnapshot } from '@nnoo/contracts';

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ businessSlug: string, id: string }>;
}) {
  const { businessSlug, id } = await params;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessSlug)
    .single();

  if (!business) notFound();

  const { data: receipt } = await supabase
    .from('receipts')
    .select('*')
    .eq('id', id)
    .eq('business_id', business.id)
    .single();

  if (!receipt) notFound();

  const formatMoney = (minor: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: receipt.currency_code
    }).format(minor / 100);
  };

  const customerSnapshot = receipt.customer_snapshot as unknown as InvoiceCustomerSnapshot | null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href={`/app/${businessSlug}/receipts`}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            Receipt #{receipt.receipt_number}
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <a 
          href={`/api/v1/receipts/${receipt.id}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm font-medium"
        >
          <FileText className="w-4 h-4" />
          View PDF
        </a>
      </div>

      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-8 backdrop-blur-xl space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-2">Paid By</h3>
            <p className="text-lg font-medium text-white">
              {customerSnapshot?.name || 'Walk-in Customer'}
            </p>
            {customerSnapshot?.email && <p className="text-white/60">{customerSnapshot.email}</p>}
            {customerSnapshot?.phone && <p className="text-white/60">{customerSnapshot.phone}</p>}
          </div>
          <div className="text-right">
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-2">Payment Info</h3>
            <p className="text-white"><span className="text-white/60">Date:</span> {new Date(receipt.payment_occurred_at).toLocaleString()}</p>
            <p className="text-white"><span className="text-white/60">Method:</span> <span className="capitalize">{receipt.payment_method_snapshot}</span></p>
            {receipt.payment_reference_snapshot && (
              <p className="text-white"><span className="text-white/60">Ref:</span> {receipt.payment_reference_snapshot}</p>
            )}
          </div>
        </div>

        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-1">Amount Paid</h3>
            <p className="text-3xl font-bold text-[#B8F25C]">{formatMoney(receipt.amount_minor)}</p>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-1">Applied To</h3>
            <p className="text-lg text-white">{receipt.sale_number_snapshot}</p>
            {receipt.invoice_number_snapshot && (
              <p className="text-sm text-white/60">Invoice #{receipt.invoice_number_snapshot}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Balance After Payment</span>
              <span className="text-white font-bold">{formatMoney(receipt.balance_after_payment_minor)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
