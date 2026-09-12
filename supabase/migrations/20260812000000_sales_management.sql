-- ==============================================================================
-- Migration: Sales, Payments Received & Refunds
-- Description: Operational foundation for revenue generating events.
-- ==============================================================================

-- 1. Business Sequences (for Sale / Refund numbers)
CREATE TABLE public.business_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  prefix text NOT NULL,
  last_value bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, prefix)
);

CREATE OR REPLACE FUNCTION public.next_business_sequence(p_business_id uuid, p_prefix text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_val bigint;
BEGIN
  INSERT INTO public.business_sequences (business_id, prefix, last_value)
  VALUES (p_business_id, p_prefix, 1)
  ON CONFLICT (business_id, prefix) DO UPDATE
  SET last_value = public.business_sequences.last_value + 1,
      updated_at = now()
  RETURNING last_value INTO v_next_val;
  
  RETURN p_prefix || lpad(v_next_val::text, 6, '0');
END;
$$;

-- 2. Sales Table
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'partially_paid', 'paid');
CREATE TYPE public.refund_status AS ENUM ('none', 'partially_refunded', 'refunded');

CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sale_number text NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE RESTRICT,
  currency_code text NOT NULL,
  subtotal_minor bigint NOT NULL CHECK (subtotal_minor >= 0),
  discount_total_minor bigint NOT NULL DEFAULT 0 CHECK (discount_total_minor >= 0 AND discount_total_minor <= subtotal_minor),
  total_minor bigint NOT NULL CHECK (total_minor >= 0),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  effective_date date NOT NULL,
  notes text,
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  refund_status public.refund_status NOT NULL DEFAULT 'none',
  created_by_user_id uuid REFERENCES auth.users(id),
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, sale_number),
  UNIQUE (business_id, idempotency_key)
);

-- 3. Sale Items Table
CREATE TABLE public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  catalog_item_id uuid REFERENCES public.catalog_items(id) ON DELETE RESTRICT,
  item_type_snapshot text NOT NULL,
  item_name_snapshot text NOT NULL,
  sku_snapshot text,
  unit_code_snapshot text NOT NULL,
  track_inventory_snapshot boolean NOT NULL,
  quantity numeric(14,6) NOT NULL CHECK (quantity > 0),
  unit_price_minor bigint NOT NULL CHECK (unit_price_minor >= 0),
  discount_minor bigint NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
  line_total_minor bigint NOT NULL CHECK (line_total_minor >= 0),
  line_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Sale Payments Table
CREATE TYPE public.payment_method AS ENUM ('cash', 'bank_transfer', 'pos', 'other');

CREATE TABLE public.sale_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency_code text NOT NULL,
  payment_method public.payment_method NOT NULL,
  reference text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  effective_date date NOT NULL,
  received_by_user_id uuid REFERENCES auth.users(id),
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, idempotency_key)
);

-- 5. Sale Refunds Table
CREATE TYPE public.refund_reason AS ENUM ('customer_return', 'wrong_item', 'damaged', 'correction', 'other');

CREATE TABLE public.sale_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  refund_number text NOT NULL,
  total_minor bigint NOT NULL CHECK (total_minor > 0),
  receivable_reduction_minor bigint NOT NULL DEFAULT 0 CHECK (receivable_reduction_minor >= 0),
  cash_refund_minor bigint NOT NULL DEFAULT 0 CHECK (cash_refund_minor >= 0),
  cash_refund_method public.payment_method,
  cash_refund_reference text,
  reason public.refund_reason NOT NULL,
  notes text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  effective_date date NOT NULL,
  created_by_user_id uuid REFERENCES auth.users(id),
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, refund_number),
  UNIQUE (business_id, idempotency_key),
  CONSTRAINT valid_refund_totals CHECK (total_minor = receivable_reduction_minor + cash_refund_minor)
);

