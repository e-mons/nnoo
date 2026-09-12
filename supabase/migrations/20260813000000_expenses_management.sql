-- ==============================================================================
-- Migration: Expenses & Business Spending
-- Description: Operational foundation for recording ordinary business expenses.
-- ==============================================================================

-- 1. Expense Categories Table
CREATE TABLE public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  system_key text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, name)
);

-- Function to provision default categories
CREATE OR REPLACE FUNCTION public.provision_default_expense_categories(p_business_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.expense_categories (business_id, name, system_key)
  VALUES 
    (p_business_id, 'Rent', 'rent'),
    (p_business_id, 'Utilities', 'utilities'),
    (p_business_id, 'Transport', 'transport'),
    (p_business_id, 'Staff / Wages', 'staff_wages'),
    (p_business_id, 'Office Supplies', 'office_supplies'),
    (p_business_id, 'Repairs & Maintenance', 'repairs_maintenance'),
    (p_business_id, 'Internet & Communications', 'internet_comms'),
    (p_business_id, 'Marketing & Advertising', 'marketing_ads'),
    (p_business_id, 'Professional Fees', 'professional_fees'),
    (p_business_id, 'Bank / Service Charges', 'bank_charges'),
    (p_business_id, 'General Operating Expense', 'general_operating'),
    (p_business_id, 'Other Operating Expense', 'other_operating')
  ON CONFLICT (business_id, name) DO NOTHING;
END;
$$;

-- Trigger to automatically provision default categories on business creation
CREATE OR REPLACE FUNCTION public.trigger_provision_default_expense_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.provision_default_expense_categories(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_business_created_provision_expense_categories
  AFTER INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.trigger_provision_default_expense_categories();

-- Provision categories for existing businesses
DO $$
DECLARE
  v_biz record;
BEGIN
  FOR v_biz IN SELECT id FROM public.businesses
  LOOP
    PERFORM public.provision_default_expense_categories(v_biz.id);
  END LOOP;
END;
$$;

-- 2. Expenses Table
CREATE TYPE public.expense_status AS ENUM ('posted', 'reversed');

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  expense_number text NOT NULL,
  category_id uuid NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  currency_code text NOT NULL,
  total_minor bigint NOT NULL CHECK (total_minor > 0),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  effective_date date NOT NULL,
  due_date date,
  description text NOT NULL,
  external_reference text,
  notes text,
  receipt_path text,
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  status public.expense_status NOT NULL DEFAULT 'posted',
  created_by_user_id uuid REFERENCES auth.users(id),
  reversed_by_user_id uuid REFERENCES auth.users(id),
  reversal_reason text,
  reversed_at timestamptz,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, expense_number),
  UNIQUE (business_id, idempotency_key)
);

-- 3. Expense Payments Table
CREATE TABLE public.expense_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  expense_id uuid NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency_code text NOT NULL,
  payment_method public.payment_method NOT NULL,
  external_reference text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  effective_date date NOT NULL,
  paid_by_user_id uuid REFERENCES auth.users(id),
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, idempotency_key)
);

-- 4. Storage Bucket for Receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('expense-receipts', 'expense-receipts', false) ON CONFLICT DO NOTHING;

-- RLS for storage (Insert allowed by authenticated users, Select/Update/Delete allowed if user has business role)
CREATE POLICY "Allow business members to upload receipts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'expense-receipts' AND 
  (storage.foldername(name))[1] = 'businesses' AND 
  public.has_business_role((storage.foldername(name))[2]::uuid, ARRAY['owner', 'business_admin', 'manager', 'accountant'])
);

CREATE POLICY "Allow business members to view receipts" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'expense-receipts' AND 
  (storage.foldername(name))[1] = 'businesses' AND 
  public.has_business_role((storage.foldername(name))[2]::uuid, ARRAY['owner', 'business_admin', 'manager', 'accountant', 'read_only'])
);

CREATE POLICY "Allow business members to delete receipts" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'expense-receipts' AND 
  (storage.foldername(name))[1] = 'businesses' AND 
  public.has_business_role((storage.foldername(name))[2]::uuid, ARRAY['owner', 'business_admin', 'manager', 'accountant'])
);

