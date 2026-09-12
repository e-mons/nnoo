-- ==============================================================================
-- Migration: Financial & Operational Data Foundation
-- Description: Creates the canonical double-entry accounting foundation.
-- ==============================================================================

-- 1. Ledger Accounts Table
CREATE TABLE public.ledger_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  code text,
  name text NOT NULL,
  account_class text NOT NULL CHECK (account_class IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  system_key text,
  normal_balance text CHECK (normal_balance IN ('debit', 'credit')),
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, code),
  UNIQUE (business_id, system_key)
);

-- Protect system accounts from deletion
CREATE OR REPLACE FUNCTION public.prevent_system_account_deletion()
RETURNS trigger AS $$
BEGIN
  IF OLD.is_system THEN
    RAISE EXCEPTION 'Cannot delete a system ledger account.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER protect_system_ledger_accounts
BEFORE DELETE ON public.ledger_accounts
FOR EACH ROW
EXECUTE FUNCTION public.prevent_system_account_deletion();

-- 2. Journal Entries (Headers)
CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  currency_code text NOT NULL,
  source_event_type text NOT NULL,
  source_event_id text NOT NULL,
  idempotency_key text NOT NULL,
  occurred_at timestamptz NOT NULL,
  effective_date date NOT NULL,
  description text,
  created_by_user_id uuid REFERENCES auth.users(id),
  reversed_by_entry_id uuid REFERENCES public.journal_entries(id),
  reversal_of_entry_id uuid REFERENCES public.journal_entries(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, source_event_type, source_event_id),
  UNIQUE (business_id, idempotency_key)
);

-- 3. Journal Lines
CREATE TABLE public.journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  ledger_account_id uuid NOT NULL REFERENCES public.ledger_accounts(id) ON DELETE RESTRICT,
  debit_minor bigint NOT NULL DEFAULT 0 CHECK (debit_minor >= 0),
  credit_minor bigint NOT NULL DEFAULT 0 CHECK (credit_minor >= 0),
  memo text,
  line_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT journal_lines_positive_check CHECK (
    (debit_minor > 0 AND credit_minor = 0) OR (debit_minor = 0 AND credit_minor > 0)
  )
);

