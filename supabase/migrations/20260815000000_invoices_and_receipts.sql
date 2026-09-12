-- ==============================================================================
-- Migration: Invoices, Receipts & Payment Status
-- Description: Business document layer mapped to canonical sales.
-- ==============================================================================

CREATE TYPE public.invoice_status AS ENUM ('draft', 'issued', 'voided', 'discarded');

-- 1. Invoices Table
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  sale_id uuid REFERENCES public.sales(id) ON DELETE RESTRICT,
  invoice_number text,
  document_status public.invoice_status NOT NULL DEFAULT 'draft',
  currency_code text NOT NULL,
  subtotal_minor bigint NOT NULL CHECK (subtotal_minor >= 0),
  discount_total_minor bigint NOT NULL DEFAULT 0 CHECK (discount_total_minor >= 0),
  total_minor bigint NOT NULL CHECK (total_minor >= 0),
  issue_date date,
  due_date date,
  notes text,
  customer_snapshot jsonb,
  business_snapshot jsonb,
  snapshot_version integer DEFAULT 1,
  created_by_user_id uuid REFERENCES auth.users(id),
  issued_by_user_id uuid REFERENCES auth.users(id),
  issued_at timestamptz,
  voided_at timestamptz,
  voided_by_user_id uuid REFERENCES auth.users(id),
  void_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, invoice_number)
);

-- 2. Invoice Lines Table
CREATE TABLE public.invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  catalog_item_id uuid REFERENCES public.catalog_items(id) ON DELETE RESTRICT,
  sale_item_id uuid REFERENCES public.sale_items(id) ON DELETE RESTRICT,
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

-- 3. Receipts Table
CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  sale_payment_id uuid NOT NULL REFERENCES public.sale_payments(id) ON DELETE CASCADE,
  receipt_number text NOT NULL,
  currency_code text NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  payment_method_snapshot text NOT NULL,
  payment_reference_snapshot text,
  payment_occurred_at timestamptz NOT NULL,
  customer_snapshot jsonb,
  business_snapshot jsonb NOT NULL,
  sale_number_snapshot text NOT NULL,
  invoice_number_snapshot text,
  balance_after_payment_minor bigint NOT NULL CHECK (balance_after_payment_minor >= 0),
  snapshot_version integer DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, receipt_number),
  UNIQUE(sale_payment_id)
);

-- 4. Indexes
CREATE INDEX idx_invoices_business_customer ON public.invoices(business_id, customer_id);
CREATE INDEX idx_invoices_sale_id ON public.invoices(sale_id);
CREATE INDEX idx_invoice_lines_invoice_id ON public.invoice_lines(invoice_id);
CREATE INDEX idx_receipts_sale_id ON public.receipts(sale_id);
CREATE INDEX idx_receipts_payment_id ON public.receipts(sale_payment_id);

