-- ==============================================================================
-- Migration: Inventory & Stock Movement
-- Description: Creates the canonical inventory ledger, receipt processing,
--              and integrates with sales and refunds.
-- ==============================================================================

-- 1. Ledger Accounts Update
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
    (p_business_id, 'Operating Expense', 'expense', 'operating_expense', 'debit', true),
    (p_business_id, 'Inventory Adjustment Gain', 'revenue', 'inventory_adjustment_gain', 'credit', true),
    (p_business_id, 'Inventory Shrinkage Loss', 'expense', 'inventory_shrinkage_loss', 'debit', true)
  ON CONFLICT (business_id, system_key) DO NOTHING;
END;
$$;

-- Backfill existing businesses for the new accounts
DO $$
DECLARE
  biz record;
BEGIN
  FOR biz IN SELECT id FROM public.businesses LOOP
    PERFORM public.ensure_business_ledger_accounts(biz.id);
  END LOOP;
END;
$$;


-- 2. Types
CREATE TYPE public.inventory_position_status AS ENUM ('pending_initialization', 'initialized');
CREATE TYPE public.inventory_movement_type AS ENUM ('opening_stock', 'purchase_receipt', 'sale_issue', 'sale_refund_return', 'adjustment_increase', 'adjustment_decrease');
CREATE TYPE public.stock_receipt_status AS ENUM ('posted', 'reversed');


-- 3. Inventory Positions
CREATE TABLE public.inventory_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  catalog_item_id uuid NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  status public.inventory_position_status NOT NULL DEFAULT 'pending_initialization',
  initialized_at timestamptz,
  quantity_on_hand numeric(14,6) NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  inventory_value_minor bigint NOT NULL DEFAULT 0 CHECK (inventory_value_minor >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, catalog_item_id)
);


-- 4. Inventory Movements
CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  catalog_item_id uuid NOT NULL REFERENCES public.catalog_items(id) ON DELETE RESTRICT,
  movement_type public.inventory_movement_type NOT NULL,
  quantity_delta numeric(14,6) NOT NULL,
  inventory_value_delta_minor bigint NOT NULL,
  unit_code_snapshot text,
  source_event_type text NOT NULL,
  source_event_id text NOT NULL,
  source_line_id uuid,
  occurred_at timestamptz NOT NULL,
  created_by_user_id uuid REFERENCES auth.users(id),
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, source_event_type, source_event_id, source_line_id),
  UNIQUE (business_id, idempotency_key)
);


-- 5. Stock Receipts
CREATE TABLE public.stock_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  receipt_number text NOT NULL,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  currency_code text NOT NULL,
  total_minor bigint NOT NULL DEFAULT 0 CHECK (total_minor >= 0),
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  status public.stock_receipt_status NOT NULL DEFAULT 'posted',
  occurred_at timestamptz NOT NULL,
  effective_date date NOT NULL,
  supplier_reference text,
  notes text,
  created_by_user_id uuid REFERENCES auth.users(id),
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, receipt_number),
  UNIQUE(business_id, idempotency_key)
);

CREATE TABLE public.stock_receipt_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  stock_receipt_id uuid NOT NULL REFERENCES public.stock_receipts(id) ON DELETE CASCADE,
  catalog_item_id uuid NOT NULL REFERENCES public.catalog_items(id) ON DELETE RESTRICT,
  item_name_snapshot text NOT NULL,
  unit_code_snapshot text,
  quantity numeric(14,6) NOT NULL CHECK (quantity > 0),
  unit_cost_minor bigint NOT NULL CHECK (unit_cost_minor >= 0),
  line_total_minor bigint NOT NULL CHECK (line_total_minor >= 0),
  line_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stock_receipt_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  stock_receipt_id uuid NOT NULL REFERENCES public.stock_receipts(id) ON DELETE CASCADE,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency_code text NOT NULL,
  payment_method public.payment_method NOT NULL,
  reference text,
  occurred_at timestamptz NOT NULL,
  effective_date date NOT NULL,
  paid_by_user_id uuid REFERENCES auth.users(id),
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, idempotency_key)
);


