'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { archiveSupplier, reactivateSupplier } from '@/lib/actions/supplier';
import { SupplierStatus } from '@nnoo/contracts';
import { Archive, RefreshCcw, AlertTriangle } from 'lucide-react';

interface SupplierActionsProps {
  businessId: string;
  businessSlug: string;
  supplierId: string;
  currentStatus: SupplierStatus;
  canArchive: boolean;
}

export function SupplierActions({
  businessId,
  businessSlug,
  supplierId,
  currentStatus,
  canArchive,
}: SupplierActionsProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canArchive) return null;

  const handleAction = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      if (currentStatus === 'active') {
        const result = await archiveSupplier(businessId, supplierId);
        if (!result.success) {
          setError(result.error || 'Failed to archive');
          setIsProcessing(false);
          return;
        }
      } else {
        const result = await reactivateSupplier(businessId, supplierId);
        if (!result.success) {
          setError(result.error || 'Failed to reactivate');
          setIsProcessing(false);
          return;
        }
      }
      
      router.refresh();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'An error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleAction}
        disabled={isProcessing}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          currentStatus === 'active'
            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
            : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
        }`}
      >
        {isProcessing ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : currentStatus === 'active' ? (
          <Archive className="w-4 h-4" />
        ) : (
          <RefreshCcw className="w-4 h-4" />
        )}
        {currentStatus === 'active' ? 'Archive Supplier' : 'Reactivate Supplier'}
      </button>
      
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
          <AlertTriangle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  );
}
