'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface QuickCaptureFormProps {
  businessId: string;
  businessSlug: string;
}

export function QuickCaptureForm({ businessId, businessSlug }: QuickCaptureFormProps) {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'MONEY_OUT' | 'MONEY_IN' | 'UNKNOWN'>('MONEY_OUT');
  const [counterparty, setCounterparty] = useState('');
  const [reference, setReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please describe what happened.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Parse amount to minor units (NGN kobo)
      let amountMinor: number | null = null;
      if (amount.trim()) {
        const cleaned = amount.replace(/[^0-9.]/g, '');
        const parsedFloat = parseFloat(cleaned);
        if (!isNaN(parsedFloat) && parsedFloat > 0) {
          amountMinor = Math.round(parsedFloat * 100);
        }
      }

      const res = await fetch('/api/v1/ai/bookkeeper/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          description: description.trim(),
          amountMinor,
          currencyCode: 'NGN',
          transactionDirection: direction,
          counterpartyText: counterparty.trim() || undefined,
          referenceText: reference.trim() || undefined,
          paymentMethod: paymentMethod || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Classification failed.');
      }

      // Navigate to the Review Detail page
      const classificationId = data.data?.id || data.id;
      if (classificationId) {
        router.push(`/app/${businessSlug}/bookkeeper/${classificationId}`);
        router.refresh();
      } else {
        router.push(`/app/${businessSlug}/bookkeeper`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze bookkeeping input. You can record it manually.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#143628]/50 border border-[#B8F25C]/20 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-[#B8F25C]/10 border border-[#B8F25C]/30 flex items-center justify-center text-[#B8F25C]">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Record with AI</h2>
          <p className="text-sm text-white/60">
            Tell NNOO what happened in plain words. We will analyze it and prepare a suggestion for your review.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-white/80 mb-1.5">
            What happened?
          </label>
          <div className="relative">
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Paid ₦75,000 shop rent for August or Sold 3 cartons of water to Chidi"
              rows={2}
              disabled={isLoading}
              className="w-full bg-black/30 border border-white/15 rounded-2xl p-3.5 text-white placeholder-white/40 focus:outline-none focus:border-[#B8F25C] transition-colors resize-none text-base"
            />
          </div>
        </div>

        {/* Direction pills */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDirection('MONEY_OUT')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              direction === 'MONEY_OUT'
                ? 'bg-[#B8F25C]/20 border-[#B8F25C] text-[#B8F25C]'
                : 'bg-black/20 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            Money went out
          </button>
          <button
            type="button"
            onClick={() => setDirection('MONEY_IN')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              direction === 'MONEY_IN'
                ? 'bg-[#B8F25C]/20 border-[#B8F25C] text-[#B8F25C]'
                : 'bg-black/20 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            Money came in
          </button>
          <button
            type="button"
            onClick={() => setDirection('UNKNOWN')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              direction === 'UNKNOWN'
                ? 'bg-[#B8F25C]/20 border-[#B8F25C] text-[#B8F25C]'
                : 'bg-black/20 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            I&apos;m not sure
          </button>
        </div>

        {/* Toggle additional facts */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
          >
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showAdvanced ? 'Hide optional details' : 'Add amount, counterparty or reference'}
          </button>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10">
            <div>
              <label className="block text-xs text-white/60 mb-1">Amount (₦)</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="75,000"
                className="w-full bg-black/20 border border-white/15 rounded-xl px-3 py-2 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#B8F25C]"
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Person / Business</label>
              <input
                type="text"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                placeholder="e.g. Landlord / ABC Traders"
                className="w-full bg-black/20 border border-white/15 rounded-xl px-3 py-2 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#B8F25C]"
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-black/20 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#B8F25C]"
              >
                <option value="">Unspecified</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card / POS</option>
              </select>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading || !description.trim()}
            className="flex items-center gap-2 bg-[#B8F25C] text-[#0A1C16] px-6 py-3 rounded-2xl font-semibold hover:bg-[#a3d951] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
          >
            {isLoading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#0A1C16] border-t-transparent" />
                <span>NNOO is reviewing this...</span>
              </>
            ) : (
              <>
                <span>Review with AI</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
