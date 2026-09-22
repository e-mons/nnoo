import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { getBusinessDashboardSummary } from '@/lib/actions/reporting';
import { PeriodSelector } from '@/components/dashboard/PeriodSelector';
import { SalesTrendChart } from '@/components/dashboard/SalesTrendChart';
import { Sparkles, Activity, FileBadge } from 'lucide-react';

export default async function BusinessDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { businessSlug } = await params;
  const { start, end } = await searchParams;
  
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, currency_code')
    .eq('id', businessSlug)
    .single();

  if (!business) notFound();

  // Default to current month if not provided
  let start_date = start;
  let end_date = end;

  if (!start_date || !end_date) {
    const now = new Date();
    start_date = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    end_date = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  }

  const summary = await getBusinessDashboardSummary({
    business_id: business.id,
    start_date,
    end_date,
  });

  const formatMoney = (minorStr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: business.currency_code || 'NGN',
    }).format(parseInt(minorStr, 10) / 100);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-white/60">{business.name} Overview</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/app/${businessSlug}/money`}
            className="px-3.5 py-2 bg-[#B8F25C] hover:bg-[#A3D94E] text-[#0A1C16] rounded-xl text-xs font-bold transition shadow-sm"
          >
            💰 Money Hub
          </Link>
          <Link
            href={`/app/${businessSlug}/advisor?tab=passport`}
            className="px-3.5 py-2 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          >
            <FileBadge className="w-3.5 h-3.5" />
            Credit Passport
          </Link>
          <Link
            href={`/app/${businessSlug}/advisor?tab=health`}
            className="px-3.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          >
            <Activity className="w-3.5 h-3.5" />
            Business Health
          </Link>
          <Link
            href={`/app/${businessSlug}/advisor?tab=insights`}
            className="px-3.5 py-2 bg-[#B8F25C]/15 hover:bg-[#B8F25C]/25 text-[#B8F25C] border border-[#B8F25C]/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Smart Insights
          </Link>
          <PeriodSelector />
        </div>
      </div>

      {/* PERFORMANCE - SELECTED PERIOD */}
      <div>
        <h2 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">Performance — Selected Period</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#143628]/40 border border-white/10 rounded-2xl p-5 backdrop-blur-xl min-w-0 overflow-hidden flex flex-col justify-between">
            <h3 className="text-white/60 text-xs sm:text-sm font-medium mb-1 truncate">Net Sales</h3>
            <p className="text-xl sm:text-2xl font-bold text-white tracking-tight tabular-nums truncate" title={formatMoney(summary.performance.netSalesMinor)}>
              {formatMoney(summary.performance.netSalesMinor)}
            </p>
          </div>
          <div className="bg-[#143628]/40 border border-white/10 rounded-2xl p-5 backdrop-blur-xl min-w-0 overflow-hidden flex flex-col justify-between">
            <h3 className="text-white/60 text-xs sm:text-sm font-medium mb-1 truncate">Gross Profit</h3>
            <p className="text-xl sm:text-2xl font-bold text-white tracking-tight tabular-nums truncate" title={formatMoney(summary.performance.grossProfitMinor)}>
              {formatMoney(summary.performance.grossProfitMinor)}
            </p>
          </div>
          <div className="bg-[#143628]/40 border border-white/10 rounded-2xl p-5 backdrop-blur-xl min-w-0 overflow-hidden flex flex-col justify-between">
            <h3 className="text-white/60 text-xs sm:text-sm font-medium mb-1 truncate">Operating Expenses</h3>
            <p className="text-xl sm:text-2xl font-bold text-white tracking-tight tabular-nums truncate" title={formatMoney(summary.performance.operatingExpensesMinor)}>
              {formatMoney(summary.performance.operatingExpensesMinor)}
            </p>
          </div>
          <div className="bg-[#143628]/40 border border-[#B8F25C]/30 rounded-2xl p-5 backdrop-blur-xl min-w-0 overflow-hidden flex flex-col justify-between">
            <h3 className="text-[#B8F25C]/80 text-xs sm:text-sm font-medium mb-1 truncate">Operating Result</h3>
            <p className="text-xl sm:text-2xl font-bold text-[#B8F25C] tracking-tight tabular-nums truncate" title={formatMoney(summary.performance.operatingResultMinor)}>
              {formatMoney(summary.performance.operatingResultMinor)}
            </p>
          </div>
        </div>
      </div>

      {/* TREND CHART */}
      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
        <h3 className="font-semibold text-white">Sales & Expenses Trend</h3>
        <SalesTrendChart data={summary.salesTrend} currencyCode={business.currency_code} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CURRENT POSITION */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">Current Business Position</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 min-w-0 overflow-hidden flex flex-col justify-between">
              <h3 className="text-white/60 text-xs sm:text-sm font-medium mb-1 truncate">Accounts Receivable</h3>
              <p className="text-lg sm:text-xl font-bold text-white tracking-tight tabular-nums truncate" title={formatMoney(summary.currentPosition.accountsReceivableMinor)}>
                {formatMoney(summary.currentPosition.accountsReceivableMinor)}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 min-w-0 overflow-hidden flex flex-col justify-between">
              <h3 className="text-white/60 text-xs sm:text-sm font-medium mb-1 truncate">Accounts Payable</h3>
              <p className="text-lg sm:text-xl font-bold text-white tracking-tight tabular-nums truncate" title={formatMoney(summary.currentPosition.accountsPayableMinor)}>
                {formatMoney(summary.currentPosition.accountsPayableMinor)}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 min-w-0 overflow-hidden flex flex-col justify-between">
              <h3 className="text-white/60 text-xs sm:text-sm font-medium mb-1 truncate">Inventory Value</h3>
              <p className="text-lg sm:text-xl font-bold text-white tracking-tight tabular-nums truncate" title={formatMoney(summary.currentPosition.inventoryValueMinor)}>
                {formatMoney(summary.currentPosition.inventoryValueMinor)}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-center min-w-0">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/60 text-xs sm:text-sm truncate">Low Stock Items</span>
                <span className="text-yellow-400 font-bold tabular-nums ml-2">{summary.currentPosition.lowStockCount}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/60 text-xs sm:text-sm truncate">Out of Stock</span>
                <span className="text-red-400 font-bold tabular-nums ml-2">{summary.currentPosition.outOfStockCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-xs sm:text-sm truncate">Overdue Invoices</span>
                <span className="text-orange-400 font-bold tabular-nums ml-2">{summary.currentPosition.overdueInvoicesCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4">Recent Activity</h2>
          <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl h-full">
            <div className="space-y-6">
              {summary.recentActivity.length === 0 && (
                <p className="text-white/50 text-sm">No recent activity.</p>
              )}
              {summary.recentActivity.map((evt) => (
                <div key={evt.id} className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-sm text-white font-medium capitalize">{evt.eventType.replace('_', ' ')}</p>
                    <p className="text-xs text-white/60">{evt.description}</p>
                    <p className="text-xs text-white/40 mt-1">{new Date(evt.occurredAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="text-sm font-semibold text-white">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: evt.currencyCode }).format(parseInt(evt.amountMinor, 10) / 100)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
