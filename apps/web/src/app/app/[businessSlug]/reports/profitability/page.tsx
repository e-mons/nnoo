import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PeriodSelector } from '@/components/dashboard/PeriodSelector';

export default async function ProfitabilityReportPage({
  params,
  searchParams
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { businessSlug } = resolvedParams;
  const { start, end } = resolvedSearchParams;
  
  const supabase = await createClient();
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, currency_code')
    .eq('id', businessSlug)
    .single();

  if (!business) notFound();

  let start_date = start;
  let end_date = end;
  if (!start_date || !end_date) {
    const today = new Date();
    start_date = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    end_date = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  }

  const { data: perfData, error } = await supabase.rpc('get_dashboard_performance_metrics', {
    p_business_id: business.id,
    p_start_date: start_date,
    p_end_date: end_date
  });

  if (error) {
    console.error(error);
  }

  const formatMoney = (minor: number | string | undefined) => {
    const minorNum = typeof minor === 'string' ? parseInt(minor, 10) : (minor || 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: business.currency_code
    }).format(minorNum / 100);
  };

  const perf = perfData as Record<string, string | number> || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Profitability</h2>
          <p className="text-sm text-white/60">Profit & Loss view for the selected period.</p>
        </div>
        <div className="flex gap-4">
          <PeriodSelector />
        </div>
      </div>

      <div className="bg-[#143628]/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl p-8 max-w-3xl">
        <h3 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">Income Statement</h3>
        
        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-center text-white/80">
            <span>Gross Sales</span>
            <span>{formatMoney(perf.grossSalesMinor)}</span>
          </div>
          <div className="flex justify-between items-center text-red-400">
            <span>Less: Refunds</span>
            <span>({formatMoney(perf.refundsMinor)})</span>
          </div>
          
          <div className="flex justify-between items-center text-white font-semibold pt-4 border-t border-white/10">
            <span>Net Sales</span>
            <span>{formatMoney(perf.netSalesMinor)}</span>
          </div>
          
          <div className="flex justify-between items-center text-white/80 pt-4">
            <span>Cost of Goods Sold (COGS)</span>
            <span>{formatMoney(perf.cogsMinor)}</span>
          </div>
          
          <div className="flex justify-between items-center text-white font-semibold pt-4 border-t border-white/10 text-lg">
            <span>Gross Profit</span>
            <span>{formatMoney(perf.grossProfitMinor)}</span>
          </div>
          
          <div className="pt-6 pb-2 border-b border-white/10">
            <span className="text-white/50 uppercase text-xs font-bold tracking-wider">Operating Expenses</span>
          </div>
          
          <div className="flex justify-between items-center text-white/80">
            <span>Total Operating Expenses</span>
            <span>{formatMoney(perf.operatingExpensesMinor)}</span>
          </div>
          
          {parseInt(String(perf.inventoryShrinkageLossMinor || '0'), 10) > 0 && (
            <div className="flex justify-between items-center text-white/80">
              <span>Inventory Shrinkage Loss</span>
              <span>{formatMoney(perf.inventoryShrinkageLossMinor)}</span>
            </div>
          )}

          {parseInt(String(perf.inventoryAdjustmentGainMinor || '0'), 10) > 0 && (
            <div className="flex justify-between items-center text-white/80">
              <span>Inventory Adjustment Gain</span>
              <span>{formatMoney(perf.inventoryAdjustmentGainMinor)}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center text-[#B8F25C] font-bold pt-6 border-t border-white/20 text-xl">
            <span>Net Operating Result</span>
            <span>{formatMoney(perf.operatingResultMinor)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
