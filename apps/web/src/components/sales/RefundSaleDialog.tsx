'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PAYMENT_METHODS, REFUND_REASONS, Sale, SaleItem, SaleRefundItem } from '@nnoo/contracts';
import { createSaleRefundAction } from '@/lib/actions/sales';
import { Loader2, Undo2 } from 'lucide-react';


export function RefundSaleDialog({
  businessId,
  sale,
  items,
  refundItems
}: {
  businessId: string;
  sale: any;
  items: any[];
  refundItems: any[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reason, setReason] = useState<string>('customer_return');
  const [cashRefundMethod, setCashRefundMethod] = useState<string>('cash');
  const [cashRefundReference, setCashRefundReference] = useState<string>('');
  
  // State tracking quantities to refund
  const [refundQtys, setRefundQtys] = useState<Record<string, string>>({});
  const [restockItems, setRestockItems] = useState<Record<string, boolean>>({});

  const formatMoney = (minor: number) => (minor / 100).toFixed(2);

  const getRefundableQty = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return 0;
    const previouslyRefunded = refundItems
      .filter(ri => ri.sale_item_id === itemId)
      .reduce((sum, ri) => sum + parseFloat(ri.quantity), 0);
    return parseFloat(item.quantity) - previouslyRefunded;
  };

  const hasRefundableItems = items.some(i => getRefundableQty(i.id) > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const refundItemsDraft = Object.entries(refundQtys)
      .filter(([_, qty]) => parseFloat(qty) > 0)
      .map(([id, qty]) => ({
        saleItemId: id,
        quantity: qty,
        restock: restockItems[id] || false,
      }));

    if (refundItemsDraft.length === 0) {
      setError('You must refund at least one item.');
      setIsSubmitting(false);
      return;
    }

    const res = await createSaleRefundAction(businessId, {
      saleId: sale.id,
      reason: reason as any,
      items: refundItemsDraft,
      cashRefundMethod: cashRefundMethod as any,
      cashRefundReference: cashRefundReference || null,
      effectiveDate: new Date().toISOString().split('T')[0],
      idempotencyKey: crypto.randomUUID()
    });

    setIsSubmitting(false);

    if (res.error) {
      setError(typeof res.error === 'string' ? res.error : 'Validation failed.');
    } else {
      setIsOpen(false);
      setRefundQtys({});
      setRestockItems({});
      router.refresh();
    }
  };

  if (!hasRefundableItems) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-all"
      >
        <Undo2 className="w-4 h-4" />
        Process Refund
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0A1C16] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-white/10 shrink-0">
              <h2 className="text-xl font-bold text-white">Process Refund</h2>
              <p className="text-white/60 text-sm mt-1">
                Select items to refund for {sale.sale_number}.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-white">Items to Refund</h3>
                {items.map(item => {
                  const maxQty = getRefundableQty(item.id);
                  if (maxQty <= 0) return null;
                  
                  return (
                    <div key={item.id} className="flex flex-col sm:flex-row gap-4 items-center bg-[#143628] p-4 rounded-xl border border-white/10">
                      <div className="flex-1">
                        <div className="font-medium text-white">{item.item_name_snapshot}</div>
                        <div className="text-xs text-white/50">Max refundable: {maxQty}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max={maxQty}
                          value={refundQtys[item.id] || ''}
                          onChange={e => setRefundQtys({...refundQtys, [item.id]: e.target.value})}
                          placeholder="Qty to refund"
                          className="bg-[#0A1C16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white w-32 focus:border-[#B8F25C]"
                        />
                        {item.track_inventory_snapshot && item.item_type_snapshot === 'product' && (
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={restockItems[item.id] || false}
                              onChange={e => setRestockItems({...restockItems, [item.id]: e.target.checked})}
                              className="w-4 h-4 rounded accent-[#B8F25C]"
                            />
                            <span className="text-xs text-white/70">Return to stock</span>
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Reason</label>
                  <select
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full bg-[#143628] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50 appearance-none capitalize"
                  >
                    {REFUND_REASONS.map(r => (
                      <option key={r} value={r}>{r.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Cash Return Method</label>
                  <select
                    value={cashRefundMethod}
                    onChange={e => setCashRefundMethod(e.target.value)}
                    className="w-full bg-[#143628] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50 appearance-none capitalize"
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-white/40 mt-1">
                    Only used if the refund exceeds the outstanding AR balance. AR is always reduced first.
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center min-w-[120px] px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
