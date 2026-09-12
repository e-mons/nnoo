-- Migration: Fix recent activity query
-- The get_recent_activity function incorrectly referenced operating_expenses instead of expenses

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
