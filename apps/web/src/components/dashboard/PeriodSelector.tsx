'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export function PeriodSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePeriodChange = useCallback((period: string) => {
    const today = new Date();
    let start = '';
    let end = '';

    // Very naive date math for demo purposes, assume Africa/Lagos
    if (period === 'this_month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (period === 'last_month') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
      end = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
    } else if (period === 'this_year') {
      start = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
      end = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
    }

    const params = new URLSearchParams(searchParams.toString());
    if (start && end) {
      params.set('start', start);
      params.set('end', end);
      params.set('period', period);
    } else {
      params.delete('start');
      params.delete('end');
      params.delete('period');
    }

    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  const currentPeriod = searchParams.get('period') || 'this_month';

  return (
    <div className="flex gap-2">
      <select 
        value={currentPeriod}
        onChange={(e) => handlePeriodChange(e.target.value)}
        className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm"
      >
        <option value="this_month">This Month</option>
        <option value="last_month">Last Month</option>
        <option value="this_year">This Year</option>
      </select>
    </div>
  );
}