-- 5. Indexes
CREATE INDEX idx_expense_categories_business ON public.expense_categories(business_id);
CREATE INDEX idx_expenses_business_category ON public.expenses(business_id, category_id);
CREATE INDEX idx_expenses_occurred_at ON public.expenses(business_id, occurred_at);
CREATE INDEX idx_expense_payments_expense_id ON public.expense_payments(expense_id);

-- 6. Row Level Security
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View expense_categories" ON public.expense_categories FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant', 'sales_staff', 'inventory_staff', 'read_only']));
CREATE POLICY "Manage expense_categories" ON public.expense_categories FOR INSERT WITH CHECK (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant']));
CREATE POLICY "Update expense_categories" ON public.expense_categories FOR UPDATE USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant']));

CREATE POLICY "View expenses" ON public.expenses FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant', 'read_only']));
CREATE POLICY "View expense_payments" ON public.expense_payments FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant', 'read_only']));

-- Note: Mutations to expenses are strictly handled via RPCs which bypass RLS via SECURITY DEFINER.

-- ==============================================================================
-- Operations (RPCs)
-- ==============================================================================

-- Helper: Update Expense Payment Status
CREATE OR REPLACE FUNCTION public.update_expense_status(p_expense_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_expense bigint;
  v_total_paid bigint;
  v_new_payment_status public.payment_status;
BEGIN
  -- 1. Get Expense Total
  SELECT total_minor INTO v_total_expense FROM public.expenses WHERE id = p_expense_id;
  
  -- 2. Get Payments
  SELECT COALESCE(SUM(amount_minor), 0) INTO v_total_paid FROM public.expense_payments WHERE expense_id = p_expense_id;

  -- Payment Status
  IF v_total_paid = 0 THEN
    v_new_payment_status := 'unpaid';
  ELSIF v_total_paid >= v_total_expense THEN
    v_new_payment_status := 'paid';
  ELSE
    v_new_payment_status := 'partially_paid';
  END IF;

  UPDATE public.expenses
  SET payment_status = v_new_payment_status,
      updated_at = now()
  WHERE id = p_expense_id;
END;
$$;


-- 1. Create Expense
CREATE OR REPLACE FUNCTION public.create_expense(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_user_id uuid;
  v_idempotency_key text;
  v_category_id uuid;
  v_supplier_id uuid;
  v_currency_code text;
  v_total_minor bigint;
  v_occurred_at timestamptz;
  v_effective_date date;
  v_due_date date;
  v_description text;
  v_external_reference text;
  v_notes text;
  v_receipt_path text;
  v_payments jsonb;

  v_expense_id uuid;
  v_existing_expense_id uuid;
  v_expense_number text;
  v_cat_record record;

  v_payment jsonb;
  v_total_paid_minor bigint := 0;

  v_journal_lines jsonb;
  v_journal_payload jsonb;
  v_journal_result jsonb;

  v_cash_acct uuid;
  v_ap_acct uuid;
  v_opex_acct uuid;
BEGIN
  v_business_id := (payload->>'businessId')::uuid;
  v_user_id := auth.uid();
  v_idempotency_key := payload->>'idempotencyKey';
  v_category_id := (payload->>'categoryId')::uuid;
  v_supplier_id := (payload->>'supplierId')::uuid;
  v_currency_code := payload->>'currencyCode';
  v_total_minor := (payload->>'totalMinor')::bigint;
  v_occurred_at := COALESCE((payload->>'occurredAt')::timestamptz, now());
  v_effective_date := (payload->>'effectiveDate')::date;
  v_due_date := (payload->>'dueDate')::date;
  v_description := payload->>'description';
  v_external_reference := payload->>'externalReference';
  v_notes := payload->>'notes';
  v_receipt_path := payload->>'receiptPath';
  v_payments := payload->'payments';

  -- Check Permissions
  IF NOT public.has_business_role(v_business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant']) THEN
    RAISE EXCEPTION 'Not authorized to create expenses.';
  END IF;

  -- Idempotency check
  SELECT id INTO v_existing_expense_id FROM public.expenses WHERE business_id = v_business_id AND idempotency_key = v_idempotency_key;
  IF v_existing_expense_id IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_existing_expense_id, 'status', 'idempotent_success');
  END IF;

  -- Validate Totals
  IF v_total_minor <= 0 THEN
    RAISE EXCEPTION 'Expense total must be greater than 0.';
  END IF;

  -- Validate Category
  SELECT * INTO v_cat_record FROM public.expense_categories WHERE id = v_category_id AND business_id = v_business_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Category not found.';
  END IF;
  IF v_cat_record.status != 'active' THEN
    RAISE EXCEPTION 'Category is not active.';
  END IF;

  -- Process Initial Payments to calculate total paid
  IF v_payments IS NOT NULL THEN
    FOR v_payment IN SELECT * FROM jsonb_array_elements(v_payments)
    LOOP
      v_total_paid_minor := v_total_paid_minor + (v_payment->>'amountMinor')::bigint;
    END LOOP;
  END IF;

  IF v_total_paid_minor > v_total_minor THEN
    RAISE EXCEPTION 'Initial payments (%,) cannot exceed expense total (%).', v_total_paid_minor, v_total_minor;
  END IF;

  IF v_total_paid_minor < v_total_minor AND v_supplier_id IS NULL THEN
    RAISE EXCEPTION 'A supplier must be specified for expenses with an outstanding balance.';
  END IF;

  -- Generate Expense Number
  v_expense_number := public.next_business_sequence(v_business_id, 'EXP-');

  -- Insert Expense
  INSERT INTO public.expenses (
    business_id, expense_number, category_id, supplier_id, currency_code, total_minor,
    occurred_at, effective_date, due_date, description, external_reference, notes, receipt_path,
    created_by_user_id, idempotency_key
  ) VALUES (
    v_business_id, v_expense_number, v_category_id, v_supplier_id, v_currency_code, v_total_minor,
    v_occurred_at, v_effective_date, v_due_date, v_description, v_external_reference, v_notes, v_receipt_path,
    v_user_id, v_idempotency_key
  ) RETURNING id INTO v_expense_id;

  -- Insert Payments
  IF v_payments IS NOT NULL THEN
    FOR v_payment IN SELECT * FROM jsonb_array_elements(v_payments)
    LOOP
      INSERT INTO public.expense_payments (
        business_id, expense_id, amount_minor, currency_code, payment_method, external_reference,
        occurred_at, effective_date, paid_by_user_id, idempotency_key
      ) VALUES (
        v_business_id, v_expense_id, (v_payment->>'amountMinor')::bigint, v_currency_code, 
        (v_payment->>'paymentMethod')::public.payment_method, v_payment->>'reference',
        v_occurred_at, v_effective_date, v_user_id, v_idempotency_key || '_pay_' || (v_payment->>'paymentMethod')
      );
    END LOOP;
  END IF;

  -- Update Status
  PERFORM public.update_expense_status(v_expense_id);

  -- Financial Journal Posting
  -- Lookup Accounts
  SELECT id INTO v_cash_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'cash_and_cash_equivalents';
  SELECT id INTO v_ap_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'accounts_payable';
  SELECT id INTO v_opex_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'operating_expense';

  IF v_cash_acct IS NULL OR v_ap_acct IS NULL OR v_opex_acct IS NULL THEN
    RAISE EXCEPTION 'System ledger accounts missing.';
  END IF;

  v_journal_lines := '[]'::jsonb;
  
  -- Debit Operating Expense
  v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_opex_acct, 'debitMinor', v_total_minor, 'creditMinor', 0, 'memo', 'Operating Expense');
  
  -- Credit Cash
  IF v_total_paid_minor > 0 THEN
    v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_cash_acct, 'debitMinor', 0, 'creditMinor', v_total_paid_minor, 'memo', 'Payment Made');
  END IF;

  -- Credit Accounts Payable
  IF v_total_minor - v_total_paid_minor > 0 THEN
    v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_ap_acct, 'debitMinor', 0, 'creditMinor', v_total_minor - v_total_paid_minor, 'memo', 'Outstanding Payable');
  END IF;

  v_journal_payload := jsonb_build_object(
    'businessId', v_business_id,
    'currencyCode', v_currency_code,
    'sourceEventType', 'expense',
    'sourceEventId', v_expense_id,
    'idempotencyKey', v_idempotency_key,
    'occurredAt', v_occurred_at,
    'effectiveDate', v_effective_date,
    'description', 'Expense ' || v_expense_number || ': ' || v_description,
    'createdByUserId', v_user_id,
    'lines', v_journal_lines
  );

  v_journal_result := public.post_financial_entry(v_journal_payload);

  RETURN jsonb_build_object('id', v_expense_id, 'status', 'success');
