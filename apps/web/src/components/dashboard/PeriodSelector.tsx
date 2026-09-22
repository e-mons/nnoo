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

    // Canonical period date boundary calculation in local ISO format (YYYY-MM-DD)
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
    <div className="flex items-center">
      <select 
        value={currentPeriod}
        onChange={(e) => handlePeriodChange(e.target.value)}
        className="bg-[#143628] hover:bg-[#1A4533] border border-white/20 text-white font-medium rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#B8F25C]/50 focus:border-[#B8F25C] transition cursor-pointer [&>option]:bg-[#0A1C16] [&>option]:text-white"
        aria-label="Select performance period"
      >
        <option value="this_month" className="bg-[#0A1C16] text-white py-1">This Month</option>
        <option value="last_month" className="bg-[#0A1C16] text-white py-1">Last Month</option>
        <option value="this_year" className="bg-[#0A1C16] text-white py-1">This Year</option>
      </select>
    </div>
  );
}
