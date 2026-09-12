-- ==============================================================================
-- Migration: Operational Reporting
-- Description: Trusted RPC functions for exact financial and operational aggregations.
-- ==============================================================================

-- 1. Performance Metrics (Selected Period)
CREATE OR REPLACE FUNCTION public.get_dashboard_performance_metrics(
  p_business_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_gross_sales bigint := 0;
  v_sales_count bigint := 0;
  v_refunds bigint := 0;
  v_net_sales bigint := 0;
  v_payments_received bigint := 0;
  v_cogs bigint := 0;
  v_operating_expenses bigint := 0;
  v_inventory_adjustment_gain bigint := 0;
  v_inventory_shrinkage_loss bigint := 0;
  v_gross_profit bigint := 0;
  v_operating_result bigint := 0;
BEGIN
  -- Sales
  SELECT 
    COALESCE(SUM(total_minor), 0),
    COUNT(id)
  INTO v_gross_sales, v_sales_count
  FROM public.sales 
  WHERE business_id = p_business_id 
    AND effective_date >= p_start_date 
    AND effective_date <= p_end_date;

  -- Refunds
  SELECT COALESCE(SUM(total_minor), 0)
  INTO v_refunds
  FROM public.sale_refunds
  WHERE business_id = p_business_id 
    AND effective_date >= p_start_date 
    AND effective_date <= p_end_date;

  v_net_sales := v_gross_sales - v_refunds;

  -- Customer Payments
  SELECT COALESCE(SUM(amount_minor), 0)
  INTO v_payments_received
  FROM public.sale_payments
  WHERE business_id = p_business_id
    AND effective_date >= p_start_date 
    AND effective_date <= p_end_date;

  -- COGS (From Financial Journal, assuming COGS account)
  SELECT COALESCE(SUM(credit_minor) - SUM(debit_minor), 0)
  INTO v_cogs
  FROM public.journal_lines jl
  JOIN public.ledger_accounts la ON jl.ledger_account_id = la.id
  JOIN public.journal_entries je ON jl.journal_entry_id = je.id
  WHERE la.business_id = p_business_id
    AND la.system_key = 'cost_of_goods_sold'
    AND je.effective_date >= p_start_date
    AND je.effective_date <= p_end_date;
  
  -- Since COGS is normal debit, the debit is the expense, credit is reversal. 
  -- We want the net expense magnitude (positive number).
  SELECT COALESCE(SUM(debit_minor) - SUM(credit_minor), 0)
  INTO v_cogs
  FROM public.journal_lines jl
  JOIN public.ledger_accounts la ON jl.ledger_account_id = la.id
  JOIN public.journal_entries je ON jl.journal_entry_id = je.id
  WHERE la.business_id = p_business_id
    AND la.system_key = 'cost_of_goods_sold'
    AND je.effective_date >= p_start_date
    AND je.effective_date <= p_end_date;

  v_gross_profit := v_net_sales - v_cogs;

  -- Operating Expenses
  SELECT COALESCE(SUM(debit_minor) - SUM(credit_minor), 0)
  INTO v_operating_expenses
  FROM public.journal_lines jl
  JOIN public.ledger_accounts la ON jl.ledger_account_id = la.id
  JOIN public.journal_entries je ON jl.journal_entry_id = je.id
  WHERE la.business_id = p_business_id
    AND la.system_key = 'operating_expense'
    AND je.effective_date >= p_start_date
    AND je.effective_date <= p_end_date;

  -- Inventory Adjustment Gain
  SELECT COALESCE(SUM(credit_minor) - SUM(debit_minor), 0)
  INTO v_inventory_adjustment_gain
  FROM public.journal_lines jl
  JOIN public.ledger_accounts la ON jl.ledger_account_id = la.id
  JOIN public.journal_entries je ON jl.journal_entry_id = je.id
  WHERE la.business_id = p_business_id
    AND la.system_key = 'inventory_adjustment_gain'
    AND je.effective_date >= p_start_date
    AND je.effective_date <= p_end_date;

  -- Inventory Shrinkage Loss
  SELECT COALESCE(SUM(debit_minor) - SUM(credit_minor), 0)
  INTO v_inventory_shrinkage_loss
  FROM public.journal_lines jl
  JOIN public.ledger_accounts la ON jl.ledger_account_id = la.id
  JOIN public.journal_entries je ON jl.journal_entry_id = je.id
  WHERE la.business_id = p_business_id
    AND la.system_key = 'inventory_shrinkage_loss'
    AND je.effective_date >= p_start_date
    AND je.effective_date <= p_end_date;

  v_operating_result := v_gross_profit - v_operating_expenses - v_inventory_shrinkage_loss + v_inventory_adjustment_gain;

  RETURN jsonb_build_object(
    'grossSalesMinor', v_gross_sales::text,
    'salesCount', v_sales_count,
    'refundsMinor', v_refunds::text,
    'netSalesMinor', v_net_sales::text,
    'customerPaymentsReceivedMinor', v_payments_received::text,
    'cogsMinor', v_cogs::text,
    'grossProfitMinor', v_gross_profit::text,
    'operatingExpensesMinor', v_operating_expenses::text,
    'inventoryAdjustmentGainMinor', v_inventory_adjustment_gain::text,
    'inventoryShrinkageLossMinor', v_inventory_shrinkage_loss::text,
    'operatingResultMinor', v_operating_result::text
  );
END;
$$;

-- 2. Current Position Metrics
CREATE OR REPLACE FUNCTION public.get_dashboard_current_position(
  p_business_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_accounts_receivable bigint := 0;
  v_accounts_payable bigint := 0;
  v_inventory_value bigint := 0;
  v_low_stock_count integer := 0;
  v_out_of_stock_count integer := 0;
  v_overdue_invoices integer := 0;
BEGIN
  -- Accounts Receivable
  SELECT COALESCE(SUM(debit_minor) - SUM(credit_minor), 0)
  INTO v_accounts_receivable
  FROM public.journal_lines jl
  JOIN public.ledger_accounts la ON jl.ledger_account_id = la.id
  WHERE la.business_id = p_business_id
    AND la.system_key = 'accounts_receivable';

  -- Accounts Payable
  SELECT COALESCE(SUM(credit_minor) - SUM(debit_minor), 0)
  INTO v_accounts_payable
  FROM public.journal_lines jl
  JOIN public.ledger_accounts la ON jl.ledger_account_id = la.id
  WHERE la.business_id = p_business_id
    AND la.system_key = 'accounts_payable';

  -- Inventory Value
  SELECT COALESCE(SUM(inventory_value_minor), 0)
  INTO v_inventory_value
  FROM public.inventory_positions
  WHERE business_id = p_business_id;

  -- Stock Counts
  SELECT 
    COUNT(*) FILTER (WHERE quantity_on_hand > 0 AND quantity_on_hand <= low_stock_threshold),
    COUNT(*) FILTER (WHERE quantity_on_hand <= 0)
  INTO v_low_stock_count, v_out_of_stock_count
  FROM public.inventory_positions p
  JOIN public.catalog_items c ON p.catalog_item_id = c.id
  WHERE p.business_id = p_business_id;

  -- Overdue Invoices
  SELECT COUNT(*)
  INTO v_overdue_invoices
  FROM public.invoices
  WHERE business_id = p_business_id
    AND document_status = 'issued'
    AND due_date IS NOT NULL
    AND due_date < CURRENT_DATE
    AND total_minor > 0;

  RETURN jsonb_build_object(
    'accountsReceivableMinor', v_accounts_receivable::text,
    'accountsPayableMinor', v_accounts_payable::text,
    'inventoryValueMinor', v_inventory_value::text,
    'lowStockCount', COALESCE(v_low_stock_count, 0),
    'outOfStockCount', COALESCE(v_out_of_stock_count, 0),
    'overdueInvoicesCount', COALESCE(v_overdue_invoices, 0)
  );
END;
$$;

-- 3. Sales Trend
CREATE OR REPLACE FUNCTION public.get_sales_trend(
  p_business_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  WITH date_series AS (
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date AS d
  ),
  daily_sales AS (
    SELECT effective_date, COALESCE(SUM(total_minor), 0) AS gross_sales
    FROM public.sales
    WHERE business_id = p_business_id AND effective_date >= p_start_date AND effective_date <= p_end_date
    GROUP BY effective_date
  ),
  daily_refunds AS (
    SELECT effective_date, COALESCE(SUM(total_minor), 0) AS total_refunds
    FROM public.sale_refunds
    WHERE business_id = p_business_id AND effective_date >= p_start_date AND effective_date <= p_end_date
    GROUP BY effective_date
  ),
  daily_expenses AS (
    SELECT je.effective_date, COALESCE(SUM(jl.debit_minor) - SUM(jl.credit_minor), 0) AS net_expense
    FROM public.journal_lines jl
    JOIN public.ledger_accounts la ON jl.ledger_account_id = la.id
    JOIN public.journal_entries je ON jl.journal_entry_id = je.id
    WHERE la.business_id = p_business_id
      AND la.system_key = 'operating_expense'
      AND je.effective_date >= p_start_date
      AND je.effective_date <= p_end_date
    GROUP BY je.effective_date
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', ds.d::text,
      'netSalesMinor', (COALESCE(dsales.gross_sales, 0) - COALESCE(dref.total_refunds, 0))::text,
      'expensesMinor', COALESCE(dexp.net_expense, 0)::text
    ) ORDER BY ds.d
  ) INTO v_result
  FROM date_series ds
  LEFT JOIN daily_sales dsales ON ds.d = dsales.effective_date
  LEFT JOIN daily_refunds dref ON ds.d = dref.effective_date
  LEFT JOIN daily_expenses dexp ON ds.d = dexp.effective_date;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 4. Recent Activity
CREATE OR REPLACE FUNCTION public.get_recent_activity(
  p_business_id uuid,
  p_limit int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  WITH combined AS (
    SELECT 
      id, 'sale' as event_type, occurred_at, 
      'Sale ' || sale_number as description,
      total_minor as amount_minor, currency_code
    FROM public.sales 
    WHERE business_id = p_business_id
    UNION ALL
    SELECT 
      id, 'sale_payment' as event_type, occurred_at, 
      'Payment Received via ' || payment_method as description,
      amount_minor, currency_code
    FROM public.sale_payments 
    WHERE business_id = p_business_id
    UNION ALL
    SELECT 
      id, 'operating_expense' as event_type, occurred_at, 
      'Expense: ' || COALESCE(notes, expense_number) as description,
      total_minor as amount_minor, currency_code
    FROM public.expenses 
    WHERE business_id = p_business_id
    UNION ALL
    SELECT 
      id, 'expense_payment' as event_type, occurred_at, 
      'Expense Payment via ' || payment_method as description,
      amount_minor, currency_code
    FROM public.expense_payments 
    WHERE business_id = p_business_id
    ORDER BY occurred_at DESC
    LIMIT p_limit
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'eventType', event_type,
      'occurredAt', occurred_at,
      'description', description,
      'amountMinor', amount_minor::text,
      'currencyCode', currency_code
    )
  ) INTO v_result
  FROM combined;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
