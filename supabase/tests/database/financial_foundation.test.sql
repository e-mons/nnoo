BEGIN;
SELECT plan(17);

-- 1. Create a dummy user and business for testing
SELECT has_table('ledger_accounts');
SELECT has_table('journal_entries');
SELECT has_table('journal_lines');
SELECT has_function('post_financial_entry');

DO $$
DECLARE
  test_user_id uuid := '00000000-0000-0000-0000-000000000001';
  test_biz_id uuid := '00000000-0000-0000-0000-000000000002';
  test_biz_b_id uuid := '00000000-0000-0000-0000-000000000003';
BEGIN
  -- We assume businesses table doesn't have required fields we can't fake, just insert id
  INSERT INTO public.businesses (id, name, slug) VALUES (test_biz_id, 'Test Biz A', 'test-biz-a');
  INSERT INTO public.businesses (id, name, slug) VALUES (test_biz_b_id, 'Test Biz B', 'test-biz-b');
  
  -- The trigger ensure_business_ledger_accounts should have run for both
END;
$$;

-- 2. Verify Provisioning
SELECT results_eq(
  $$ SELECT count(*)::int FROM public.ledger_accounts WHERE business_id = '00000000-0000-0000-0000-000000000002' $$,
  ARRAY[8],
  'Business A should have 8 system ledger accounts auto-provisioned'
);

-- 3. Prepare payload for a valid posting
DO $$
DECLARE
  cash_account_id uuid;
  revenue_account_id uuid;
  biz_id uuid := '00000000-0000-0000-0000-000000000002';
  payload jsonb;
  res jsonb;
BEGIN
  SELECT id INTO cash_account_id FROM public.ledger_accounts WHERE business_id = biz_id AND system_key = 'cash_and_cash_equivalents';
  SELECT id INTO revenue_account_id FROM public.ledger_accounts WHERE business_id = biz_id AND system_key = 'sales_revenue';

  payload := jsonb_build_object(
    'businessId', biz_id,
    'currencyCode', 'NGN',
    'sourceEventType', 'sale',
    'sourceEventId', 'sale-001',
    'idempotencyKey', 'idem-sale-001',
    'occurredAt', '2026-08-01T12:00:00Z',
    'effectiveDate', '2026-08-01',
    'description', 'Test Sale',
    'lines', jsonb_build_array(
      jsonb_build_object('ledgerAccountId', cash_account_id, 'debitMinor', '10000', 'creditMinor', '0'),
      jsonb_build_object('ledgerAccountId', revenue_account_id, 'debitMinor', '0', 'creditMinor', '10000')
    )
  );

  res := public.post_financial_entry(payload);
  
  -- Check idempotency
  PERFORM public.post_financial_entry(payload);
END;
$$;

SELECT results_eq(
  $$ SELECT count(*)::int FROM public.journal_entries WHERE idempotency_key = 'idem-sale-001' $$,
  ARRAY[1],
  'Idempotency should prevent duplicate entries'
);

SELECT results_eq(
  $$ SELECT debit_minor::int FROM public.journal_lines WHERE debit_minor > 0 LIMIT 1 $$,
  ARRAY[10000],
  'Valid entry debits inserted correctly'
);

-- 4. Test Unbalanced Entry
PREPARE unbalanced_entry AS
SELECT public.post_financial_entry(
  jsonb_build_object(
    'businessId', '00000000-0000-0000-0000-000000000002',
    'currencyCode', 'NGN',
    'sourceEventType', 'sale',
    'sourceEventId', 'sale-002',
    'idempotencyKey', 'idem-sale-002',
    'occurredAt', '2026-08-01T12:00:00Z',
    'effectiveDate', '2026-08-01',
    'lines', jsonb_build_array(
      jsonb_build_object(
        'ledgerAccountId', (SELECT id FROM public.ledger_accounts WHERE business_id = '00000000-0000-0000-0000-000000000002' LIMIT 1 OFFSET 0), 
        'debitMinor', '10000', 'creditMinor', '0'
      ),
      jsonb_build_object(
        'ledgerAccountId', (SELECT id FROM public.ledger_accounts WHERE business_id = '00000000-0000-0000-0000-000000000002' LIMIT 1 OFFSET 1), 
        'debitMinor', '0', 'creditMinor', '9000'
      )
    )
  )
);
SELECT throws_like('EXECUTE unbalanced_entry', '%Journal entry does not balance%', 'Unbalanced entry is rejected');

