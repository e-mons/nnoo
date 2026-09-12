'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PAYMENT_METHODS } from '@nnoo/contracts';
import { createStockReceiptAction } from '@/lib/actions/inventory';
import { Loader2, Plus, Trash2, Truck, AlertCircle } from 'lucide-react';

interface CartItem {
  id: string;
  catalogItemId: string;
  name: string;
  unitCode: string | null;
  quantity: string;
  unitCostMinor: string; // minor units as string
}

export function CreateStockReceiptForm({
  businessId,
  suppliers,
  catalogItems
}: {
  businessId: string;
  suppliers: any[];
  catalogItems: any[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [supplierId, setSupplierId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierReference, setSupplierReference] = useState('');
  const [notes, setNotes] = useState('');
  
  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState('');

  // Payment state
  const [payments, setPayments] = useState<{ amountMinor: string; method: string }[]>([]);

  const currencyCode = catalogItems[0]?.currency_code || 'NGN';

  const formatMoney = (minor: number) => (minor / 100).toFixed(2);

  // Derived values
  const cartTotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseInt(item.unitCostMinor, 10)), 0);
  const totalPaid = payments.reduce((sum, p) => sum + parseInt(p.amountMinor, 10), 0);
  const balance = cartTotal - totalPaid;

  const addItemToCart = () => {
    if (!selectedCatalogItemId) return;
    const item = catalogItems.find(i => i.id === selectedCatalogItemId);
    if (!item) return;

    if (cartItems.some(c => c.catalogItemId === item.id)) return; // Prevent duplicates

    setCartItems([...cartItems, {
      id: crypto.randomUUID(),
      catalogItemId: item.id,
      name: item.name,
      unitCode: item.unit_code,
      quantity: '1',
      unitCostMinor: item.cost_price_minor?.toString() || '0'
    }]);
    setSelectedCatalogItemId('');
  };

  const updateCartItem = (id: string, field: keyof CartItem, value: string) => {
    setCartItems(cartItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeCartItem = (id: string) => {
    setCartItems(cartItems.filter(c => c.id !== id));
  };

  const addFullPayment = (method: string) => {
    if (balance <= 0) return;
    setPayments([...payments, { amountMinor: Math.round(balance).toString(), method }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (cartItems.length === 0) {
      setError('Please add at least one item to the receipt.');
      setIsSubmitting(false);
      return;
    }

    if (!supplierId) {
      setError('Please select a supplier.');
      setIsSubmitting(false);
      return;
    }

    if (totalPaid > cartTotal) {
      setError('Payments cannot exceed the total receipt amount.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      supplierId,
      currencyCode,
      effectiveDate,
      supplierReference: supplierReference || null,
      notes: notes || null,
      items: cartItems.map(c => ({
        catalogItemId: c.catalogItemId,
        quantity: c.quantity,
        unitCostMinor: c.unitCostMinor
      })),
      payments: payments.map(p => ({
        amountMinor: p.amountMinor,
        paymentMethod: p.method as any
      })),
      idempotencyKey: crypto.randomUUID()
    };

    const res = await createStockReceiptAction(businessId, payload);

    if (res.error) {
      setError(typeof res.error === 'string' ? res.error : 'Validation failed. Check inputs.');
      setIsSubmitting(false);
    } else {
      router.push(`/app/${businessId}/inventory/receipts`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column: Items */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <select
              value={selectedCatalogItemId}
              onChange={(e) => setSelectedCatalogItemId(e.target.value)}
              className="flex-1 bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#B8F25C]/50 appearance-none"
            >
              <option value="">Select product to receive...</option>
              {catalogItems.map(item => (
                <option key={item.id} value={item.id}>{item.name} {item.sku ? `(${item.sku})` : ''}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={addItemToCart}
              disabled={!selectedCatalogItemId}
              className="px-6 py-3 bg-[#B8F25C] text-[#0A1C16] rounded-xl text-sm font-bold hover:bg-[#a3d951] transition-colors disabled:opacity-50 shrink-0"
            >
              Add Item
            </button>
          </div>

          {cartItems.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed border-white/10 rounded-2xl text-white/40">
              No items added. Select a product above.
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map(c => (
                <div key={c.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#0A1C16]/50 p-4 rounded-2xl border border-white/5">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{c.name}</div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="flex flex-col">
                      <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Qty</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={c.quantity}
                        onChange={(e) => updateCartItem(c.id, 'quantity', e.target.value)}
                        className="bg-[#0A1C16] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white w-20 focus:border-[#B8F25C]"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Unit Cost ({currencyCode})</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={parseInt(c.unitCostMinor) / 100 || ''}
                        onChange={(e) => updateCartItem(c.id, 'unitCostMinor', (parseFloat(e.target.value || '0') * 100).toString())}
                        className="bg-[#0A1C16] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white w-24 focus:border-[#B8F25C]"
                      />
                    </div>
                    <div className="flex flex-col pt-5">
                      <div className="text-sm font-medium text-white px-2">
                        {formatMoney(parseFloat(c.quantity) * parseInt(c.unitCostMinor))}
                      </div>
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
        
        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-4">
          <h2 className="text-lg font-medium text-white">Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Effective Date</label>
              <input
                type="date"
                required
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#B8F25C]/50"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Supplier Ref (Invoice/Waybill)</label>
              <input
                type="text"
                value={supplierReference}
                onChange={(e) => setSupplierReference(e.target.value)}
                className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#B8F25C]/50"
                placeholder="Optional"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-white/60 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#B8F25C]/50"
                placeholder="Optional notes"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Supplier & Payment */}
      <div className="space-y-6">
        
        {/* Supplier Select */}
        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#B8F25C]" />
            Supplier
          </h2>
          <select
            required
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#B8F25C]/50 appearance-none"
          >
            <option value="">Select a supplier...</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Summary & Payment */}
        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
          <h2 className="text-lg font-medium text-white mb-4">Summary</h2>
          
          <div className="space-y-3 mb-6 border-b border-white/10 pb-6">
            <div className="flex justify-between text-lg font-semibold text-white">
              <span>Total Cost</span>
              <span>{currencyCode} {formatMoney(cartTotal)}</span>
            </div>
          </div>

          <h3 className="text-sm font-medium text-white mb-3">Record Payment</h3>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {PAYMENT_METHODS.filter(m => m !== 'other').map(method => (
              <button
                key={method}
                type="button"
                onClick={() => addFullPayment(method)}
                disabled={cartTotal === 0 || balance <= 0}
                className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-white capitalize disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Pay by {method.replace('_', ' ')}
              </button>
            ))}
          </div>

          {payments.length > 0 && (
            <div className="space-y-2 mb-6 p-4 bg-[#0A1C16]/50 rounded-xl border border-white/5">
              {payments.map((p, i) => (
                <div key={i} className="flex justify-between text-sm text-white">
                  <span className="capitalize">{p.method.replace('_', ' ')}</span>
                  <span>{formatMoney(parseInt(p.amountMinor, 10))}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm text-white/60 pt-2 border-t border-white/10 mt-2">
                <span>Balance to AP</span>
                <span className={balance > 0 ? "text-orange-400" : ""}>{formatMoney(balance)}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || cartItems.length === 0}
            className="w-full flex items-center justify-center py-4 bg-[#B8F25C] text-[#0A1C16] rounded-xl font-bold hover:bg-[#a3d951] transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Confirm Receipt'
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