-- 6. Trigger: Auto-create pending initialization position
CREATE OR REPLACE FUNCTION public.trigger_provision_inventory_position()
RETURNS trigger AS $$
BEGIN
  IF NEW.track_inventory = true AND NEW.item_type = 'product' THEN
    INSERT INTO public.inventory_positions (business_id, catalog_item_id)
    VALUES (NEW.business_id, NEW.id)
    ON CONFLICT (business_id, catalog_item_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_catalog_item_track_inventory
AFTER INSERT OR UPDATE ON public.catalog_items
FOR EACH ROW
EXECUTE FUNCTION public.trigger_provision_inventory_position();

-- Backfill existing tracked products
INSERT INTO public.inventory_positions (business_id, catalog_item_id)
SELECT business_id, id FROM public.catalog_items 
WHERE track_inventory = true AND item_type = 'product'
ON CONFLICT (business_id, catalog_item_id) DO NOTHING;


-- ==============================================================================
-- RLS Policies
-- ==============================================================================
ALTER TABLE public.inventory_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_receipt_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View inventory_positions" ON public.inventory_positions FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant', 'inventory_staff', 'sales_staff']));
CREATE POLICY "View inventory_movements" ON public.inventory_movements FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant', 'inventory_staff']));
CREATE POLICY "View stock_receipts" ON public.stock_receipts FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant', 'inventory_staff']));
CREATE POLICY "View stock_receipt_items" ON public.stock_receipt_items FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant', 'inventory_staff']));
CREATE POLICY "View stock_receipt_payments" ON public.stock_receipt_payments FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant', 'inventory_staff']));


-- ==============================================================================
-- Helpers and Operations
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.update_stock_receipt_statuses(p_receipt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_receipt bigint;
  v_total_paid bigint;
  v_new_payment_status public.payment_status;
BEGIN
  SELECT total_minor INTO v_total_receipt FROM public.stock_receipts WHERE id = p_receipt_id;
  SELECT COALESCE(SUM(amount_minor), 0) INTO v_total_paid FROM public.stock_receipt_payments WHERE stock_receipt_id = p_receipt_id;

  IF v_total_paid = 0 THEN
    v_new_payment_status := 'unpaid';
  ELSIF v_total_paid >= v_total_receipt THEN
    v_new_payment_status := 'paid';
  ELSE
    v_new_payment_status := 'partially_paid';
  END IF;

  UPDATE public.stock_receipts
  SET payment_status = v_new_payment_status,
      updated_at = now()
  WHERE id = p_receipt_id;
END;
$$;


-- Initialize Inventory
CREATE OR REPLACE FUNCTION public.initialize_inventory(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_user_id uuid;
  v_catalog_item_id uuid;
  v_idempotency_key text;
  v_quantity numeric(14,6);
  v_unit_cost_minor bigint;
  v_opening_value_minor bigint;
  v_occurred_at timestamptz;
  v_currency_code text;
  
  v_existing_movement_id uuid;
  v_position_record record;
  
  v_inventory_acct uuid;
  v_equity_acct uuid;
  v_journal_lines jsonb;
BEGIN
  v_business_id := (payload->>'businessId')::uuid;
  v_user_id := auth.uid();
  v_catalog_item_id := (payload->>'catalogItemId')::uuid;
  v_idempotency_key := payload->>'idempotencyKey';
  v_quantity := (payload->>'quantity')::numeric(14,6);
  v_unit_cost_minor := (payload->>'unitCostMinor')::bigint;
  v_occurred_at := COALESCE((payload->>'occurredAt')::timestamptz, now());
  v_currency_code := payload->>'currencyCode';

  IF NOT public.has_business_role(v_business_id, ARRAY['owner', 'business_admin']) THEN
    RAISE EXCEPTION 'Not authorized to initialize inventory.';
  END IF;

  SELECT id INTO v_existing_movement_id FROM public.inventory_movements WHERE business_id = v_business_id AND idempotency_key = v_idempotency_key;
  IF v_existing_movement_id IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_existing_movement_id, 'status', 'idempotent_success');
  END IF;

  SELECT * INTO v_position_record FROM public.inventory_positions WHERE business_id = v_business_id AND catalog_item_id = v_catalog_item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Position not found.'; END IF;
  IF v_position_record.status = 'initialized' THEN RAISE EXCEPTION 'Already initialized.'; END IF;

  v_opening_value_minor := round(v_quantity * v_unit_cost_minor);

  -- Update Position
  UPDATE public.inventory_positions
  SET status = 'initialized',
      initialized_at = now(),
      quantity_on_hand = v_quantity,
      inventory_value_minor = v_opening_value_minor,
      updated_at = now()
  WHERE id = v_position_record.id;

  -- Insert Movement
  INSERT INTO public.inventory_movements (
    business_id, catalog_item_id, movement_type, quantity_delta, inventory_value_delta_minor,
    source_event_type, source_event_id, occurred_at, created_by_user_id, idempotency_key
  ) VALUES (
    v_business_id, v_catalog_item_id, 'opening_stock', v_quantity, v_opening_value_minor,
    'initialization', v_position_record.id::text, v_occurred_at, v_user_id, v_idempotency_key
  ) RETURNING id INTO v_existing_movement_id;

  -- Journal (Debit Inventory Asset, Credit Owner Equity)
  IF v_opening_value_minor > 0 THEN
    SELECT id INTO v_inventory_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'inventory_asset';
    SELECT id INTO v_equity_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'owner_equity';
    
    v_journal_lines := jsonb_build_array(
      jsonb_build_object('ledgerAccountId', v_inventory_acct, 'debitMinor', v_opening_value_minor, 'creditMinor', 0, 'memo', 'Opening Stock'),
      jsonb_build_object('ledgerAccountId', v_equity_acct, 'debitMinor', 0, 'creditMinor', v_opening_value_minor, 'memo', 'Opening Stock Offset')
    );

    PERFORM public.post_financial_entry(jsonb_build_object(
      'businessId', v_business_id,
      'currencyCode', v_currency_code,
      'sourceEventType', 'inventory_initialization',
      'sourceEventId', v_existing_movement_id,
      'idempotencyKey', v_idempotency_key,
      'occurredAt', v_occurred_at,
      'effectiveDate', v_occurred_at::date,
      'description', 'Inventory Initialization',
      'createdByUserId', v_user_id,
      'lines', v_journal_lines
    ));
  END IF;

  RETURN jsonb_build_object('id', v_existing_movement_id, 'status', 'success');
END;
$$;


-- Create Stock Receipt
CREATE OR REPLACE FUNCTION public.create_stock_receipt(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_user_id uuid;
  v_supplier_id uuid;
  v_idempotency_key text;
  v_currency_code text;
  v_occurred_at timestamptz;
  v_effective_date date;
  v_notes text;
  v_supplier_reference text;
  v_items jsonb;
  v_payments jsonb;
  
  v_item jsonb;
  v_payment jsonb;
  v_receipt_id uuid;
  v_receipt_number text;
  
  v_total_minor bigint := 0;
  v_total_paid_minor bigint := 0;
  
  v_catalog_item_id uuid;
  v_line_quantity numeric(14,6);
  v_line_unit_cost bigint;
  v_line_total bigint;
  v_cat_record record;
  v_line_order int := 0;
  v_receipt_item_id uuid;
  
  v_existing_receipt_id uuid;
  v_journal_lines jsonb;
  
  v_cash_acct uuid;
  v_ap_acct uuid;
  v_inventory_acct uuid;
BEGIN
  v_business_id := (payload->>'businessId')::uuid;
  v_user_id := auth.uid();
  v_supplier_id := (payload->>'supplierId')::uuid;
  v_idempotency_key := payload->>'idempotencyKey';
  v_currency_code := payload->>'currencyCode';
  v_occurred_at := COALESCE((payload->>'occurredAt')::timestamptz, now());
  v_effective_date := (payload->>'effectiveDate')::date;
  v_notes := payload->>'notes';
  v_supplier_reference := payload->>'supplierReference';
  v_items := payload->'items';
  v_payments := payload->'payments';

  IF NOT public.has_business_role(v_business_id, ARRAY['owner', 'business_admin', 'manager', 'inventory_staff']) THEN
    RAISE EXCEPTION 'Not authorized to create stock receipts.';
  END IF;

  SELECT id INTO v_existing_receipt_id FROM public.stock_receipts WHERE business_id = v_business_id AND idempotency_key = v_idempotency_key;
  IF v_existing_receipt_id IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_existing_receipt_id, 'status', 'idempotent_success');
  END IF;

  IF jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'Receipt must have at least one item.';
  END IF;

  v_receipt_number := public.next_business_sequence(v_business_id, 'REC-');

  INSERT INTO public.stock_receipts (
    business_id, receipt_number, supplier_id, currency_code, total_minor,
    occurred_at, effective_date, supplier_reference, notes, created_by_user_id, idempotency_key
  ) VALUES (
    v_business_id, v_receipt_number, v_supplier_id, v_currency_code, 0,
    v_occurred_at, v_effective_date, v_supplier_reference, v_notes, v_user_id, v_idempotency_key
  ) RETURNING id INTO v_receipt_id;

  -- Process Items (locking deterministic order not strictly required inside the loop since they usually belong to one receipt, but sorting by item ID is safer. For now loop as provided)
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    v_catalog_item_id := (v_item->>'catalogItemId')::uuid;
    v_line_quantity := (v_item->>'quantity')::numeric(14,6);
    v_line_unit_cost := (v_item->>'unitCostMinor')::bigint;

    IF v_line_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be positive.'; END IF;

    SELECT * INTO v_cat_record FROM public.catalog_items WHERE id = v_catalog_item_id AND business_id = v_business_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Catalog item % not found.', v_catalog_item_id; END IF;
    IF v_cat_record.track_inventory = false OR v_cat_record.item_type != 'product' THEN
      RAISE EXCEPTION 'Cannot receive non-inventory item.';
    END IF;

    v_line_total := round(v_line_unit_cost * v_line_quantity);
    v_total_minor := v_total_minor + v_line_total;

    INSERT INTO public.stock_receipt_items (
      business_id, stock_receipt_id, catalog_item_id, item_name_snapshot, unit_code_snapshot,
      quantity, unit_cost_minor, line_total_minor, line_order
    ) VALUES (
      v_business_id, v_receipt_id, v_catalog_item_id, v_cat_record.name, v_cat_record.unit_code,
      v_line_quantity, v_line_unit_cost, v_line_total, v_line_order
    ) RETURNING id INTO v_receipt_item_id;

    -- Update Inventory Position
    -- Lock row
    PERFORM id FROM public.inventory_positions WHERE business_id = v_business_id AND catalog_item_id = v_catalog_item_id FOR UPDATE;
    
    UPDATE public.inventory_positions
    SET quantity_on_hand = quantity_on_hand + v_line_quantity,
        inventory_value_minor = inventory_value_minor + v_line_total,
        updated_at = now()
    WHERE business_id = v_business_id AND catalog_item_id = v_catalog_item_id AND status = 'initialized';
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % is not initialized for inventory.', v_cat_record.name;
    END IF;

    -- Insert Movement
    INSERT INTO public.inventory_movements (
      business_id, catalog_item_id, movement_type, quantity_delta, inventory_value_delta_minor, unit_code_snapshot,
      source_event_type, source_event_id, source_line_id, occurred_at, created_by_user_id, idempotency_key
    ) VALUES (
      v_business_id, v_catalog_item_id, 'purchase_receipt', v_line_quantity, v_line_total, v_cat_record.unit_code,
      'stock_receipt', v_receipt_id::text, v_receipt_item_id, v_occurred_at, v_user_id, v_idempotency_key || '_' || v_line_order
    );

    v_line_order := v_line_order + 1;
  END LOOP;

  IF v_payments IS NOT NULL THEN
    FOR v_payment IN SELECT * FROM jsonb_array_elements(v_payments)
    LOOP
      v_total_paid_minor := v_total_paid_minor + (v_payment->>'amountMinor')::bigint;
      
      INSERT INTO public.stock_receipt_payments (
        business_id, stock_receipt_id, amount_minor, currency_code, payment_method, reference,
        occurred_at, effective_date, paid_by_user_id, idempotency_key
      ) VALUES (
        v_business_id, v_receipt_id, (v_payment->>'amountMinor')::bigint, v_currency_code, 
        (v_payment->>'paymentMethod')::public.payment_method, v_payment->>'reference',
        v_occurred_at, v_effective_date, v_user_id, v_idempotency_key || '_pay_' || (v_payment->>'paymentMethod')
      );
    END LOOP;
  END IF;

  IF v_total_paid_minor > v_total_minor THEN
    RAISE EXCEPTION 'Payments cannot exceed receipt total.';
  END IF;

  UPDATE public.stock_receipts SET total_minor = v_total_minor WHERE id = v_receipt_id;
  PERFORM public.update_stock_receipt_statuses(v_receipt_id);

  -- Journal Posting
  SELECT id INTO v_cash_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'cash_and_cash_equivalents';
  SELECT id INTO v_ap_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'accounts_payable';
  SELECT id INTO v_inventory_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'inventory_asset';

  v_journal_lines := '[]'::jsonb;
  -- Debit Inventory Asset
  v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_inventory_acct, 'debitMinor', v_total_minor, 'creditMinor', 0, 'memo', 'Stock Receipt ' || v_receipt_number);
  
  -- Credit Cash
  IF v_total_paid_minor > 0 THEN
    v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_cash_acct, 'debitMinor', 0, 'creditMinor', v_total_paid_minor, 'memo', 'Payment Sent');
  END IF;

  -- Credit AP
  IF v_total_minor - v_total_paid_minor > 0 THEN
    v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_ap_acct, 'debitMinor', 0, 'creditMinor', v_total_minor - v_total_paid_minor, 'memo', 'Outstanding Balance');
  END IF;

  PERFORM public.post_financial_entry(jsonb_build_object(
    'businessId', v_business_id,
    'currencyCode', v_currency_code,
    'sourceEventType', 'stock_receipt',
    'sourceEventId', v_receipt_id,
    'idempotencyKey', v_idempotency_key,
    'occurredAt', v_occurred_at,
    'effectiveDate', v_effective_date,
    'description', 'Stock Receipt ' || v_receipt_number,
    'createdByUserId', v_user_id,
    'lines', v_journal_lines
  ));

  RETURN jsonb_build_object('id', v_receipt_id, 'status', 'success');
