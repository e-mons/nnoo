'use client';

import React, { useState } from 'react';
import { activateBillingPlan, deactivateBillingPlan } from '@/lib/actions/admin-billing';
import { useRouter } from 'next/navigation';

export function PlanStatusToggle({ planId, isActive }: { planId: string; isActive: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (isActive) {
        await deactivateBillingPlan(planId);
      } else {
        await activateBillingPlan(planId);
      }
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update plan status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors disabled:opacity-50 ${
          isActive 
            ? 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900' 
            : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
        }`}
      >
        {loading ? '...' : isActive ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  );
}
