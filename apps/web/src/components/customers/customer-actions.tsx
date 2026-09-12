'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { archiveCustomer, reactivateCustomer } from '@/lib/actions/customer';
import { Archive, Play, AlertTriangle } from 'lucide-react';
import { CustomerStatus } from '@nnoo/contracts';

interface CustomerActionsProps {
  businessId: string;
  businessSlug: string;
  customerId: string;
  currentStatus: CustomerStatus;
  canArchive: boolean;
}

export function CustomerActions({ businessId, customerId, currentStatus, canArchive }: CustomerActionsProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async () => {
    if (!confirm(`Are you sure you want to ${currentStatus === 'active' ? 'archive' : 'reactivate'} this customer?`)) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      const result = currentStatus === 'active'
        ? await archiveCustomer(businessId, customerId)
        : await reactivateCustomer(businessId, customerId);

      if (!result.success) {
        setError(result.error || 'Failed to update customer status');
        setIsProcessing(false);
        return;
      }

      router.refresh();
      setIsProcessing(false);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'An error occurred');
      setIsProcessing(false);
    }
  };

  if (!canArchive) return null;

  return (
    <div className="flex flex-col items-end gap-2">
      {error && (
        <div className="text-red-400 text-sm flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}
      <button
        onClick={handleAction}
        disabled={isProcessing}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
          currentStatus === 'active' 
            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20' 
            : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20'
        } disabled:opacity-50`}
      >
        {isProcessing ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : currentStatus === 'active' ? (
          <Archive className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        {currentStatus === 'active' ? 'Archive Customer' : 'Reactivate Customer'}
      </button>
    </div>
  );
}