END;
$$;


-- Record Stock Receipt Payment
CREATE OR REPLACE FUNCTION public.record_stock_receipt_payment(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_user_id uuid;
  v_receipt_id uuid;
  v_idempotency_key text;
  v_amount_minor bigint;
  v_payment_method public.payment_method;
  v_reference text;
  v_occurred_at timestamptz;
  v_effective_date date;
  
  v_receipt_record record;
  v_total_paid bigint;
  v_outstanding bigint;
  v_payment_id uuid;

  v_journal_lines jsonb;
  v_cash_acct uuid;
  v_ap_acct uuid;
BEGIN
  v_business_id := (payload->>'businessId')::uuid;
  v_user_id := auth.uid();
  v_receipt_id := (payload->>'stockReceiptId')::uuid;
  v_idempotency_key := payload->>'idempotencyKey';
  v_amount_minor := (payload->>'amountMinor')::bigint;
  v_payment_method := (payload->>'paymentMethod')::public.payment_method;
  v_reference := payload->>'reference';
  v_occurred_at := COALESCE((payload->>'occurredAt')::timestamptz, now());
  v_effective_date := (payload->>'effectiveDate')::date;

  IF NOT public.has_business_role(v_business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant']) THEN
    RAISE EXCEPTION 'Not authorized to record payments.';
  END IF;

  SELECT id INTO v_payment_id FROM public.stock_receipt_payments WHERE business_id = v_business_id AND idempotency_key = v_idempotency_key;
  IF v_payment_id IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_payment_id, 'status', 'idempotent_success');
  END IF;

  SELECT * INTO v_receipt_record FROM public.stock_receipts WHERE id = v_receipt_id AND business_id = v_business_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Receipt not found'; END IF;

  SELECT COALESCE(SUM(amount_minor), 0) INTO v_total_paid FROM public.stock_receipt_payments WHERE stock_receipt_id = v_receipt_id;
  v_outstanding := v_receipt_record.total_minor - v_total_paid;

  IF v_amount_minor <= 0 THEN RAISE EXCEPTION 'Payment must be greater than 0.'; END IF;
  IF v_amount_minor > v_outstanding THEN RAISE EXCEPTION 'Payment exceeds outstanding balance.'; END IF;

  INSERT INTO public.stock_receipt_payments (
    business_id, stock_receipt_id, amount_minor, currency_code, payment_method, reference,
    occurred_at, effective_date, paid_by_user_id, idempotency_key
  ) VALUES (
    v_business_id, v_receipt_id, v_amount_minor, v_receipt_record.currency_code, v_payment_method, v_reference,
    v_occurred_at, v_effective_date, v_user_id, v_idempotency_key
  ) RETURNING id INTO v_payment_id;

  PERFORM public.update_stock_receipt_statuses(v_receipt_id);

  SELECT id INTO v_cash_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'cash_and_cash_equivalents';
  SELECT id INTO v_ap_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'accounts_payable';

  v_journal_lines := jsonb_build_array(
    jsonb_build_object('ledgerAccountId', v_ap_acct, 'debitMinor', v_amount_minor, 'creditMinor', 0, 'memo', 'Payment against Receipt ' || v_receipt_record.receipt_number),
    jsonb_build_object('ledgerAccountId', v_cash_acct, 'debitMinor', 0, 'creditMinor', v_amount_minor, 'memo', 'Payment Sent')
  );

  PERFORM public.post_financial_entry(jsonb_build_object(
    'businessId', v_business_id,
    'currencyCode', v_receipt_record.currency_code,
    'sourceEventType', 'stock_receipt_payment',
    'sourceEventId', v_payment_id,
    'idempotencyKey', v_idempotency_key,
    'occurredAt', v_occurred_at,
    'effectiveDate', v_effective_date,
    'description', 'Payment for Receipt ' || v_receipt_record.receipt_number,
    'createdByUserId', v_user_id,
    'lines', v_journal_lines
  ));

  RETURN jsonb_build_object('id', v_payment_id, 'status', 'success');
END;
$$;


-- Adjust Inventory
CREATE OR REPLACE FUNCTION public.adjust_inventory(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_user_id uuid;
  v_catalog_item_id uuid;
  v_idempotency_key text;
  v_quantity_delta numeric(14,6);
  v_unit_cost_minor bigint;
  v_reason_code text;
  v_notes text;
  v_occurred_at timestamptz;
  v_currency_code text;
  
  v_existing_movement_id uuid;
  v_position_record record;
  v_cat_record record;
  v_value_delta_minor bigint;
  v_mtype public.inventory_movement_type;
  
  v_inventory_acct uuid;
  v_gain_acct uuid;
  v_loss_acct uuid;
  v_journal_lines jsonb;
BEGIN
  v_business_id := (payload->>'businessId')::uuid;
  v_user_id := auth.uid();
  v_catalog_item_id := (payload->>'catalogItemId')::uuid;
  v_idempotency_key := payload->>'idempotencyKey';
  v_quantity_delta := (payload->>'quantityDelta')::numeric(14,6);
  v_unit_cost_minor := (payload->>'unitCostMinor')::bigint;
  v_reason_code := payload->>'reasonCode';
  v_notes := payload->>'notes';
  v_occurred_at := COALESCE((payload->>'occurredAt')::timestamptz, now());
  v_currency_code := payload->>'currencyCode';

  IF NOT public.has_business_role(v_business_id, ARRAY['owner', 'business_admin', 'manager', 'inventory_staff']) THEN
    RAISE EXCEPTION 'Not authorized to adjust inventory.';
  END IF;

  SELECT id INTO v_existing_movement_id FROM public.inventory_movements WHERE business_id = v_business_id AND idempotency_key = v_idempotency_key;
  IF v_existing_movement_id IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_existing_movement_id, 'status', 'idempotent_success');
  END IF;

  IF v_quantity_delta = 0 THEN RAISE EXCEPTION 'Adjustment delta cannot be zero.'; END IF;

  SELECT * INTO v_cat_record FROM public.catalog_items WHERE id = v_catalog_item_id AND business_id = v_business_id;
  SELECT * INTO v_position_record FROM public.inventory_positions WHERE business_id = v_business_id AND catalog_item_id = v_catalog_item_id FOR UPDATE;
  IF NOT FOUND OR v_position_record.status != 'initialized' THEN RAISE EXCEPTION 'Position not initialized.'; END IF;

  IF v_quantity_delta > 0 THEN
    v_mtype := 'adjustment_increase';
    v_value_delta_minor := round(v_quantity_delta * v_unit_cost_minor);
  ELSE
    v_mtype := 'adjustment_decrease';
    IF (v_position_record.quantity_on_hand + v_quantity_delta) < 0 THEN
      RAISE EXCEPTION 'Cannot adjust below zero stock.';
    END IF;
    -- For decrease, calculate COGS based on moving average
    IF (v_position_record.quantity_on_hand + v_quantity_delta) = 0 THEN
      v_value_delta_minor := -v_position_record.inventory_value_minor; -- Final depletion rule
    ELSE
      v_value_delta_minor := round((v_position_record.inventory_value_minor::numeric * v_quantity_delta) / v_position_record.quantity_on_hand);
    END IF;
  END IF;

  UPDATE public.inventory_positions
  SET quantity_on_hand = quantity_on_hand + v_quantity_delta,
      inventory_value_minor = inventory_value_minor + v_value_delta_minor,
      updated_at = now()
  WHERE id = v_position_record.id;

  INSERT INTO public.inventory_movements (
    business_id, catalog_item_id, movement_type, quantity_delta, inventory_value_delta_minor, unit_code_snapshot,
    source_event_type, source_event_id, occurred_at, created_by_user_id, idempotency_key
  ) VALUES (
    v_business_id, v_catalog_item_id, v_mtype, v_quantity_delta, v_value_delta_minor, v_cat_record.unit_code,
    'adjustment', v_idempotency_key, v_occurred_at, v_user_id, v_idempotency_key
  ) RETURNING id INTO v_existing_movement_id;

  SELECT id INTO v_inventory_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'inventory_asset';

  IF v_value_delta_minor > 0 THEN
    SELECT id INTO v_gain_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'inventory_adjustment_gain';
    v_journal_lines := jsonb_build_array(
      jsonb_build_object('ledgerAccountId', v_inventory_acct, 'debitMinor', v_value_delta_minor, 'creditMinor', 0, 'memo', 'Stock Adjustment Increase'),
      jsonb_build_object('ledgerAccountId', v_gain_acct, 'debitMinor', 0, 'creditMinor', v_value_delta_minor, 'memo', 'Stock Gain ' || v_reason_code)
    );
  ELSIF v_value_delta_minor < 0 THEN
    SELECT id INTO v_loss_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'inventory_shrinkage_loss';
    v_journal_lines := jsonb_build_array(
      jsonb_build_object('ledgerAccountId', v_loss_acct, 'debitMinor', -v_value_delta_minor, 'creditMinor', 0, 'memo', 'Stock Loss ' || v_reason_code),
      jsonb_build_object('ledgerAccountId', v_inventory_acct, 'debitMinor', 0, 'creditMinor', -v_value_delta_minor, 'memo', 'Stock Adjustment Decrease')
    );
  END IF;

  IF v_value_delta_minor != 0 THEN
    PERFORM public.post_financial_entry(jsonb_build_object(
      'businessId', v_business_id,
      'currencyCode', v_currency_code,
      'sourceEventType', 'inventory_adjustment',
      'sourceEventId', v_existing_movement_id,
      'idempotencyKey', v_idempotency_key,
      'occurredAt', v_occurred_at,
      'effectiveDate', v_occurred_at::date,
      'description', 'Inventory Adjustment',
      'createdByUserId', v_user_id,
      'lines', v_journal_lines
    ));
  END IF;

  RETURN jsonb_build_object('id', v_existing_movement_id, 'status', 'success');
END;
$$;

-- ==============================================================================
-- Updated Sale RPCs with Inventory Integration
-- ==============================================================================

-- 1. Create Sale (Updated)
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
  
  v_cash_acct uuid;
  v_ar_acct uuid;
  v_revenue_acct uuid;
  v_cogs_acct uuid;
  v_inventory_acct uuid;

  v_sale_item_id uuid;
  v_position_record record;
  v_line_cogs bigint;
  v_cogs_minor bigint := 0;
BEGIN
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

  IF NOT public.has_business_role(v_business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff']) THEN
    RAISE EXCEPTION 'Not authorized to create sales.';
  END IF;

  SELECT id INTO v_existing_sale_id FROM public.sales WHERE business_id = v_business_id AND idempotency_key = v_idempotency_key;
  IF v_existing_sale_id IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_existing_sale_id, 'status', 'idempotent_success');
  END IF;

  IF jsonb_array_length(v_items) = 0 THEN RAISE EXCEPTION 'Sale must have at least one item.'; END IF;

  v_sale_number := public.next_business_sequence(v_business_id, 'SAL-');

  INSERT INTO public.sales (
    business_id, sale_number, customer_id, currency_code, subtotal_minor, discount_total_minor, total_minor,
    occurred_at, effective_date, notes, created_by_user_id, idempotency_key
  ) VALUES (
    v_business_id, v_sale_number, v_customer_id, v_currency_code, 0, 0, 0,
    v_occurred_at, v_effective_date, v_notes, v_user_id, v_idempotency_key
  ) RETURNING id INTO v_sale_id;

  -- Process Items with deterministic sorting by catalogItemId (using subquery)
  FOR v_item IN 
    SELECT value FROM jsonb_array_elements(v_items) AS items(value) ORDER BY value->>'catalogItemId'
  LOOP
    v_catalog_item_id := (v_item->>'catalogItemId')::uuid;
    v_line_quantity := (v_item->>'quantity')::numeric(14,6);
    v_line_discount := (v_item->>'discountMinor')::bigint;

    IF v_line_quantity <= 0 THEN RAISE EXCEPTION 'Item quantity must be greater than 0.'; END IF;

    SELECT * INTO v_cat_record FROM public.catalog_items WHERE id = v_catalog_item_id AND business_id = v_business_id;
    IF NOT FOUND OR v_cat_record.status != 'active' THEN RAISE EXCEPTION 'Catalog item missing or inactive.'; END IF;
    IF v_cat_record.currency_code != v_currency_code THEN RAISE EXCEPTION 'Currency mismatch on item.'; END IF;

    v_line_unit_price := v_cat_record.selling_price_minor;
    v_line_gross := round(v_line_unit_price * v_line_quantity);
    IF v_line_discount > v_line_gross THEN RAISE EXCEPTION 'Discount cannot exceed line gross amount.'; END IF;
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
    ) RETURNING id INTO v_sale_item_id;

    -- Inventory Integration
    IF v_cat_record.track_inventory = true AND v_cat_record.item_type = 'product' THEN
      SELECT * INTO v_position_record FROM public.inventory_positions WHERE business_id = v_business_id AND catalog_item_id = v_catalog_item_id FOR UPDATE;
      IF NOT FOUND OR v_position_record.status != 'initialized' THEN
        RAISE EXCEPTION 'Product % is not initialized for inventory. Initialize it before selling.', v_cat_record.name;
      END IF;
      IF v_position_record.quantity_on_hand < v_line_quantity THEN
        RAISE EXCEPTION 'Insufficient stock for product %. Available: %', v_cat_record.name, v_position_record.quantity_on_hand;
      END IF;

      -- Final depletion rule
      IF v_position_record.quantity_on_hand = v_line_quantity THEN
        v_line_cogs := v_position_record.inventory_value_minor;
      ELSE
        v_line_cogs := round((v_position_record.inventory_value_minor::numeric * v_line_quantity) / v_position_record.quantity_on_hand);
      END IF;

      UPDATE public.inventory_positions
      SET quantity_on_hand = quantity_on_hand - v_line_quantity,
          inventory_value_minor = inventory_value_minor - v_line_cogs,
          updated_at = now()
      WHERE id = v_position_record.id;

      INSERT INTO public.inventory_movements (
        business_id, catalog_item_id, movement_type, quantity_delta, inventory_value_delta_minor, unit_code_snapshot,
        source_event_type, source_event_id, source_line_id, occurred_at, created_by_user_id, idempotency_key
      ) VALUES (
        v_business_id, v_catalog_item_id, 'sale_issue', -v_line_quantity, -v_line_cogs, v_cat_record.unit_code,
        'sale', v_sale_id::text, v_sale_item_id, v_occurred_at, v_user_id, v_idempotency_key || '_issue_' || v_line_order
      );

      v_cogs_minor := v_cogs_minor + v_line_cogs;
    END IF;

    v_line_order := v_line_order + 1;
  END LOOP;

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

  IF v_total_paid_minor > v_total_minor THEN RAISE EXCEPTION 'Payments cannot exceed sale total.'; END IF;
  IF v_total_paid_minor < v_total_minor AND v_customer_id IS NULL THEN RAISE EXCEPTION 'Customer required for outstanding balance.'; END IF;

  UPDATE public.sales
  SET subtotal_minor = v_subtotal_minor, discount_total_minor = v_discount_total_minor, total_minor = v_total_minor
  WHERE id = v_sale_id;

  PERFORM public.update_sale_statuses(v_sale_id);

  SELECT id INTO v_cash_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'cash_and_cash_equivalents';
  SELECT id INTO v_ar_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'accounts_receivable';
  SELECT id INTO v_revenue_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'sales_revenue';
  SELECT id INTO v_cogs_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'cost_of_goods_sold';
  SELECT id INTO v_inventory_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'inventory_asset';

  v_journal_lines := '[]'::jsonb;
  v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_revenue_acct, 'debitMinor', 0, 'creditMinor', v_total_minor, 'memo', 'Sale Revenue');
  IF v_total_paid_minor > 0 THEN
    v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_cash_acct, 'debitMinor', v_total_paid_minor, 'creditMinor', 0, 'memo', 'Payment Received');
  END IF;
  IF v_total_minor - v_total_paid_minor > 0 THEN
    v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_ar_acct, 'debitMinor', v_total_minor - v_total_paid_minor, 'creditMinor', 0, 'memo', 'Outstanding Balance');
  END IF;
  
  -- Inventory COGS Posting
  IF v_cogs_minor > 0 THEN
    v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_cogs_acct, 'debitMinor', v_cogs_minor, 'creditMinor', 0, 'memo', 'Cost of Goods Sold');
    v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_inventory_acct, 'debitMinor', 0, 'creditMinor', v_cogs_minor, 'memo', 'Inventory Depletion');
  END IF;

  PERFORM public.post_financial_entry(jsonb_build_object(
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
  ));

  RETURN jsonb_build_object('id', v_sale_id, 'status', 'success');
