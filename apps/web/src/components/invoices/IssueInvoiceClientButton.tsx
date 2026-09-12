'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { issueInvoice } from '@/lib/actions/invoices';
import { Send, Loader2 } from 'lucide-react';

export function IssueInvoiceClientButton({ invoice }: { invoice: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleIssue = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        invoice_id: invoice.id,
        business_id: invoice.business_id,
        customer_id: invoice.customer_id,
        currency_code: invoice.currency_code,
        subtotal_minor: invoice.subtotal_minor,
        discount_total_minor: invoice.discount_total_minor || 0,
        total_minor: invoice.total_minor,
        effective_date: new Date().toISOString().split('T')[0],
        due_date: invoice.due_date || null,
        notes: invoice.notes || null,
        idempotency_key: crypto.randomUUID(),
        items: invoice.lines.map((line: any) => ({
          catalog_item_id: line.catalog_item_id,
          item_type_snapshot: line.item_type_snapshot,
          item_name_snapshot: line.item_name_snapshot,
          sku_snapshot: line.sku_snapshot,
          unit_code_snapshot: line.unit_code_snapshot,
          track_inventory_snapshot: line.track_inventory_snapshot,
          quantity: parseFloat(line.quantity),
          unit_price_minor: line.unit_price_minor,
          discount_minor: line.discount_minor,
          line_total_minor: line.line_total_minor,
          line_order: line.line_order
        }))
      };

      await issueInvoice(payload);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to issue invoice');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button 
        onClick={handleIssue}
        disabled={isSubmitting}
        className="flex items-center gap-2 px-4 py-2 bg-[#B8F25C] text-[#0A1C16] rounded-lg hover:bg-[#a3d951] transition-colors text-sm font-bold disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Issue Invoice
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