-- ==============================================================================
-- Provisioning Function
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.ensure_business_ledger_accounts(p_business_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert required system accounts idempotently
  INSERT INTO public.ledger_accounts (business_id, name, account_class, system_key, normal_balance, is_system)
  VALUES
    (p_business_id, 'Cash and Cash Equivalents', 'asset', 'cash_and_cash_equivalents', 'debit', true),
    (p_business_id, 'Accounts Receivable', 'asset', 'accounts_receivable', 'debit', true),
    (p_business_id, 'Inventory Asset', 'asset', 'inventory_asset', 'debit', true),
    (p_business_id, 'Accounts Payable', 'liability', 'accounts_payable', 'credit', true),
    (p_business_id, 'Owner Equity', 'equity', 'owner_equity', 'credit', true),
    (p_business_id, 'Sales Revenue', 'revenue', 'sales_revenue', 'credit', true),
    (p_business_id, 'Cost of Goods Sold', 'expense', 'cost_of_goods_sold', 'debit', true),
    (p_business_id, 'Operating Expense', 'expense', 'operating_expense', 'debit', true)
  ON CONFLICT (business_id, system_key) DO NOTHING;
END;
$$;

-- Trigger to auto-provision accounts for new businesses
CREATE OR REPLACE FUNCTION public.trigger_provision_ledger_accounts()
RETURNS trigger AS $$
BEGIN
  PERFORM public.ensure_business_ledger_accounts(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_business_created_provision_accounts
AFTER INSERT ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.trigger_provision_ledger_accounts();

-- Backfill existing businesses
DO $$
DECLARE
  biz record;
BEGIN
  FOR biz IN SELECT id FROM public.businesses LOOP
    PERFORM public.ensure_business_ledger_accounts(biz.id);
  END LOOP;
END;
$$;

-- ==============================================================================
-- Financial Posting RPC
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.post_financial_entry(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_currency_code text;
  v_source_event_type text;
  v_source_event_id text;
  v_idempotency_key text;
  v_occurred_at timestamptz;
  v_effective_date date;
  v_description text;
  v_created_by_user_id uuid;
  v_lines jsonb;
  v_line jsonb;
  v_entry_id uuid;
  v_total_debit numeric := 0;
  v_total_credit numeric := 0;
  v_line_debit numeric;
  v_line_credit numeric;
  v_account_business_id uuid;
  v_line_order int := 0;
  v_existing_entry_id uuid;
BEGIN
  v_business_id := (payload->>'businessId')::uuid;
  v_currency_code := payload->>'currencyCode';
  v_source_event_type := payload->>'sourceEventType';
  v_source_event_id := payload->>'sourceEventId';
  v_idempotency_key := payload->>'idempotencyKey';
  v_occurred_at := (payload->>'occurredAt')::timestamptz;
  v_effective_date := (payload->>'effectiveDate')::date;
  v_description := payload->>'description';
  v_created_by_user_id := (payload->>'createdByUserId')::uuid;
  v_lines := payload->'lines';

  -- 1. Check Idempotency Key
  SELECT id INTO v_existing_entry_id
  FROM public.journal_entries
  WHERE business_id = v_business_id AND idempotency_key = v_idempotency_key;

  IF v_existing_entry_id IS NOT NULL THEN
    -- In a real production system, you might verify the payload matches.
    -- For now, return the existing entry ID.
    RETURN jsonb_build_object('id', v_existing_entry_id, 'status', 'idempotent_success');
  END IF;

  -- 2. Validate Lines
  IF jsonb_array_length(v_lines) < 2 THEN
    RAISE EXCEPTION 'A journal entry must have at least two lines.';
  END IF;

  FOR v_line IN SELECT * FROM jsonb_array_elements(v_lines)
  LOOP
    v_line_debit := (v_line->>'debitMinor')::numeric;
    v_line_credit := (v_line->>'creditMinor')::numeric;
    
    IF v_line_debit < 0 OR v_line_credit < 0 THEN
      RAISE EXCEPTION 'Negative amounts are not allowed.';
    END IF;

    IF (v_line_debit > 0 AND v_line_credit > 0) OR (v_line_debit = 0 AND v_line_credit = 0) THEN
      RAISE EXCEPTION 'Each line must have either a positive debit or a positive credit, not both or neither.';
    END IF;

    v_total_debit := v_total_debit + v_line_debit;
    v_total_credit := v_total_credit + v_line_credit;

    -- Verify account exists and belongs to the correct business
    SELECT business_id INTO v_account_business_id
    FROM public.ledger_accounts
    WHERE id = (v_line->>'ledgerAccountId')::uuid;

    IF v_account_business_id IS NULL THEN
      RAISE EXCEPTION 'Ledger account % does not exist.', v_line->>'ledgerAccountId';
    END IF;

    IF v_account_business_id != v_business_id THEN
      RAISE EXCEPTION 'Ledger account % does not belong to business %.', v_line->>'ledgerAccountId', v_business_id;
    END IF;
  END LOOP;

  -- 3. Check Balancing
  IF v_total_debit != v_total_credit THEN
    RAISE EXCEPTION 'Journal entry does not balance. Debits: %, Credits: %', v_total_debit, v_total_credit;
  END IF;

  IF v_total_debit <= 0 THEN
    RAISE EXCEPTION 'Journal entry must have a positive total amount.';
  END IF;

  -- 4. Insert Entry
  INSERT INTO public.journal_entries (
    business_id, currency_code, source_event_type, source_event_id, 
    idempotency_key, occurred_at, effective_date, description, created_by_user_id
  ) VALUES (
    v_business_id, v_currency_code, v_source_event_type, v_source_event_id,
    v_idempotency_key, v_occurred_at, v_effective_date, v_description, v_created_by_user_id
  ) RETURNING id INTO v_entry_id;

  -- 5. Insert Lines
  FOR v_line IN SELECT * FROM jsonb_array_elements(v_lines)
  LOOP
    INSERT INTO public.journal_lines (
      journal_entry_id, business_id, ledger_account_id, 
      debit_minor, credit_minor, memo, line_order
    ) VALUES (
      v_entry_id, v_business_id, (v_line->>'ledgerAccountId')::uuid,
      (v_line->>'debitMinor')::bigint, (v_line->>'creditMinor')::bigint, 
      v_line->>'memo', v_line_order
    );
    v_line_order := v_line_order + 1;
  END LOOP;

  RETURN jsonb_build_object('id', v_entry_id, 'status', 'success');
END;
$$;

-- ==============================================================================
-- Reversal RPC
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.reverse_financial_entry(
  p_original_entry_id uuid,
  p_idempotency_key text,
  p_reason text,
  p_created_by_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_original public.journal_entries%ROWTYPE;
  v_reversal_id uuid;
  v_existing_reversal_id uuid;
  v_line public.journal_lines%ROWTYPE;
BEGIN
  -- 1. Get Original
  SELECT * INTO v_original FROM public.journal_entries WHERE id = p_original_entry_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Original entry % not found.', p_original_entry_id;
  END IF;

  -- 2. Check if already reversed
  IF v_original.reversed_by_entry_id IS NOT NULL THEN
    RAISE EXCEPTION 'Entry % is already reversed by %.', p_original_entry_id, v_original.reversed_by_entry_id;
  END IF;

  -- 3. Check idempotency
  SELECT id INTO v_existing_reversal_id
  FROM public.journal_entries
  WHERE business_id = v_original.business_id AND idempotency_key = p_idempotency_key;

  IF v_existing_reversal_id IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_existing_reversal_id, 'status', 'idempotent_success');
  END IF;

  -- 4. Create Reversal Entry
  INSERT INTO public.journal_entries (
    business_id, currency_code, source_event_type, source_event_id,
    idempotency_key, occurred_at, effective_date, description, 
    created_by_user_id, reversal_of_entry_id
  ) VALUES (
    v_original.business_id, v_original.currency_code, v_original.source_event_type || '_reversal', v_original.source_event_id,
    p_idempotency_key, now(), CURRENT_DATE, p_reason,
    p_created_by_user_id, p_original_entry_id
  ) RETURNING id INTO v_reversal_id;

  -- 5. Mark original as reversed
  UPDATE public.journal_entries 
  SET reversed_by_entry_id = v_reversal_id 
  WHERE id = p_original_entry_id;

  -- 6. Insert Reverse Lines (Swap Debit and Credit)
  FOR v_line IN SELECT * FROM public.journal_lines WHERE journal_entry_id = p_original_entry_id
  LOOP
    INSERT INTO public.journal_lines (
      journal_entry_id, business_id, ledger_account_id,
      debit_minor, credit_minor, memo, line_order
    ) VALUES (
      v_reversal_id, v_line.business_id, v_line.ledger_account_id,
      v_line.credit_minor, v_line.debit_minor, 'Reversal of line ' || v_line.id, v_line.line_order
    );
  END LOOP;

  RETURN jsonb_build_object('id', v_reversal_id, 'status', 'success');
END;
$$;


-- ==============================================================================
-- Row Level Security (RLS)
-- ==============================================================================
ALTER TABLE public.ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;

-- Read policies for ledger accounts: Members of the business can read accounts
CREATE POLICY "Members can view ledger accounts for their business"
ON public.ledger_accounts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_memberships bm
    WHERE bm.business_id = public.ledger_accounts.business_id
    AND bm.user_id = auth.uid()
  )
);

-- Read policies for journal entries: Members can view
CREATE POLICY "Members can view journal entries for their business"
ON public.journal_entries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_memberships bm
    WHERE bm.business_id = public.journal_entries.business_id
    AND bm.user_id = auth.uid()
  )
);

-- Read policies for journal lines: Members can view
CREATE POLICY "Members can view journal lines for their business"
ON public.journal_lines
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_memberships bm
    WHERE bm.business_id = public.journal_lines.business_id
    AND bm.user_id = auth.uid()
  )
);

-- NO INSERT/UPDATE/DELETE policies are provided for journal tables.
-- Mutation is strictly via the SECURITY DEFINER RPC functions.
