-- Migration: 20260901000000_performance_index_optimization.sql
-- Purpose: Add targeted composite and foreign key indexes on high-volume tables to eliminate Seq Scans and explicit Sort steps.

-- 1. Sales query optimizations (status filter + occurred_at sort, effective_date range)
CREATE INDEX IF NOT EXISTS idx_sales_biz_payment_occurred 
  ON public.sales(business_id, payment_status, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_biz_effective_date 
  ON public.sales(business_id, effective_date DESC);

-- 2. Expenses query optimizations (status filter + occurred_at sort, payment status + occurred_at sort, effective_date range)
CREATE INDEX IF NOT EXISTS idx_expenses_biz_status_occurred 
  ON public.expenses(business_id, status, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_biz_payment_occurred 
  ON public.expenses(business_id, payment_status, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_biz_effective_date 
  ON public.expenses(business_id, effective_date DESC);

-- 3. Invoices query optimizations (document_status + due_date for AR aging, created_at DESC for list)
CREATE INDEX IF NOT EXISTS idx_invoices_biz_status_due 
  ON public.invoices(business_id, document_status, due_date ASC);

CREATE INDEX IF NOT EXISTS idx_invoices_biz_created 
  ON public.invoices(business_id, created_at DESC);

-- 4. Inventory movements query optimizations (product movement history, business movement ledger)
CREATE INDEX IF NOT EXISTS idx_inventory_movements_biz_item_occurred 
  ON public.inventory_movements(business_id, catalog_item_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_biz_occurred 
  ON public.inventory_movements(business_id, occurred_at DESC);

-- 5. Journal lines foreign-key and account reporting indexes (eliminates Seq Scan on journal line joins)
CREATE INDEX IF NOT EXISTS idx_journal_lines_entry_id 
  ON public.journal_lines(journal_entry_id);

CREATE INDEX IF NOT EXISTS idx_journal_lines_biz_account 
  ON public.journal_lines(business_id, ledger_account_id);

-- 6. Journal entries period reporting indexes
CREATE INDEX IF NOT EXISTS idx_journal_entries_biz_occurred 
  ON public.journal_entries(business_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_journal_entries_biz_effective_date 
  ON public.journal_entries(business_id, effective_date DESC);