END;
$$;


-- 2. Record Expense Payment
CREATE OR REPLACE FUNCTION public.record_expense_payment(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_user_id uuid;
  v_expense_id uuid;
  v_idempotency_key text;
  v_amount_minor bigint;
  v_payment_method public.payment_method;
  v_reference text;
  v_occurred_at timestamptz;
  v_effective_date date;
  
  v_expense_record record;
  v_total_paid bigint;
  v_outstanding bigint;
  v_existing_payment_id uuid;
  v_payment_id uuid;

  v_journal_lines jsonb;
  v_journal_payload jsonb;
  v_cash_acct uuid;
  v_ap_acct uuid;
BEGIN
  v_business_id := (payload->>'businessId')::uuid;
  v_user_id := auth.uid();
  v_expense_id := (payload->>'expenseId')::uuid;
  v_idempotency_key := payload->>'idempotencyKey';
  v_amount_minor := (payload->>'amountMinor')::bigint;
  v_payment_method := (payload->>'paymentMethod')::public.payment_method;
  v_reference := payload->>'reference';
  v_occurred_at := COALESCE((payload->>'occurredAt')::timestamptz, now());
  v_effective_date := (payload->>'effectiveDate')::date;

  -- Check Permissions
  IF NOT public.has_business_role(v_business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant']) THEN
    RAISE EXCEPTION 'Not authorized to record expense payments.';
  END IF;

  -- Idempotency check
  SELECT id INTO v_existing_payment_id FROM public.expense_payments WHERE business_id = v_business_id AND idempotency_key = v_idempotency_key;
  IF v_existing_payment_id IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_existing_payment_id, 'status', 'idempotent_success');
  END IF;

  -- Get Expense
  SELECT * INTO v_expense_record FROM public.expenses WHERE id = v_expense_id AND business_id = v_business_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expense not found.';
  END IF;

  IF v_expense_record.status = 'reversed' THEN
    RAISE EXCEPTION 'Cannot record payment for a reversed expense.';
  END IF;

  -- Calculate Outstanding
  SELECT COALESCE(SUM(amount_minor), 0) INTO v_total_paid FROM public.expense_payments WHERE expense_id = v_expense_id;
  v_outstanding := v_expense_record.total_minor - v_total_paid;

  IF v_amount_minor > v_outstanding THEN
    RAISE EXCEPTION 'Payment amount (%) exceeds outstanding balance (%).', v_amount_minor, v_outstanding;
  END IF;

  -- Insert Payment
  INSERT INTO public.expense_payments (
    business_id, expense_id, amount_minor, currency_code, payment_method, external_reference,
    occurred_at, effective_date, paid_by_user_id, idempotency_key
  ) VALUES (
    v_business_id, v_expense_id, v_amount_minor, v_expense_record.currency_code, v_payment_method, v_reference,
    v_occurred_at, v_effective_date, v_user_id, v_idempotency_key
  ) RETURNING id INTO v_payment_id;

  -- Update Status
  PERFORM public.update_expense_status(v_expense_id);

  -- Financial Journal Posting
  SELECT id INTO v_cash_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'cash_and_cash_equivalents';
  SELECT id INTO v_ap_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'accounts_payable';

  IF v_cash_acct IS NULL OR v_ap_acct IS NULL THEN
    RAISE EXCEPTION 'System ledger accounts missing.';
  END IF;

  v_journal_lines := jsonb_build_array(
    jsonb_build_object('ledgerAccountId', v_ap_acct, 'debitMinor', v_amount_minor, 'creditMinor', 0, 'memo', 'Expense Payment'),
    jsonb_build_object('ledgerAccountId', v_cash_acct, 'debitMinor', 0, 'creditMinor', v_amount_minor, 'memo', 'Expense Payment')
  );

  v_journal_payload := jsonb_build_object(
    'businessId', v_business_id,
    'currencyCode', v_expense_record.currency_code,
    'sourceEventType', 'expense_payment',
    'sourceEventId', v_payment_id,
    'idempotencyKey', v_idempotency_key,
    'occurredAt', v_occurred_at,
    'effectiveDate', v_effective_date,
    'description', 'Payment for Expense ' || v_expense_record.expense_number,
    'createdByUserId', v_user_id,
    'lines', v_journal_lines
  );

  PERFORM public.post_financial_entry(v_journal_payload);

  RETURN jsonb_build_object('id', v_payment_id, 'status', 'success');
END;
$$;


-- 3. Reverse Expense
CREATE OR REPLACE FUNCTION public.reverse_expense(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_user_id uuid;
  v_expense_id uuid;
  v_idempotency_key text;
  v_reason text;
  v_expense_record record;
  v_payment_record record;
  v_original_expense_entry_id uuid;
  v_original_payment_entry_id uuid;
  v_reversal_payload jsonb;
BEGIN
  v_business_id := (payload->>'businessId')::uuid;
  v_user_id := auth.uid();
  v_expense_id := (payload->>'expenseId')::uuid;
  v_idempotency_key := payload->>'idempotencyKey';
  v_reason := payload->>'reason';

  -- Check Permissions (Owner, Admin, Manager, Accountant)
  IF NOT public.has_business_role(v_business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant']) THEN
    RAISE EXCEPTION 'Not authorized to reverse expenses.';
  END IF;

  -- Get Expense
  SELECT * INTO v_expense_record FROM public.expenses WHERE id = v_expense_id AND business_id = v_business_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expense not found.';
  END IF;

  IF v_expense_record.status = 'reversed' THEN
    RETURN jsonb_build_object('id', v_expense_id, 'status', 'idempotent_success');
  END IF;

  IF v_reason IS NULL OR length(v_reason) < 3 THEN
    RAISE EXCEPTION 'A valid reversal reason is required.';
  END IF;

  -- Mark Expense as Reversed
  UPDATE public.expenses
  SET status = 'reversed',
      reversed_by_user_id = v_user_id,
      reversed_at = now(),
      reversal_reason = v_reason,
      updated_at = now()
  WHERE id = v_expense_id;

  -- Reverse Original Expense Journal Entry
  SELECT id INTO v_original_expense_entry_id FROM public.journal_entries 
  WHERE business_id = v_business_id AND source_event_type = 'expense' AND source_event_id = v_expense_id::text 
  AND reversed_by_entry_id IS NULL;

  IF v_original_expense_entry_id IS NOT NULL THEN
    v_reversal_payload := jsonb_build_object(
      'businessId', v_business_id,
      'originalEntryId', v_original_expense_entry_id,
      'reversalIdempotencyKey', v_idempotency_key || '_rev_exp',
      'occurredAt', now(),
      'effectiveDate', CURRENT_DATE,
      'description', 'Reversal of Expense ' || v_expense_record.expense_number,
      'createdByUserId', v_user_id
    );
    PERFORM public.reverse_financial_entry(v_reversal_payload);
  END IF;

  -- Reverse All Payments Journal Entries
  FOR v_payment_record IN SELECT * FROM public.expense_payments WHERE expense_id = v_expense_id
  LOOP
    SELECT id INTO v_original_payment_entry_id FROM public.journal_entries 
    WHERE business_id = v_business_id AND source_event_type = 'expense_payment' AND source_event_id = v_payment_record.id::text
    AND reversed_by_entry_id IS NULL;

    IF v_original_payment_entry_id IS NOT NULL THEN
      v_reversal_payload := jsonb_build_object(
        'businessId', v_business_id,
        'originalEntryId', v_original_payment_entry_id,
        'reversalIdempotencyKey', v_idempotency_key || '_rev_pay_' || v_payment_record.id,
        'occurredAt', now(),
        'effectiveDate', CURRENT_DATE,
        'description', 'Reversal of Expense Payment for ' || v_expense_record.expense_number,
        'createdByUserId', v_user_id
      );
      PERFORM public.reverse_financial_entry(v_reversal_payload);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('id', v_expense_id, 'status', 'success');
END;
$$;
