'use server';

import { createClient } from '@/lib/supabase/server';
import { 
  BusinessDashboardSummary,
  PerformanceMetrics,
  CurrentPositionMetrics,
  SalesTrendPoint,
  RecentActivityEvent
} from '@nnoo/contracts';
import {
  DashboardParams,
  dashboardParamsSchema
} from '@nnoo/validation';

export async function getBusinessDashboardSummary(params: DashboardParams): Promise<BusinessDashboardSummary> {
  const parsed = dashboardParamsSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error('Invalid dashboard parameters');
  }

  const { business_id, start_date, end_date } = parsed.data;
  const supabase = await createClient();

  // We perform RPC calls. Due to SECURITY INVOKER on the functions, they will naturally 
  // enforce the user's RLS permissions against sales, expenses, inventory, etc.
  
  const [perfRes, posRes, trendRes, actRes] = await Promise.all([
    supabase.rpc('get_dashboard_performance_metrics', {
      p_business_id: business_id,
      p_start_date: start_date,
      p_end_date: end_date
    }),
    supabase.rpc('get_dashboard_current_position', {
      p_business_id: business_id
    }),
    supabase.rpc('get_sales_trend', {
      p_business_id: business_id,
      p_start_date: start_date,
      p_end_date: end_date
    }),
    supabase.rpc('get_recent_activity', {
      p_business_id: business_id,
      p_limit: 10
    })
  ]);

  if (perfRes.error) throw new Error(`Failed to fetch performance: ${perfRes.error.message}`);
  if (posRes.error) throw new Error(`Failed to fetch position: ${posRes.error.message}`);
  if (trendRes.error) throw new Error(`Failed to fetch trend: ${trendRes.error.message}`);
  if (actRes.error) throw new Error(`Failed to fetch activity: ${actRes.error.message}`);

  return {
    periodStart: start_date,
    periodEnd: end_date,
    performance: perfRes.data as PerformanceMetrics,
    currentPosition: posRes.data as CurrentPositionMetrics,
    salesTrend: trendRes.data as SalesTrendPoint[],
    recentActivity: actRes.data as RecentActivityEvent[]
  };
}