END;
$$;


-- 2. Create Sale Refund (Updated)
-- Adding restock column to refund items to track the decision
ALTER TABLE public.sale_refund_items ADD COLUMN restocked boolean NOT NULL DEFAULT false;
ALTER TABLE public.sale_refund_items ADD COLUMN cogs_reversal_minor bigint NOT NULL DEFAULT 0;

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
  v_restock boolean;
  v_si record;
  v_previously_refunded_qty numeric(14,6);
  v_max_refundable_qty numeric(14,6);
  v_previously_refunded_amt bigint;
  v_max_refundable_amt bigint;
  v_line_refund_amt bigint;
  
  v_original_line_cogs bigint;
  v_previously_restocked_qty numeric(14,6);
  v_previously_reversed_cogs bigint;
  v_line_cogs_reversal bigint;
  v_total_cogs_reversal bigint := 0;
  v_position_record record;
  
  v_journal_lines jsonb;
  v_cash_acct uuid;
  v_ar_acct uuid;
  v_revenue_acct uuid;
  v_cogs_acct uuid;
  v_inventory_acct uuid;
  v_line_order int := 0;
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

  IF NOT public.has_business_role(v_business_id, ARRAY['owner', 'business_admin', 'manager']) THEN RAISE EXCEPTION 'Not authorized to perform refunds.'; END IF;

  SELECT id INTO v_existing_refund_id FROM public.sale_refunds WHERE business_id = v_business_id AND idempotency_key = v_idempotency_key;
  IF v_existing_refund_id IS NOT NULL THEN RETURN jsonb_build_object('id', v_existing_refund_id, 'status', 'idempotent_success'); END IF;

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

  -- Process Items deterministically to avoid deadlocks on positions
  FOR v_item IN SELECT value FROM jsonb_array_elements(v_items) AS items(value) ORDER BY value->>'saleItemId'
  LOOP
    v_sale_item_id := (v_item->>'saleItemId')::uuid;
    v_qty := (v_item->>'quantity')::numeric(14,6);
    v_restock := COALESCE((v_item->>'restock')::boolean, false);

    IF v_qty <= 0 THEN RAISE EXCEPTION 'Refund quantity must be positive.'; END IF;

    SELECT * INTO v_si FROM public.sale_items WHERE id = v_sale_item_id AND sale_id = v_sale_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Sale Item % not found.', v_sale_item_id; END IF;

    SELECT COALESCE(SUM(quantity), 0), COALESCE(SUM(refund_amount_minor), 0), 
           COALESCE(SUM(CASE WHEN restocked THEN quantity ELSE 0 END), 0), COALESCE(SUM(cogs_reversal_minor), 0)
    INTO v_previously_refunded_qty, v_previously_refunded_amt, v_previously_restocked_qty, v_previously_reversed_cogs
    FROM public.sale_refund_items
    WHERE sale_item_id = v_sale_item_id AND business_id = v_business_id;

    v_max_refundable_qty := v_si.quantity - v_previously_refunded_qty;
    v_max_refundable_amt := v_si.line_total_minor - v_previously_refunded_amt;

    IF v_qty > v_max_refundable_qty THEN RAISE EXCEPTION 'Cannot refund % units. Only % available.', v_qty, v_max_refundable_qty; END IF;

    IF v_qty = v_max_refundable_qty THEN
      v_line_refund_amt := v_max_refundable_amt;
    ELSE
      v_line_refund_amt := round((v_si.line_total_minor::numeric * v_qty) / v_si.quantity);
      IF v_line_refund_amt > v_max_refundable_amt THEN v_line_refund_amt := v_max_refundable_amt; END IF;
    END IF;

    v_refund_total := v_refund_total + v_line_refund_amt;
    
    v_line_cogs_reversal := 0;
    IF v_restock = true AND v_si.track_inventory_snapshot = true AND v_si.item_type_snapshot = 'product' THEN
      -- Get original COGS allocation (it was negative in movements table, so we negate it to positive)
      SELECT COALESCE(SUM(-inventory_value_delta_minor), 0) INTO v_original_line_cogs
      FROM public.inventory_movements
      WHERE source_event_type = 'sale' AND source_line_id = v_sale_item_id AND movement_type = 'sale_issue';
      
      IF v_original_line_cogs > 0 THEN
        IF v_qty = (v_si.quantity - v_previously_restocked_qty) THEN
           v_line_cogs_reversal := v_original_line_cogs - v_previously_reversed_cogs;
        ELSE
           v_line_cogs_reversal := round((v_original_line_cogs::numeric * v_qty) / v_si.quantity);
           IF v_line_cogs_reversal > (v_original_line_cogs - v_previously_reversed_cogs) THEN
             v_line_cogs_reversal := v_original_line_cogs - v_previously_reversed_cogs;
           END IF;
        END IF;

        -- Apply to inventory position
        SELECT * INTO v_position_record FROM public.inventory_positions WHERE business_id = v_business_id AND catalog_item_id = v_si.catalog_item_id FOR UPDATE;
        IF FOUND AND v_position_record.status = 'initialized' THEN
           UPDATE public.inventory_positions
           SET quantity_on_hand = quantity_on_hand + v_qty,
               inventory_value_minor = inventory_value_minor + v_line_cogs_reversal,
               updated_at = now()
           WHERE id = v_position_record.id;
           
           INSERT INTO public.inventory_movements (
             business_id, catalog_item_id, movement_type, quantity_delta, inventory_value_delta_minor, unit_code_snapshot,
             source_event_type, source_event_id, source_line_id, occurred_at, created_by_user_id, idempotency_key
           ) VALUES (
             v_business_id, v_si.catalog_item_id, 'sale_refund_return', v_qty, v_line_cogs_reversal, v_si.unit_code_snapshot,
             'sale_refund', v_refund_id::text, v_sale_item_id, v_occurred_at, v_user_id, v_idempotency_key || '_ret_' || v_line_order
           );
           
           v_total_cogs_reversal := v_total_cogs_reversal + v_line_cogs_reversal;
        END IF;
      END IF;
    END IF;

    INSERT INTO public.sale_refund_items (
      business_id, refund_id, sale_item_id, quantity, refund_amount_minor, restocked, cogs_reversal_minor
    ) VALUES (
      v_business_id, v_refund_id, v_sale_item_id, v_qty, v_line_refund_amt, v_restock, v_line_cogs_reversal
    );
    
    v_line_order := v_line_order + 1;
  END LOOP;

  IF v_refund_total <= 0 THEN RAISE EXCEPTION 'Refund total must be positive.'; END IF;

  SELECT COALESCE(SUM(amount_minor), 0) INTO v_total_paid FROM public.sale_payments WHERE sale_id = v_sale_id;
  SELECT COALESCE(SUM(total_minor), 0), COALESCE(SUM(cash_refund_minor), 0)
  INTO v_total_refunded, v_total_cash_refunded
  FROM public.sale_refunds WHERE sale_id = v_sale_id AND id != v_refund_id;

  v_net_sale := v_sale_record.total_minor - v_total_refunded;
  v_net_paid := v_total_paid - v_total_cash_refunded;
  v_outstanding := v_net_sale - v_net_paid;

  IF v_refund_total > v_net_sale THEN RAISE EXCEPTION 'Cannot refund more than net sale.'; END IF;

  IF v_refund_total <= v_outstanding THEN
    v_receivable_reduction := v_refund_total;
    v_cash_refund := 0;
  ELSE
    v_receivable_reduction := v_outstanding;
    v_cash_refund := v_refund_total - v_outstanding;
  END IF;

  IF v_cash_refund > v_net_paid THEN RAISE EXCEPTION 'Cannot refund % in cash (only % available).', v_cash_refund, v_net_paid; END IF;
  IF v_cash_refund > 0 AND v_cash_refund_method IS NULL THEN RAISE EXCEPTION 'Cash refund method required.'; END IF;

  UPDATE public.sale_refunds
  SET total_minor = v_refund_total, receivable_reduction_minor = v_receivable_reduction, cash_refund_minor = v_cash_refund
  WHERE id = v_refund_id;

  PERFORM public.update_sale_statuses(v_sale_id);

  -- Journal
  SELECT id INTO v_cash_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'cash_and_cash_equivalents';
  SELECT id INTO v_ar_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'accounts_receivable';
  SELECT id INTO v_revenue_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'sales_revenue';
  SELECT id INTO v_cogs_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'cost_of_goods_sold';
  SELECT id INTO v_inventory_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'inventory_asset';

  v_journal_lines := '[]'::jsonb;
  v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_revenue_acct, 'debitMinor', v_refund_total, 'creditMinor', 0, 'memo', 'Refund ' || v_refund_number);

  IF v_receivable_reduction > 0 THEN
    v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_ar_acct, 'debitMinor', 0, 'creditMinor', v_receivable_reduction, 'memo', 'Receivable Reduction');
  END IF;
  IF v_cash_refund > 0 THEN
    v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_cash_acct, 'debitMinor', 0, 'creditMinor', v_cash_refund, 'memo', 'Cash Refund');
  END IF;

  IF v_total_cogs_reversal > 0 THEN
    v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_inventory_acct, 'debitMinor', v_total_cogs_reversal, 'creditMinor', 0, 'memo', 'Restocked Inventory');
    v_journal_lines := v_journal_lines || jsonb_build_object('ledgerAccountId', v_cogs_acct, 'debitMinor', 0, 'creditMinor', v_total_cogs_reversal, 'memo', 'COGS Reversal');
  END IF;

  PERFORM public.post_financial_entry(jsonb_build_object(
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
  ));

  RETURN jsonb_build_object('id', v_refund_id, 'status', 'success');
END;
$$;
