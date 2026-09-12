'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { recordExpensePaymentAction } from '@/lib/actions/expenses';
import { Loader2, Plus } from 'lucide-react';


export function RecordExpensePaymentDialog({
  businessId,
  expenseId,
  balanceDueMinor,
  currencyCode
}: {
  businessId: string;
  expenseId: string;
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

    const res = await recordExpensePaymentAction(businessId, {
      expenseId,
      amountMinor,
      paymentMethod: method,
      reference: reference || null,
      effectiveDate: new Date().toISOString().split('T')[0],
      idempotencyKey: crypto.randomUUID()
    });

    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setIsOpen(false);
      setAmount('');
      setReference('');
      router.refresh();
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-[#B8F25C] text-[#0A1C16] hover:bg-[#a3d951] px-4 py-2 rounded-xl font-medium inline-flex items-center transition-colors"
      >
        <Plus className="w-4 h-4 mr-2" />
        Record Payment
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0A1C16] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Record Payment</h2>
              <p className="text-white/60 text-sm mt-1">
                Outstanding Balance: {currencyCode} {formatMoney(balanceDueMinor)}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm text-white/60">Amount ({currencyCode})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={(balanceDueMinor / 100).toString()}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#143628] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/60">Payment Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full bg-[#143628] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="pos">POS</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/60">Reference (Optional)</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. Transaction ID"
                  className="w-full bg-[#143628] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="border border-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#B8F25C] text-[#0A1C16] hover:bg-[#a3d951] px-4 py-2 rounded-xl font-medium inline-flex items-center transition-colors disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