-- 5. Test Zero Entry
PREPARE zero_entry AS
SELECT public.post_financial_entry(
  jsonb_build_object(
    'businessId', '00000000-0000-0000-0000-000000000002',
    'currencyCode', 'NGN',
    'sourceEventType', 'sale',
    'sourceEventId', 'sale-003',
    'idempotencyKey', 'idem-sale-003',
    'occurredAt', '2026-08-01T12:00:00Z',
    'effectiveDate', '2026-08-01',
    'lines', jsonb_build_array(
      jsonb_build_object(
        'ledgerAccountId', (SELECT id FROM public.ledger_accounts WHERE business_id = '00000000-0000-0000-0000-000000000002' LIMIT 1 OFFSET 0), 
        'debitMinor', '0', 'creditMinor', '0'
      ),
      jsonb_build_object(
        'ledgerAccountId', (SELECT id FROM public.ledger_accounts WHERE business_id = '00000000-0000-0000-0000-000000000002' LIMIT 1 OFFSET 1), 
        'debitMinor', '0', 'creditMinor', '0'
      )
    )
  )
);
SELECT throws_like('EXECUTE zero_entry', '%Each line must have either a positive debit%', 'Zero entry is rejected');

-- 6. Test Cross-Business Entry
PREPARE cross_biz_entry AS
SELECT public.post_financial_entry(
  jsonb_build_object(
    'businessId', '00000000-0000-0000-0000-000000000002',
    'currencyCode', 'NGN',
    'sourceEventType', 'sale',
    'sourceEventId', 'sale-004',
    'idempotencyKey', 'idem-sale-004',
    'occurredAt', '2026-08-01T12:00:00Z',
    'effectiveDate', '2026-08-01',
    'lines', jsonb_build_array(
      jsonb_build_object(
        'ledgerAccountId', (SELECT id FROM public.ledger_accounts WHERE business_id = '00000000-0000-0000-0000-000000000002' LIMIT 1 OFFSET 0), 
        'debitMinor', '10000', 'creditMinor', '0'
      ),
      jsonb_build_object(
        'ledgerAccountId', (SELECT id FROM public.ledger_accounts WHERE business_id = '00000000-0000-0000-0000-000000000003' LIMIT 1 OFFSET 0), 
        'debitMinor', '0', 'creditMinor', '10000'
      )
    )
  )
);
SELECT throws_like('EXECUTE cross_biz_entry', '%does not belong to business%', 'Cross-business entry is rejected');

-- 7. Test Negative Money
PREPARE negative_money_entry AS
SELECT public.post_financial_entry(
  jsonb_build_object(
    'businessId', '00000000-0000-0000-0000-000000000002',
    'currencyCode', 'NGN',
    'sourceEventType', 'sale',
    'sourceEventId', 'sale-005',
    'idempotencyKey', 'idem-sale-005',
    'occurredAt', '2026-08-01T12:00:00Z',
    'effectiveDate', '2026-08-01',
    'lines', jsonb_build_array(
      jsonb_build_object(
        'ledgerAccountId', (SELECT id FROM public.ledger_accounts WHERE business_id = '00000000-0000-0000-0000-000000000002' LIMIT 1 OFFSET 0), 
        'debitMinor', '-10000', 'creditMinor', '0'
      ),
      jsonb_build_object(
        'ledgerAccountId', (SELECT id FROM public.ledger_accounts WHERE business_id = '00000000-0000-0000-0000-000000000002' LIMIT 1 OFFSET 1), 
        'debitMinor', '0', 'creditMinor', '-10000'
      )
    )
  )
);
SELECT throws_like('EXECUTE negative_money_entry', '%Negative amounts are not allowed%', 'Negative amounts are rejected');

-- 8. Test Reversal
DO $$
DECLARE
  orig_id uuid;
  res jsonb;
BEGIN
  SELECT id INTO orig_id FROM public.journal_entries WHERE idempotency_key = 'idem-sale-001';
  res := public.reverse_financial_entry(orig_id, 'idem-reversal-001', 'Test Reversal', NULL);
END;
$$;

SELECT results_eq(
  $$ SELECT count(*)::int FROM public.journal_entries WHERE idempotency_key = 'idem-reversal-001' $$,
  ARRAY[1],
  'Reversal entry successfully created'
);

SELECT results_eq(
  $$ SELECT (reversed_by_entry_id IS NOT NULL)::int FROM public.journal_entries WHERE idempotency_key = 'idem-sale-001' $$,
  ARRAY[1],
  'Original entry marked as reversed'
);

PREPARE double_reversal AS
SELECT public.reverse_financial_entry(
  (SELECT id FROM public.journal_entries WHERE idempotency_key = 'idem-sale-001'), 
  'idem-reversal-002', 
  'Test Reversal 2', 
  NULL
);
SELECT throws_like('EXECUTE double_reversal', '%already reversed%', 'Duplicate reversal is rejected');


SELECT * FROM finish();
ROLLBACK;