-- 5. Row Level Security
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View business invoices" ON public.invoices FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff', 'accountant']));
CREATE POLICY "Insert business invoices" ON public.invoices FOR INSERT WITH CHECK (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff']));
CREATE POLICY "Update business invoices" ON public.invoices FOR UPDATE USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff']));
CREATE POLICY "Delete business invoices" ON public.invoices FOR DELETE USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff']));

CREATE POLICY "View invoice lines" ON public.invoice_lines FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff', 'accountant']));
CREATE POLICY "Insert invoice lines" ON public.invoice_lines FOR INSERT WITH CHECK (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff']));
CREATE POLICY "Update invoice lines" ON public.invoice_lines FOR UPDATE USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff']));
CREATE POLICY "Delete invoice lines" ON public.invoice_lines FOR DELETE USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff']));

CREATE POLICY "View business receipts" ON public.receipts FOR SELECT USING (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff', 'accountant']));
CREATE POLICY "Insert business receipts" ON public.receipts FOR INSERT WITH CHECK (public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff']));

-- 6. Trigger for Receipts

CREATE OR REPLACE FUNCTION public.generate_receipt_for_payment(p_payment_id uuid)
RETURNS void AS $$
DECLARE
  v_payment record;
  v_receipt_number text;
  v_balance bigint;
  v_business jsonb;
  v_customer jsonb;
  v_sale record;
  v_invoice_number text;
BEGIN
  SELECT * INTO v_payment FROM public.sale_payments WHERE id = p_payment_id;
  
  IF v_payment IS NULL THEN RETURN; END IF;

  -- Get Sale
  SELECT sale_number, total_minor INTO v_sale FROM public.sales WHERE id = v_payment.sale_id;

  -- Calculate Balance
  SELECT (v_sale.total_minor - COALESCE(SUM(amount_minor), 0))
  INTO v_balance
  FROM public.sale_payments
  WHERE sale_id = v_payment.sale_id
    AND (occurred_at < v_payment.occurred_at OR (occurred_at = v_payment.occurred_at AND created_at < v_payment.created_at) OR (occurred_at = v_payment.occurred_at AND created_at = v_payment.created_at AND id <= v_payment.id));

  -- Get Business Snapshot
  SELECT to_jsonb(b) INTO v_business FROM public.businesses b WHERE id = v_payment.business_id;
  
  -- Get Customer Snapshot (if exists)
  SELECT to_jsonb(c) INTO v_customer 
  FROM public.sales s
  JOIN public.customers c ON c.id = s.customer_id
  WHERE s.id = v_payment.sale_id;

  -- Get Invoice Number (if exists)
  SELECT invoice_number INTO v_invoice_number
  FROM public.invoices
  WHERE sale_id = v_payment.sale_id AND document_status = 'issued'
  LIMIT 1;

  -- Generate Receipt Number
  v_receipt_number := public.next_business_sequence(v_payment.business_id, 'RCT-');

  INSERT INTO public.receipts (
    business_id, sale_id, sale_payment_id, receipt_number, currency_code,
    amount_minor, payment_method_snapshot, payment_reference_snapshot, payment_occurred_at,
    customer_snapshot, business_snapshot, sale_number_snapshot, invoice_number_snapshot,
    balance_after_payment_minor
  ) VALUES (
    v_payment.business_id, v_payment.sale_id, v_payment.id, v_receipt_number, v_payment.currency_code,
    v_payment.amount_minor, v_payment.payment_method::text, v_payment.reference, v_payment.occurred_at,
    v_customer, v_business, v_sale.sale_number, v_invoice_number,
    GREATEST(v_balance, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.trg_generate_receipt()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.generate_receipt_for_payment(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_receipt_on_payment
AFTER INSERT ON public.sale_payments
FOR EACH ROW
EXECUTE FUNCTION public.trg_generate_receipt();

-- Backfill
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN SELECT id FROM public.sale_payments ORDER BY occurred_at ASC, created_at ASC
  LOOP
    PERFORM public.generate_receipt_for_payment(rec.id);
  END LOOP;
END;
$$;

-- 7. Draft Invoice RPC
CREATE OR REPLACE FUNCTION public.save_invoice_draft(payload jsonb)
RETURNS uuid AS $$
DECLARE
  v_invoice_id uuid;
  v_user_id uuid;
  v_business_id uuid;
  v_customer_id uuid;
  v_subtotal bigint;
  v_discount bigint;
  v_total bigint;
  v_currency text;
  v_notes text;
  v_due_date date;
  v_line jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  v_business_id := (payload->>'business_id')::uuid;
  v_customer_id := (payload->>'customer_id')::uuid;
  v_subtotal := (payload->>'subtotal_minor')::bigint;
  v_discount := COALESCE((payload->>'discount_total_minor')::bigint, 0);
  v_total := (payload->>'total_minor')::bigint;
  v_currency := payload->>'currency_code';
  v_notes := payload->>'notes';
  v_due_date := (payload->>'due_date')::date;

  v_invoice_id := (payload->>'id')::uuid;

  IF NOT public.has_business_role(v_business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff']) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_invoice_id IS NOT NULL THEN
    -- Verify existing is draft
    IF NOT EXISTS (SELECT 1 FROM public.invoices WHERE id = v_invoice_id AND document_status = 'draft') THEN
      RAISE EXCEPTION 'Can only update draft invoices';
    END IF;

    UPDATE public.invoices SET
      customer_id = v_customer_id,
      subtotal_minor = v_subtotal,
      discount_total_minor = v_discount,
      total_minor = v_total,
      currency_code = v_currency,
      notes = v_notes,
      due_date = v_due_date,
      updated_at = now()
    WHERE id = v_invoice_id;

    DELETE FROM public.invoice_lines WHERE invoice_id = v_invoice_id;
  ELSE
    INSERT INTO public.invoices (
      business_id, customer_id, currency_code, subtotal_minor, discount_total_minor, total_minor,
      due_date, notes, created_by_user_id
    ) VALUES (
      v_business_id, v_customer_id, v_currency, v_subtotal, v_discount, v_total,
      v_due_date, v_notes, v_user_id
    ) RETURNING id INTO v_invoice_id;
  END IF;

  FOR v_line IN SELECT * FROM jsonb_array_elements(payload->'items')
  LOOP
    INSERT INTO public.invoice_lines (
      business_id, invoice_id, catalog_item_id, item_type_snapshot, item_name_snapshot,
      sku_snapshot, unit_code_snapshot, track_inventory_snapshot, quantity,
      unit_price_minor, discount_minor, line_total_minor, line_order
    ) VALUES (
      v_business_id, v_invoice_id, (v_line->>'catalog_item_id')::uuid, v_line->>'item_type_snapshot',
      v_line->>'item_name_snapshot', v_line->>'sku_snapshot', v_line->>'unit_code_snapshot',
      (v_line->>'track_inventory_snapshot')::boolean, (v_line->>'quantity')::numeric,
      (v_line->>'unit_price_minor')::bigint, COALESCE((v_line->>'discount_minor')::bigint, 0),
      (v_line->>'line_total_minor')::bigint, (v_line->>'line_order')::integer
    );
  END LOOP;

  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8. Issue Invoice RPC
CREATE OR REPLACE FUNCTION public.issue_invoice(payload jsonb)
RETURNS uuid AS $$
DECLARE
  v_invoice_id uuid;
  v_business_id uuid;
  v_invoice_number text;
  v_sale_result jsonb;
  v_sale_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  v_invoice_id := (payload->>'invoice_id')::uuid;
  
  -- Lock Invoice
  SELECT business_id INTO v_business_id FROM public.invoices WHERE id = v_invoice_id AND document_status = 'draft' FOR UPDATE;
  
  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Draft invoice not found or already issued';
  END IF;

  IF NOT public.has_business_role(v_business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff']) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Create Sale
  v_sale_result := public.create_sale(payload);
  v_sale_id := (v_sale_result->>'id')::uuid;

  IF v_sale_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create sale';
  END IF;

  -- Generate Invoice Number
  v_invoice_number := public.next_business_sequence(v_business_id, 'INV-');

  -- Update Invoice
  UPDATE public.invoices SET
    document_status = 'issued',
    sale_id = v_sale_id,
    invoice_number = v_invoice_number,
    issue_date = (payload->>'effective_date')::date,
    issued_by_user_id = v_user_id,
    issued_at = now(),
    updated_at = now()
  WHERE id = v_invoice_id;
  
  UPDATE public.invoice_lines il
  SET sale_item_id = si.id
  FROM public.sale_items si
  WHERE il.invoice_id = v_invoice_id
    AND si.sale_id = v_sale_id
    AND il.line_order = si.line_order;

  -- Capture Snapshots (Customer & Business)
  UPDATE public.invoices SET
    customer_snapshot = (SELECT to_jsonb(c) FROM public.customers c WHERE c.id = (SELECT customer_id FROM public.sales WHERE id = v_sale_id)),
    business_snapshot = (SELECT to_jsonb(b) FROM public.businesses b WHERE b.id = v_business_id)
  WHERE id = v_invoice_id;

  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 9. Generate Invoice From Sale
CREATE OR REPLACE FUNCTION public.generate_invoice_from_sale(p_sale_id uuid)
RETURNS uuid AS $$
DECLARE
  v_sale record;
  v_invoice_id uuid;
  v_invoice_number text;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_sale FROM public.sales WHERE id = p_sale_id FOR UPDATE;
  
  IF v_sale IS NULL THEN
    RAISE EXCEPTION 'Sale not found';
  END IF;

  IF v_sale.customer_id IS NULL THEN
    RAISE EXCEPTION 'Cannot generate invoice for walk-in sale';
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.invoices WHERE sale_id = p_sale_id AND document_status != 'voided') THEN
    RAISE EXCEPTION 'Invoice already exists for this sale';
  END IF;

  IF NOT public.has_business_role(v_sale.business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff']) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_invoice_number := public.next_business_sequence(v_sale.business_id, 'INV-');

  INSERT INTO public.invoices (
    business_id, customer_id, sale_id, invoice_number, document_status, currency_code,
    subtotal_minor, discount_total_minor, total_minor, issue_date, due_date,
    customer_snapshot, business_snapshot, created_by_user_id, issued_by_user_id, issued_at
  ) VALUES (
    v_sale.business_id, v_sale.customer_id, v_sale.id, v_invoice_number, 'issued', v_sale.currency_code,
    v_sale.subtotal_minor, v_sale.discount_total_minor, v_sale.total_minor, v_sale.effective_date, v_sale.effective_date,
    (SELECT to_jsonb(c) FROM public.customers c WHERE c.id = v_sale.customer_id),
    (SELECT to_jsonb(b) FROM public.businesses b WHERE b.id = v_sale.business_id),
    v_user_id, v_user_id, now()
  ) RETURNING id INTO v_invoice_id;

  INSERT INTO public.invoice_lines (
    business_id, invoice_id, catalog_item_id, sale_item_id, item_type_snapshot, item_name_snapshot,
    sku_snapshot, unit_code_snapshot, track_inventory_snapshot, quantity, unit_price_minor,
    discount_minor, line_total_minor, line_order
  )
  SELECT
    v_sale.business_id, v_invoice_id, catalog_item_id, id, item_type_snapshot, item_name_snapshot,
    sku_snapshot, unit_code_snapshot, track_inventory_snapshot, quantity, unit_price_minor,
    discount_minor, line_total_minor, line_order
  FROM public.sale_items WHERE sale_id = p_sale_id;

  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 10. Void Invoice
CREATE OR REPLACE FUNCTION public.void_invoice(p_invoice_id uuid, p_reason text)
RETURNS void AS $$
DECLARE
  v_invoice record;
  v_sale record;
  v_user_id uuid;
  v_refund_payload jsonb;
  v_refund_items jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id FOR UPDATE;
  
  IF v_invoice IS NULL OR v_invoice.document_status != 'issued' THEN
    RAISE EXCEPTION 'Only issued invoices can be voided';
  END IF;

  IF NOT public.has_business_role(v_invoice.business_id, ARRAY['owner', 'business_admin', 'manager']) THEN
    RAISE EXCEPTION 'Not authorized to void invoices';
  END IF;

  SELECT * INTO v_sale FROM public.sales WHERE id = v_invoice.sale_id;

  IF v_sale.payment_status != 'unpaid' THEN
    RAISE EXCEPTION 'Cannot void invoice with existing payments. Use refund workflow instead.';
  END IF;

  IF v_sale.refund_status != 'none' THEN
    RAISE EXCEPTION 'Cannot void invoice with existing refunds.';
  END IF;

  -- Construct refund items array for full reversal
  SELECT jsonb_agg(
    jsonb_build_object(
      'sale_item_id', id,
      'quantity', quantity,
      'refund_amount_minor', line_total_minor,
      'restock', track_inventory_snapshot
    )
  ) INTO v_refund_items
  FROM public.sale_items
  WHERE sale_id = v_invoice.sale_id;

  v_refund_payload := jsonb_build_object(
    'business_id', v_invoice.business_id,
    'sale_id', v_invoice.sale_id,
    'total_minor', v_sale.total_minor,
    'receivable_reduction_minor', v_sale.total_minor,
    'cash_refund_minor', 0,
    'reason', 'correction',
    'notes', 'Voided Invoice: ' || p_reason,
    'effective_date', current_date,
    'idempotency_key', 'VOID-' || p_invoice_id,
    'items', v_refund_items
  );

  PERFORM public.create_sale_refund(v_refund_payload);
  
  UPDATE public.invoices SET
    document_status = 'voided',
    voided_at = now(),
    voided_by_user_id = v_user_id,
    void_reason = p_reason,
    updated_at = now()
  WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