-- 6. Sale Refund Items Table
CREATE TABLE public.sale_refund_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  refund_id uuid NOT NULL REFERENCES public.sale_refunds(id) ON DELETE CASCADE,
  sale_item_id uuid NOT NULL REFERENCES public.sale_items(id) ON DELETE CASCADE,
  quantity numeric(14,6) NOT NULL CHECK (quantity > 0),
  refund_amount_minor bigint NOT NULL CHECK (refund_amount_minor >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Indexes
CREATE INDEX idx_sales_business_customer ON public.sales(business_id, customer_id);
CREATE INDEX idx_sales_occurred_at ON public.sales(business_id, occurred_at);
CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX idx_sale_payments_sale_id ON public.sale_payments(sale_id);
CREATE INDEX idx_sale_refunds_sale_id ON public.sale_refunds(sale_id);
CREATE INDEX idx_sale_refund_items_refund_id ON public.sale_refund_items(refund_id);

-- 8. Row Level Security
ALTER TABLE public.business_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_refund_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View business_sequences" ON public.business_sequences FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff', 'accountant']));
CREATE POLICY "View sales" ON public.sales FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff', 'accountant', 'inventory_staff']));
CREATE POLICY "View sale_items" ON public.sale_items FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff', 'accountant', 'inventory_staff']));
CREATE POLICY "View sale_payments" ON public.sale_payments FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff', 'accountant']));
CREATE POLICY "View sale_refunds" ON public.sale_refunds FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff', 'accountant', 'inventory_staff']));
CREATE POLICY "View sale_refund_items" ON public.sale_refund_items FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff', 'accountant', 'inventory_staff']));

-- Note: Mutations to these tables are strictly handled via RPCs which bypass RLS via SECURITY DEFINER. 
-- Direct INSERT/UPDATE/DELETE are not permitted from clients.

-- ==============================================================================
-- Operations (RPCs)
-- ==============================================================================

-- Helper: Update Sale Payment Status
CREATE OR REPLACE FUNCTION public.update_sale_statuses(p_sale_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_sale bigint;
  v_total_paid bigint;
  v_total_refunded bigint;
  v_total_cash_refunded bigint;
  v_total_ar_reduced bigint;
  v_net_sale bigint;
  v_net_paid bigint;
  v_new_payment_status public.payment_status;
  v_new_refund_status public.refund_status;
BEGIN
  -- 1. Get Sale Total
  SELECT total_minor INTO v_total_sale FROM public.sales WHERE id = p_sale_id;
  
  -- 2. Get Payments
  SELECT COALESCE(SUM(amount_minor), 0) INTO v_total_paid FROM public.sale_payments WHERE sale_id = p_sale_id;

  -- 3. Get Refunds
  SELECT COALESCE(SUM(total_minor), 0), COALESCE(SUM(cash_refund_minor), 0), COALESCE(SUM(receivable_reduction_minor), 0)
  INTO v_total_refunded, v_total_cash_refunded, v_total_ar_reduced
  FROM public.sale_refunds WHERE sale_id = p_sale_id;

  v_net_sale := v_total_sale - v_total_refunded;
  v_net_paid := v_total_paid - v_total_cash_refunded;

  -- Refund Status
  IF v_total_refunded = 0 THEN
    v_new_refund_status := 'none';
  ELSIF v_total_refunded >= v_total_sale THEN
    v_new_refund_status := 'refunded';
  ELSE
    v_new_refund_status := 'partially_refunded';
  END IF;

  -- Payment Status
  IF v_net_paid = 0 THEN
    v_new_payment_status := 'unpaid';
  ELSIF v_net_paid >= v_net_sale THEN
    v_new_payment_status := 'paid';
  ELSE
    v_new_payment_status := 'partially_paid';
  END IF;

  -- Update Sale
  UPDATE public.sales
  SET payment_status = v_new_payment_status,
      refund_status = v_new_refund_status,
      updated_at = now()
  WHERE id = p_sale_id;
END;
$$;


-- 1. Create Sale
CREATE OR REPLACE FUNCTION public.create_sale(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_user_id uuid;
  v_customer_id uuid;
  v_idempotency_key text;
  v_currency_code text;
  v_occurred_at timestamptz;
  v_effective_date date;
  v_notes text;
  v_items jsonb;
  v_payments jsonb;
  
  v_item jsonb;
  v_payment jsonb;
  v_sale_id uuid;
  v_sale_number text;
  
  v_subtotal_minor bigint := 0;
  v_discount_total_minor bigint := 0;
  v_total_minor bigint := 0;
  v_total_paid_minor bigint := 0;
  
  v_catalog_item_id uuid;
  v_line_quantity numeric(14,6);
  v_line_unit_price bigint;
  v_line_discount bigint;
  v_line_gross bigint;
  v_line_total bigint;
  v_cat_record record;
  v_line_order int := 0;
  
  v_existing_sale_id uuid;
  v_journal_lines jsonb;
  v_journal_payload jsonb;
  v_journal_result jsonb;
  
  v_cash_acct uuid;
  v_ar_acct uuid;
  v_revenue_acct uuid;
BEGIN
  -- Extract
  v_business_id := (payload->>'businessId')::uuid;
  v_user_id := auth.uid();
  v_customer_id := (payload->>'customerId')::uuid;
  v_idempotency_key := payload->>'idempotencyKey';
  v_currency_code := payload->>'currencyCode';
  v_occurred_at := COALESCE((payload->>'occurredAt')::timestamptz, now());
  v_effective_date := (payload->>'effectiveDate')::date;
  v_notes := payload->>'notes';
  v_items := payload->'items';
  v_payments := payload->'payments';

  -- Check Permissions
  IF NOT public.has_business_role(v_business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff']) THEN
    RAISE EXCEPTION 'Not authorized to create sales.';
  END IF;

  -- Idempotency check
  SELECT id INTO v_existing_sale_id FROM public.sales WHERE business_id = v_business_id AND idempotency_key = v_idempotency_key;
  IF v_existing_sale_id IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_existing_sale_id, 'status', 'idempotent_success');
  END IF;

  -- Validate Items
  IF jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'Sale must have at least one item.';
  END IF;

  -- Generate Sale Number
  v_sale_number := public.next_business_sequence(v_business_id, 'SAL-');

  -- Insert Sale Header (totals will be updated after line calculation)
  INSERT INTO public.sales (
    business_id, sale_number, customer_id, currency_code, subtotal_minor, discount_total_minor, total_minor,
    occurred_at, effective_date, notes, created_by_user_id, idempotency_key
  ) VALUES (
    v_business_id, v_sale_number, v_customer_id, v_currency_code, 0, 0, 0,
    v_occurred_at, v_effective_date, v_notes, v_user_id, v_idempotency_key
  ) RETURNING id INTO v_sale_id;

  -- Process Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    v_catalog_item_id := (v_item->>'catalogItemId')::uuid;
    v_line_quantity := (v_item->>'quantity')::numeric(14,6);
    v_line_discount := (v_item->>'discountMinor')::bigint;

    IF v_line_quantity <= 0 THEN
      RAISE EXCEPTION 'Item quantity must be greater than 0.';
    END IF;

    -- Lookup Catalog Item
    SELECT * INTO v_cat_record FROM public.catalog_items WHERE id = v_catalog_item_id AND business_id = v_business_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Catalog item % not found.', v_catalog_item_id;
    END IF;
    IF v_cat_record.status != 'active' THEN
      RAISE EXCEPTION 'Catalog item % is not active.', v_catalog_item_id;
    END IF;
    IF v_cat_record.currency_code != v_currency_code THEN
      RAISE EXCEPTION 'Currency mismatch on item %.', v_catalog_item_id;
    END IF;

    v_line_unit_price := v_cat_record.selling_price_minor;
    
    -- Rounding Policy: Half-up to minor unit
    v_line_gross := round(v_line_unit_price * v_line_quantity);
    
    IF v_line_discount > v_line_gross THEN
      RAISE EXCEPTION 'Discount cannot exceed line gross amount.';
    END IF;

    v_line_total := v_line_gross - v_line_discount;

    v_subtotal_minor := v_subtotal_minor + v_line_gross;
    v_discount_total_minor := v_discount_total_minor + v_line_discount;
    v_total_minor := v_total_minor + v_line_total;

    INSERT INTO public.sale_items (
      business_id, sale_id, catalog_item_id, item_type_snapshot, item_name_snapshot, sku_snapshot,
      unit_code_snapshot, track_inventory_snapshot, quantity, unit_price_minor, discount_minor, line_total_minor, line_order
    ) VALUES (
      v_business_id, v_sale_id, v_catalog_item_id, v_cat_record.item_type, v_cat_record.name, v_cat_record.sku,
      v_cat_record.unit_code, v_cat_record.track_inventory, v_line_quantity, v_line_unit_price, v_line_discount, v_line_total, v_line_order
    );
    v_line_order := v_line_order + 1;
  END LOOP;

  -- Process Initial Payments
  IF v_payments IS NOT NULL THEN
    FOR v_payment IN SELECT * FROM jsonb_array_elements(v_payments)
    LOOP
      v_total_paid_minor := v_total_paid_minor + (v_payment->>'amountMinor')::bigint;
      
      INSERT INTO public.sale_payments (
        business_id, sale_id, amount_minor, currency_code, payment_method, reference,
        occurred_at, effective_date, received_by_user_id, idempotency_key
      ) VALUES (
        v_business_id, v_sale_id, (v_payment->>'amountMinor')::bigint, v_currency_code, 
        (v_payment->>'paymentMethod')::public.payment_method, v_payment->>'reference',
        v_occurred_at, v_effective_date, v_user_id, v_idempotency_key || '_pay_' || (v_payment->>'paymentMethod')
      );
    END LOOP;
  END IF;

  IF v_total_paid_minor > v_total_minor THEN
    RAISE EXCEPTION 'Initial payments (%,) cannot exceed sale total (%).', v_total_paid_minor, v_total_minor;
  END IF;

  IF v_total_paid_minor < v_total_minor AND v_customer_id IS NULL THEN
    RAISE EXCEPTION 'A customer must be specified for sales with an outstanding balance.';
  END IF;

  -- Update Sale Totals
  UPDATE public.sales
  SET subtotal_minor = v_subtotal_minor,
      discount_total_minor = v_discount_total_minor,
      total_minor = v_total_minor
  WHERE id = v_sale_id;

  -- Determine statuses
  PERFORM public.update_sale_statuses(v_sale_id);

  -- Financial Journal Posting
  -- Lookup Accounts
  SELECT id INTO v_cash_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'cash_and_cash_equivalents';
  SELECT id INTO v_ar_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'accounts_receivable';
  SELECT id INTO v_revenue_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'sales_revenue';

  IF v_cash_acct IS NULL OR v_ar_acct IS NULL OR v_revenue_acct IS NULL THEN
    RAISE EXCEPTION 'System ledger accounts missing.';
  END IF;

  v_journal_lines := '[]'::jsonb;
  -- Credit Revenue
  v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_revenue_acct, 'debitMinor', 0, 'creditMinor', v_total_minor, 'memo', 'Sale Revenue');
  
  -- Debit Cash
  IF v_total_paid_minor > 0 THEN
    v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_cash_acct, 'debitMinor', v_total_paid_minor, 'creditMinor', 0, 'memo', 'Payment Received');
  END IF;

  -- Debit Accounts Receivable
  IF v_total_minor - v_total_paid_minor > 0 THEN
    v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_ar_acct, 'debitMinor', v_total_minor - v_total_paid_minor, 'creditMinor', 0, 'memo', 'Outstanding Balance');
  END IF;

  v_journal_payload := jsonb_build_object(
    'businessId', v_business_id,
    'currencyCode', v_currency_code,
    'sourceEventType', 'sale',
    'sourceEventId', v_sale_id,
    'idempotencyKey', v_idempotency_key,
    'occurredAt', v_occurred_at,
    'effectiveDate', v_effective_date,
    'description', 'Sale ' || v_sale_number,
    'createdByUserId', v_user_id,
    'lines', v_journal_lines
  );

  v_journal_result := public.post_financial_entry(v_journal_payload);

  RETURN jsonb_build_object('id', v_sale_id, 'status', 'success');
