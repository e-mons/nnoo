'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CatalogItem, Customer, CreateSaleDraft, PAYMENT_METHODS } from '@nnoo/contracts';
import { createSaleAction } from '@/lib/actions/sales';
import { Check, Loader2, Plus, Trash2, User } from 'lucide-react';


export function NewSaleForm({
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
  
  // Sale state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [cart, setCart] = useState<{ id: string; catalogItem: CatalogItem; quantity: string; discountMinor: string }[]>([]);
  const [payments, setPayments] = useState<{ amountMinor: string; method: string }[]>([]);

  // Custom Payment State
  const [customPaymentAmount, setCustomPaymentAmount] = useState('');
  const [customPaymentMethod, setCustomPaymentMethod] = useState('cash');

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

  const totalPaid = payments.reduce((sum, p) => sum + (parseInt(p.amountMinor) || 0), 0);
  const balance = cartTotal - totalPaid;

  const addFullPayment = (method: string) => {
    if (balance > 0) {
      setPayments([...payments, { amountMinor: balance.toString(), method }]);
    }
  };

  const addCustomPayment = () => {
    const amountMinor = Math.round(parseFloat(customPaymentAmount) * 100);
    if (amountMinor > 0 && amountMinor <= balance) {
      setPayments([...payments, { amountMinor: amountMinor.toString(), method: customPaymentMethod }]);
      setCustomPaymentAmount('');
    } else {
      setError(`Amount must be greater than 0 and not exceed the balance of ${formatMoney(balance)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError('Add at least one item to the cart.');
      return;
    }
    if (balance > 0 && !selectedCustomerId) {
      setError('A customer must be selected for sales with an outstanding balance (credit).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const draft: CreateSaleDraft = {
      customerId: selectedCustomerId || null,
      currencyCode,
      effectiveDate: new Date().toISOString().split('T')[0],
      items: cart.map(c => ({
        catalogItemId: c.catalogItem.id,
        quantity: c.quantity,
        discountMinor: c.discountMinor,
      })),
      payments: payments.map(p => ({
        amountMinor: p.amountMinor,
        paymentMethod: p.method as any,
      })),
      idempotencyKey: crypto.randomUUID(),
    };

    const res = await createSaleAction(businessId, draft);
    
    if (res.error) {
      setError(typeof res.error === 'string' ? res.error : 'Failed to create sale.');
      setIsSubmitting(false);
    } else {
      router.push(`/app/${businessSlug}/sales`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column: Catalog & Cart */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Catalog Picker */}
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

        {/* Cart */}
        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl min-h-[300px]">
          <h2 className="text-lg font-medium text-white mb-4">Cart ({cart.length} items)</h2>
          {cart.length === 0 ? (
            <div className="flex items-center justify-center h-40 border-2 border-dashed border-white/10 rounded-2xl">
              <span className="text-white/40">Cart is empty</span>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((c, i) => (
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

      {/* Right Column: Checkout & Customer */}
      <div className="space-y-6">
        
        {/* Customer Select */}
        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-[#B8F25C]" />
            Customer
          </h2>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#B8F25C]/50 appearance-none"
          >
            <option value="">Walk-in Customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {balance > 0 && !selectedCustomerId && (
            <p className="text-xs text-orange-400 mt-2">
              Warning: A customer must be selected if there is an unpaid balance.
            </p>
          )}
        </div>

        {/* Summary & Payment */}
        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
          <h2 className="text-lg font-medium text-white mb-4">Summary</h2>
          
          <div className="space-y-3 mb-6 border-b border-white/10 pb-6">
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

          <h3 className="text-sm font-medium text-white mb-3">Quick Payment</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {PAYMENT_METHODS.filter(m => m !== 'other').map(method => (
              <button
                key={method}
                type="button"
                onClick={() => addFullPayment(method)}
                disabled={balance === 0}
                className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-white capitalize disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Full {method.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 mb-6 p-4 bg-black/20 rounded-xl border border-white/5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/60">Partial Payment Amount</label>
              <input
                type="number"
                step="any"
                min="0"
                value={customPaymentAmount}
                onChange={(e) => { setError(null); setCustomPaymentAmount(e.target.value); }}
                placeholder="0.00"
                className="w-full bg-[#0A1C16] border border-white/10 rounded-lg px-4 py-3 text-lg font-medium text-white focus:outline-none focus:border-[#B8F25C] focus:ring-1 focus:ring-[#B8F25C]"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={customPaymentMethod}
                onChange={(e) => setCustomPaymentMethod(e.target.value)}
                className="flex-1 bg-[#0A1C16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#B8F25C] appearance-none capitalize"
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>{method.replace('_', ' ')}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={addCustomPayment}
                disabled={!customPaymentAmount || balance === 0}
                className="px-6 py-2 bg-[#143628] hover:bg-[#1f503c] text-[#B8F25C] rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          {payments.length > 0 && (
            <div className="mb-6 space-y-2">
              <h3 className="text-sm font-medium text-white">Applied Payments</h3>
              {payments.map((p, i) => (
                <div key={i} className="flex justify-between text-sm text-green-400 bg-green-400/10 px-3 py-2 rounded-lg">
                  <span className="capitalize">{p.method.replace('_', ' ')}</span>
                  <span>{formatMoney(Number(p.amountMinor))}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-medium text-white pt-2">
                <span>Balance Due</span>
                <span className={balance > 0 ? 'text-orange-400' : 'text-[#B8F25C]'}>{formatMoney(balance)}</span>
              </div>
              <button
                type="button"
                onClick={() => setPayments([])}
                className="text-xs text-white/40 hover:text-white underline mt-2"
              >
                Clear payments
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 mb-6">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || cart.length === 0 || (balance > 0 && !selectedCustomerId)}
            className="w-full py-4 bg-[#B8F25C] hover:bg-[#A3D94E] text-[#0A1C16] rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            {balance > 0 ? 'Save Unpaid Sale' : 'Complete Sale'}
          </button>
        </div>

      </div>

    </form>
  );
}
