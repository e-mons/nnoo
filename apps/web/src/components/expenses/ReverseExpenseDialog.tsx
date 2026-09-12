'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { reverseExpenseAction } from '@/lib/actions/expenses';
import { Loader2, AlertTriangle } from 'lucide-react';


export function ReverseExpenseDialog({
  businessId,
  expenseId,
  expenseNumber
}: {
  businessId: string;
  expenseId: string;
  expenseNumber: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reason, setReason] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await reverseExpenseAction(businessId, {
      expenseId,
      reason,
      idempotencyKey: crypto.randomUUID()
    });

    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setIsOpen(false);
      setReason('');
      router.refresh();
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="border border-red-500/50 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-xl font-medium inline-flex items-center transition-colors"
      >
        <AlertTriangle className="w-4 h-4 mr-2" />
        Reverse Expense
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0A1C16] border border-red-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl shadow-red-900/20">
            <div className="p-6 border-b border-white/10 bg-red-500/5">
              <h2 className="text-xl font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Reverse Expense
              </h2>
              <p className="text-white/60 text-sm mt-2">
                You are about to reverse {expenseNumber}. This will permanently nullify the financial impact of the expense and all its payments in the general ledger.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm text-white/60">Reason for Reversal *</label>
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Created in error, incorrect amount"
                  className="w-full bg-[#143628] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 resize-none h-24"
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
                  disabled={isSubmitting || reason.length < 3}
                  className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-xl font-medium inline-flex items-center transition-colors disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirm Reversal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
