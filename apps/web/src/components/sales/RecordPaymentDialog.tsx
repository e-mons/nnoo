'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PAYMENT_METHODS } from '@nnoo/contracts';
import { recordSalePaymentAction } from '@/lib/actions/sales';
import { Loader2, Plus } from 'lucide-react';


export function RecordPaymentDialog({
  businessId,
  saleId,
  balanceDueMinor,
  currencyCode
}: {
  businessId: string;
  saleId: string;
  balanceDueMinor: number;
  currencyCode: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState<string>((balanceDueMinor / 100).toString());
  const [method, setMethod] = useState<string>('cash');
  const [reference, setReference] = useState<string>('');

  const formatMoney = (minor: number) => (minor / 100).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const amountMinor = Math.round(parseFloat(amount) * 100).toString();

    const res = await recordSalePaymentAction(businessId, {
      saleId,
      amountMinor,
      paymentMethod: method as any,
      reference: reference || null,
      effectiveDate: new Date().toISOString().split('T')[0],
      idempotencyKey: crypto.randomUUID()
    });

    setIsSubmitting(false);

    if (res.error) {
      setError(typeof res.error === 'string' ? res.error : 'Validation failed.');
    } else {
      setIsOpen(false);
      router.refresh();
    }
  };

  if (balanceDueMinor <= 0) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#B8F25C] hover:bg-[#A3D94E] text-[#0A1C16] rounded-xl text-sm font-semibold transition-all"
      >
        <Plus className="w-4 h-4" />
        Record Payment
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0A1C16] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Record Payment</h2>
              <p className="text-white/60 text-sm mt-1">
                Balance due: {currencyCode} {formatMoney(balanceDueMinor)}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Amount ({currencyCode})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  max={(balanceDueMinor / 100).toString()}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-[#143628] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Payment Method</label>
                <select
                  value={method}
                  onChange={e => setMethod(e.target.value)}
                  className="w-full bg-[#143628] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50 appearance-none capitalize"
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>{m.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Reference (Optional)</label>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="e.g. TRN-12345"
                  className="w-full bg-[#143628] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
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
                  className="flex items-center justify-center min-w-[120px] px-6 py-3 bg-[#B8F25C] hover:bg-[#A3D94E] text-[#0A1C16] rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
