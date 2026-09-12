import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Ban, Send, CreditCard } from 'lucide-react';
import { InvoiceWithLines, InvoiceCustomerSnapshot, InvoiceBusinessSnapshot } from '@nnoo/contracts';
import { IssueInvoiceClientButton } from '@/components/invoices/IssueInvoiceClientButton';
import { RecordPaymentDialog } from '@/components/sales/RecordPaymentDialog';

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ businessSlug: string, id: string }>;
}) {
  const resolvedParams = await params;
  const { businessSlug, id } = resolvedParams;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessSlug)
    .single();

  if (!business) notFound();

  const { data: invoice } = await supabase
    .from('invoices')
    .select(`
      *,
      lines:invoice_lines(*),
      customer:customers(name, email, phone),
      sale:sales(
        id,
        payment_status,
        total_minor,
        sale_payments(amount_minor),
        sale_refunds(total_minor, cash_refund_minor)
      )
    `)
    .eq('id', id)
    .eq('business_id', business.id)
    .single();

  if (!invoice) notFound();

  const formatMoney = (minor: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency_code
    }).format(minor / 100);
  };

  const isDraft = invoice.document_status === 'draft';
  const isIssued = invoice.document_status === 'issued';
  const isVoided = invoice.document_status === 'voided';

  const customerSnapshot = invoice.customer_snapshot as unknown as InvoiceCustomerSnapshot;

  let balanceDueMinor = 0;
  if (invoice.sale) {
    const totalPaid = (invoice.sale.sale_payments || []).reduce((sum: number, p: any) => sum + Number(p.amount_minor), 0);
    const totalRefunded = (invoice.sale.sale_refunds || []).reduce((sum: number, r: any) => sum + Number(r.total_minor), 0);
    const cashRefunded = (invoice.sale.sale_refunds || []).reduce((sum: number, r: any) => sum + Number(r.cash_refund_minor), 0);
    
    const netSale = Number(invoice.sale.total_minor) - totalRefunded;
    const netPaid = totalPaid - cashRefunded;
    balanceDueMinor = netSale - netPaid;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href={`/app/${businessSlug}/invoices`}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            Invoice {invoice.invoice_number ? `#${invoice.invoice_number}` : '(Draft)'}
            <span className={`px-2 py-1 text-xs rounded-full capitalize
              ${isDraft ? 'bg-gray-500/20 text-gray-300' : ''}
              ${isIssued ? 'bg-[#B8F25C]/20 text-[#B8F25C]' : ''}
              ${isVoided ? 'bg-red-500/20 text-red-300' : ''}
            `}>
              {invoice.document_status}
            </span>
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <a 
          href={`/api/v1/invoices/${invoice.id}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm font-medium"
        >
          <FileText className="w-4 h-4" />
          View PDF
        </a>
        
        {isDraft && <IssueInvoiceClientButton invoice={invoice} />}

        {isIssued && (
          <button className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-bold">
            <Ban className="w-4 h-4" />
            Void Invoice
          </button>
        )}

        {isIssued && invoice.sale && balanceDueMinor > 0 && (
          <RecordPaymentDialog 
            businessId={business.id}
            saleId={invoice.sale.id}
            balanceDueMinor={balanceDueMinor}
            currencyCode={invoice.currency_code}
          />
        )}
      </div>

      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-8 backdrop-blur-xl space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-2">Bill To</h3>
            <p className="text-lg font-medium text-white">
              {isDraft ? (invoice.customer as any)?.name : customerSnapshot?.name}
            </p>
            {isDraft ? (
              <>
                <p className="text-white/60">{(invoice.customer as any)?.email}</p>
                <p className="text-white/60">{(invoice.customer as any)?.phone}</p>
              </>
            ) : (
              <>
                <p className="text-white/60">{customerSnapshot?.email}</p>
                <p className="text-white/60">{customerSnapshot?.phone}</p>
              </>
            )}
          </div>
          <div className="text-right">
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-2">Details</h3>
            <p className="text-white"><span className="text-white/60">Issue Date:</span> {invoice.issue_date || 'Not issued'}</p>
            <p className="text-white"><span className="text-white/60">Due Date:</span> {invoice.due_date || 'N/A'}</p>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-4 text-xs font-semibold text-white/50 uppercase tracking-widest w-1/2">Item</th>
              <th className="py-4 text-xs font-semibold text-white/50 uppercase tracking-widest w-1/6 text-right">Qty</th>
              <th className="py-4 text-xs font-semibold text-white/50 uppercase tracking-widest w-1/6 text-right">Price</th>
              <th className="py-4 text-xs font-semibold text-white/50 uppercase tracking-widest w-1/6 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {(invoice.lines as any[]).map((line) => (
              <tr key={line.id}>
                <td className="py-4 text-white">
                  {line.item_name_snapshot}
                  {line.track_inventory_snapshot && <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">Stock</span>}
                </td>
                <td className="py-4 text-white text-right">{line.quantity}</td>
                <td className="py-4 text-white text-right">{formatMoney(line.unit_price_minor)}</td>
                <td className="py-4 text-white text-right font-medium">{formatMoney(line.line_total_minor)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end pt-4 border-t border-white/10">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Subtotal</span>
              <span className="text-white">{formatMoney(invoice.subtotal_minor)}</span>
            </div>
            {invoice.discount_total_minor > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Discount</span>
                <span className="text-red-400">-{formatMoney(invoice.discount_total_minor)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-3">
              <span className="text-white">Total</span>
              <span className="text-[#B8F25C]">{formatMoney(invoice.total_minor)}</span>
            </div>
            {isIssued && invoice.sale && (
              <div className="flex justify-between text-sm font-medium border-t border-white/10 pt-3">
                <span className="text-white/60">Balance Due</span>
                <span className="text-orange-400">{formatMoney(balanceDueMinor)}</span>
              </div>
            )}
          </div>
        </div>

        {invoice.notes && (
          <div className="pt-8 border-t border-white/10">
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-2">Notes</h3>
            <p className="text-white/80 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
