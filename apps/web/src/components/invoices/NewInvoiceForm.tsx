'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CatalogItem, Customer } from '@nnoo/contracts';
import { SaveInvoiceDraftInput } from '@nnoo/validation';
import { saveInvoiceDraft } from '@/lib/actions/invoices';
import { Check, Loader2, Trash2, User } from 'lucide-react';

export function NewInvoiceForm({
  businessId,
  businessSlug,
  currencyCode,
  catalogItems,
  customers,
}: {
  businessId: string;
  businessSlug: string;
  currencyCode: string;
  catalogItems: CatalogItem[];
  customers: Customer[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [cart, setCart] = useState<{ id: string; catalogItem: CatalogItem; quantity: string; discountMinor: string }[]>([]);

  const formatMoney = (minor: number) => (minor / 100).toFixed(2);

  const addToCart = (item: CatalogItem) => {
    setCart([...cart, { id: crypto.randomUUID(), catalogItem: item, quantity: '1', discountMinor: '0' }]);
  };

  const updateCartItem = (id: string, field: 'quantity' | 'discountMinor', value: string) => {
    setCart(cart.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCartItem = (id: string) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const cartSubtotal = cart.reduce((sum, c) => {
    const qty = parseFloat(c.quantity) || 0;
    const price = parseInt(c.catalogItem.sellingPriceMinor) || 0;
    return sum + (qty * price);
  }, 0);

  const cartDiscount = cart.reduce((sum, c) => {
    return sum + (parseInt(c.discountMinor) || 0);
  }, 0);

  const cartTotal = Math.round(cartSubtotal) - cartDiscount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError('Add at least one item to the invoice.');
      return;
    }
    if (!selectedCustomerId) {
      setError('A customer must be selected for an invoice.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const draft: SaveInvoiceDraftInput = {
      business_id: businessId,
      customer_id: selectedCustomerId,
      currency_code: currencyCode,
      subtotal_minor: Math.round(cartSubtotal),
      discount_total_minor: cartDiscount,
      total_minor: cartTotal,
      due_date: dueDate || null,
      notes: notes || null,
      items: cart.map((c, i) => {
        const qty = parseFloat(c.quantity) || 0;
        const price = parseInt(c.catalogItem.sellingPriceMinor) || 0;
        const discount = parseInt(c.discountMinor) || 0;
        
        return {
          catalog_item_id: c.catalogItem.id,
          item_type_snapshot: c.catalogItem.itemType,
          item_name_snapshot: c.catalogItem.name,
          sku_snapshot: c.catalogItem.sku,
          unit_code_snapshot: c.catalogItem.unitCode || 'unit',
          track_inventory_snapshot: c.catalogItem.trackInventory,
          quantity: qty,
          unit_price_minor: price,
          discount_minor: discount,
          line_total_minor: Math.round((qty * price) - discount),
          line_order: i
        };
      })
    };

    try {
      await saveInvoiceDraft(draft);
      router.push(`/app/${businessSlug}/invoices`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create invoice draft.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <div className="lg:col-span-2 space-y-6">
        
        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
          <h2 className="text-lg font-medium text-white mb-4">Add Items</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {catalogItems.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => addToCart(item)}
                className="flex flex-col items-start p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors text-left"
              >
                <span className="text-sm font-medium text-white line-clamp-1">{item.name}</span>
                <span className="text-xs text-[#B8F25C] mt-1">{currencyCode} {formatMoney(Number(item.sellingPriceMinor))}</span>
              </button>
            ))}
            {catalogItems.length === 0 && (
              <div className="col-span-full text-white/50 text-sm py-4 text-center">No active catalogue items.</div>
            )}
          </div>
        </div>

        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl min-h-[300px]">
          <h2 className="text-lg font-medium text-white mb-4">Invoice Items ({cart.length})</h2>
          {cart.length === 0 ? (
            <div className="flex items-center justify-center h-40 border-2 border-dashed border-white/10 rounded-2xl">
              <span className="text-white/40">Invoice is empty</span>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((c) => (
                <div key={c.id} className="flex flex-col sm:flex-row gap-4 items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="font-medium text-white truncate">{c.catalogItem.name}</div>
                    <div className="text-xs text-white/50">Price: {formatMoney(Number(c.catalogItem.sellingPriceMinor))}</div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex flex-col">
                      <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Qty</label>
                      <input
                        type="number"
                        step="any"
                        value={c.quantity}
                        onChange={(e) => updateCartItem(c.id, 'quantity', e.target.value)}
                        className="bg-[#0A1C16] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white w-20 focus:border-[#B8F25C]"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Disc ({currencyCode})</label>
                      <input
                        type="number"
                        min="0"
                        value={parseInt(c.discountMinor) / 100 || 0}
                        onChange={(e) => updateCartItem(c.id, 'discountMinor', (parseFloat(e.target.value || '0') * 100).toString())}
                        className="bg-[#0A1C16] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white w-24 focus:border-[#B8F25C]"
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeCartItem(c.id)}
                      className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg mt-4 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        
        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-[#B8F25C]" />
            Customer & Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white/60 mb-1 uppercase tracking-wider">Customer <span className="text-red-400">*</span></label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#B8F25C]/50 appearance-none"
                required
              >
                <option value="">Select a customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1 uppercase tracking-wider">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#B8F25C]/50"
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1 uppercase tracking-wider">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Payment instructions or terms..."
                className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#B8F25C]/50 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
          <h2 className="text-lg font-medium text-white mb-4">Summary</h2>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm text-white/60">
              <span>Subtotal</span>
              <span>{formatMoney(Math.round(cartSubtotal))}</span>
            </div>
            {cartDiscount > 0 && (
              <div className="flex justify-between text-sm text-red-400">
                <span>Discount</span>
                <span>-{formatMoney(cartDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold text-white pt-2 border-t border-white/10">
              <span>Total</span>
              <span>{currencyCode} {formatMoney(cartTotal)}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 mb-6">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || cart.length === 0 || !selectedCustomerId}
            className="w-full py-4 bg-[#B8F25C] hover:bg-[#A3D94E] text-[#0A1C16] rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            Save Draft Invoice
          </button>
        </div>

      </div>

    </form>
  );
}