END;
$$;


-- 2. Record Payment
CREATE OR REPLACE FUNCTION public.record_sale_payment(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_user_id uuid;
  v_sale_id uuid;
  v_idempotency_key text;
  v_amount_minor bigint;
  v_payment_method public.payment_method;
  v_reference text;
  v_occurred_at timestamptz;
  v_effective_date date;
  
  v_sale_record record;
  v_total_paid bigint;
  v_total_cash_refunded bigint;
  v_total_refunded bigint;
  v_net_sale bigint;
  v_net_paid bigint;
  v_outstanding bigint;
  v_existing_payment_id uuid;
  v_payment_id uuid;

  v_journal_lines jsonb;
  v_journal_payload jsonb;
  v_cash_acct uuid;
  v_ar_acct uuid;
BEGIN
  v_business_id := (payload->>'businessId')::uuid;
  v_user_id := auth.uid();
  v_sale_id := (payload->>'saleId')::uuid;
  v_idempotency_key := payload->>'idempotencyKey';
  v_amount_minor := (payload->>'amountMinor')::bigint;
  v_payment_method := (payload->>'paymentMethod')::public.payment_method;
  v_reference := payload->>'reference';
  v_occurred_at := COALESCE((payload->>'occurredAt')::timestamptz, now());
  v_effective_date := (payload->>'effectiveDate')::date;

  IF NOT public.has_business_role(v_business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff', 'accountant']) THEN
    RAISE EXCEPTION 'Not authorized to record payments.';
  END IF;

  SELECT id INTO v_existing_payment_id FROM public.sale_payments WHERE business_id = v_business_id AND idempotency_key = v_idempotency_key;
  IF v_existing_payment_id IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_existing_payment_id, 'status', 'idempotent_success');
  END IF;

  SELECT * INTO v_sale_record FROM public.sales WHERE id = v_sale_id AND business_id = v_business_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sale not found'; END IF;

  SELECT COALESCE(SUM(amount_minor), 0) INTO v_total_paid FROM public.sale_payments WHERE sale_id = v_sale_id;
  SELECT COALESCE(SUM(total_minor), 0), COALESCE(SUM(cash_refund_minor), 0)
  INTO v_total_refunded, v_total_cash_refunded
  FROM public.sale_refunds WHERE sale_id = v_sale_id;

  v_net_sale := v_sale_record.total_minor - v_total_refunded;
  v_net_paid := v_total_paid - v_total_cash_refunded;
  v_outstanding := v_net_sale - v_net_paid;

  IF v_amount_minor <= 0 THEN RAISE EXCEPTION 'Payment must be greater than 0.'; END IF;
  IF v_amount_minor > v_outstanding THEN RAISE EXCEPTION 'Payment (%) exceeds outstanding balance (%).', v_amount_minor, v_outstanding; END IF;

  INSERT INTO public.sale_payments (
    business_id, sale_id, amount_minor, currency_code, payment_method, reference,
    occurred_at, effective_date, received_by_user_id, idempotency_key
  ) VALUES (
    v_business_id, v_sale_id, v_amount_minor, v_sale_record.currency_code, v_payment_method, v_reference,
    v_occurred_at, v_effective_date, v_user_id, v_idempotency_key
  ) RETURNING id INTO v_payment_id;

  PERFORM public.update_sale_statuses(v_sale_id);

  SELECT id INTO v_cash_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'cash_and_cash_equivalents';
  SELECT id INTO v_ar_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'accounts_receivable';

  v_journal_lines := jsonb_build_array(
    jsonb_build_object('ledgerAccountId', v_cash_acct, 'debitMinor', v_amount_minor, 'creditMinor', 0, 'memo', 'Payment against Sale ' || v_sale_record.sale_number),
    jsonb_build_object('ledgerAccountId', v_ar_acct, 'debitMinor', 0, 'creditMinor', v_amount_minor, 'memo', 'Payment Received')
  );

  v_journal_payload := jsonb_build_object(
    'businessId', v_business_id,
    'currencyCode', v_sale_record.currency_code,
    'sourceEventType', 'sale_payment',
    'sourceEventId', v_payment_id,
    'idempotencyKey', v_idempotency_key,
    'occurredAt', v_occurred_at,
    'effectiveDate', v_effective_date,
    'description', 'Payment for Sale ' || v_sale_record.sale_number,
    'createdByUserId', v_user_id,
    'lines', v_journal_lines
  );

  PERFORM public.post_financial_entry(v_journal_payload);

  RETURN jsonb_build_object('id', v_payment_id, 'status', 'success');
END;
$$;


-- 3. Create Refund
CREATE OR REPLACE FUNCTION public.create_sale_refund(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_user_id uuid;
  v_sale_id uuid;
  v_idempotency_key text;
  v_cash_refund_method public.payment_method;
  v_cash_refund_reference text;
  v_reason public.refund_reason;
  v_notes text;
  v_occurred_at timestamptz;
  v_effective_date date;
  v_items jsonb;
  v_item jsonb;

  v_sale_record record;
  v_refund_id uuid;
  v_refund_number text;
  v_existing_refund_id uuid;

  v_total_paid bigint;
  v_total_cash_refunded bigint;
  v_total_refunded bigint;
  v_net_sale bigint;
  v_net_paid bigint;
  v_outstanding bigint;

  v_refund_total bigint := 0;
  v_receivable_reduction bigint := 0;
  v_cash_refund bigint := 0;

  v_sale_item_id uuid;
  v_qty numeric(14,6);
  v_si record;
  v_previously_refunded_qty numeric(14,6);
  v_max_refundable_qty numeric(14,6);
  v_previously_refunded_amt bigint;
  v_max_refundable_amt bigint;
  v_line_refund_amt bigint;

  v_journal_lines jsonb;
  v_journal_payload jsonb;
  v_cash_acct uuid;
  v_ar_acct uuid;
  v_revenue_acct uuid;
BEGIN
  v_business_id := (payload->>'businessId')::uuid;
  v_user_id := auth.uid();
  v_sale_id := (payload->>'saleId')::uuid;
  v_idempotency_key := payload->>'idempotencyKey';
  v_cash_refund_method := (payload->>'cashRefundMethod')::public.payment_method;
  v_cash_refund_reference := payload->>'cashRefundReference';
  v_reason := (payload->>'reason')::public.refund_reason;
  v_notes := payload->>'notes';
  v_occurred_at := COALESCE((payload->>'occurredAt')::timestamptz, now());
  v_effective_date := (payload->>'effectiveDate')::date;
  v_items := payload->'items';

  IF NOT public.has_business_role(v_business_id, ARRAY['owner', 'business_admin', 'manager']) THEN
    RAISE EXCEPTION 'Not authorized to perform refunds.';
  END IF;

  SELECT id INTO v_existing_refund_id FROM public.sale_refunds WHERE business_id = v_business_id AND idempotency_key = v_idempotency_key;
  IF v_existing_refund_id IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_existing_refund_id, 'status', 'idempotent_success');
  END IF;

  SELECT * INTO v_sale_record FROM public.sales WHERE id = v_sale_id AND business_id = v_business_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sale not found'; END IF;

  v_refund_number := public.next_business_sequence(v_business_id, 'REF-');

  INSERT INTO public.sale_refunds (
    business_id, sale_id, refund_number, total_minor, receivable_reduction_minor, cash_refund_minor,
    cash_refund_method, cash_refund_reference, reason, notes, occurred_at, effective_date, created_by_user_id, idempotency_key
  ) VALUES (
    v_business_id, v_sale_id, v_refund_number, 1, 0, 0,
    v_cash_refund_method, v_cash_refund_reference, v_reason, v_notes, v_occurred_at, v_effective_date, v_user_id, v_idempotency_key
  ) RETURNING id INTO v_refund_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    v_sale_item_id := (v_item->>'saleItemId')::uuid;
    v_qty := (v_item->>'quantity')::numeric(14,6);

    IF v_qty <= 0 THEN RAISE EXCEPTION 'Refund quantity must be positive.'; END IF;

    SELECT * INTO v_si FROM public.sale_items WHERE id = v_sale_item_id AND sale_id = v_sale_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Sale Item % not found.', v_sale_item_id; END IF;

    SELECT COALESCE(SUM(quantity), 0), COALESCE(SUM(refund_amount_minor), 0)
    INTO v_previously_refunded_qty, v_previously_refunded_amt
    FROM public.sale_refund_items
    WHERE sale_item_id = v_sale_item_id AND business_id = v_business_id;

    v_max_refundable_qty := v_si.quantity - v_previously_refunded_qty;
    v_max_refundable_amt := v_si.line_total_minor - v_previously_refunded_amt;

    IF v_qty > v_max_refundable_qty THEN
      RAISE EXCEPTION 'Cannot refund % units of %. Only % units are refundable.', v_qty, v_si.item_name_snapshot, v_max_refundable_qty;
    END IF;

    -- If refunding the EXACT remaining quantity, allocate EXACT remaining amount to avoid fractional remainders
    IF v_qty = v_max_refundable_qty THEN
      v_line_refund_amt := v_max_refundable_amt;
    ELSE
      -- Prorate exactly using half-up
      v_line_refund_amt := round((v_si.line_total_minor::numeric * v_qty) / v_si.quantity);
      -- Safety check against over-refunding due to weird rounding
      IF v_line_refund_amt > v_max_refundable_amt THEN
        v_line_refund_amt := v_max_refundable_amt;
      END IF;
    END IF;

    v_refund_total := v_refund_total + v_line_refund_amt;

    INSERT INTO public.sale_refund_items (
      business_id, refund_id, sale_item_id, quantity, refund_amount_minor
    ) VALUES (
      v_business_id, v_refund_id, v_sale_item_id, v_qty, v_line_refund_amt
    );
  END LOOP;

  IF v_refund_total <= 0 THEN
    RAISE EXCEPTION 'Refund total must be positive.';
  END IF;

  -- Settlement Rule: Reduce AR first, then cash
  SELECT COALESCE(SUM(amount_minor), 0) INTO v_total_paid FROM public.sale_payments WHERE sale_id = v_sale_id;
  SELECT COALESCE(SUM(total_minor), 0), COALESCE(SUM(cash_refund_minor), 0)
  INTO v_total_refunded, v_total_cash_refunded
  FROM public.sale_refunds WHERE sale_id = v_sale_id AND id != v_refund_id;

  v_net_sale := v_sale_record.total_minor - v_total_refunded;
  v_net_paid := v_total_paid - v_total_cash_refunded;
  v_outstanding := v_net_sale - v_net_paid;

  -- Protect against refunding more than the total sale value overall
  IF v_refund_total > v_net_sale THEN
    RAISE EXCEPTION 'Cannot refund more than the net sale amount.';
  END IF;

  IF v_refund_total <= v_outstanding THEN
    v_receivable_reduction := v_refund_total;
    v_cash_refund := 0;
  ELSE
    v_receivable_reduction := v_outstanding;
    v_cash_refund := v_refund_total - v_outstanding;
  END IF;

  -- Protect cash refund rule: cannot refund more cash than net paid
  IF v_cash_refund > v_net_paid THEN
    RAISE EXCEPTION 'Cannot refund % in cash because only % is available net paid.', v_cash_refund, v_net_paid;
  END IF;

  IF v_cash_refund > 0 AND v_cash_refund_method IS NULL THEN
    RAISE EXCEPTION 'A cash refund method is required when cash is being returned.';
  END IF;

  UPDATE public.sale_refunds
  SET total_minor = v_refund_total,
      receivable_reduction_minor = v_receivable_reduction,
      cash_refund_minor = v_cash_refund
  WHERE id = v_refund_id;

  PERFORM public.update_sale_statuses(v_sale_id);

  -- Journal
  SELECT id INTO v_cash_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'cash_and_cash_equivalents';
  SELECT id INTO v_ar_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'accounts_receivable';
  SELECT id INTO v_revenue_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'sales_revenue';

  v_journal_lines := '[]'::jsonb;
  -- Debit Revenue
  v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_revenue_acct, 'debitMinor', v_refund_total, 'creditMinor', 0, 'memo', 'Refund ' || v_refund_number);

  -- Credit AR
  IF v_receivable_reduction > 0 THEN
    v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_ar_acct, 'debitMinor', 0, 'creditMinor', v_receivable_reduction, 'memo', 'Receivable Reduction');
  END IF;

  -- Credit Cash
  IF v_cash_refund > 0 THEN
    v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_cash_acct, 'debitMinor', 0, 'creditMinor', v_cash_refund, 'memo', 'Cash Refund');
  END IF;

  v_journal_payload := jsonb_build_object(
    'businessId', v_business_id,
    'currencyCode', v_sale_record.currency_code,
    'sourceEventType', 'sale_refund',
    'sourceEventId', v_refund_id,
    'idempotencyKey', v_idempotency_key,
    'occurredAt', v_occurred_at,
    'effectiveDate', v_effective_date,
    'description', 'Refund for Sale ' || v_sale_record.sale_number,
    'createdByUserId', v_user_id,
    'lines', v_journal_lines
  );

  PERFORM public.post_financial_entry(v_journal_payload);

  RETURN jsonb_build_object('id', v_refund_id, 'status', 'success');
END;
$$;
