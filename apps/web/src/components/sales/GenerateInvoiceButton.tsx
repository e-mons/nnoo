'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateInvoiceFromSale } from '@/lib/actions/invoices';
import { FileText, Loader2 } from 'lucide-react';

export function GenerateInvoiceButton({ businessSlug, saleId }: { businessSlug: string, saleId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const invoiceId = await generateInvoiceFromSale(saleId);
      router.push(`/app/${businessSlug}/invoices/${invoiceId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate invoice');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button 
        onClick={handleGenerate}
        disabled={isSubmitting}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        Turn into Invoice
      </button>
      {error && <span className="text-xs text-red-400 absolute mt-12">{error}</span>}
    </div>
  );
}
