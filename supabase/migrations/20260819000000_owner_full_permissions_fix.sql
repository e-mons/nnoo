-- Upgraded has_business_role function ensuring business owners and business admins have universal permissions across all business modules
CREATE OR REPLACE FUNCTION public.has_business_role(
  business_id uuid,
  allowed_roles text[]
) RETURNS boolean AS $$
DECLARE
  v_biz_id ALIAS FOR business_id;
  v_roles ALIAS FOR allowed_roles;
  v_uid uuid;
  v_is_platform_admin boolean;
  v_membership_role text;
  v_membership_status text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  -- 1. Platform Super Admin Check
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins pa
    WHERE pa.user_id = v_uid
    AND pa.status = 'active'
  ) INTO v_is_platform_admin;

  IF v_is_platform_admin THEN
    RETURN true;
  END IF;

  -- 2. Business Membership Lookup
  SELECT lower(trim(bm.role)), lower(trim(COALESCE(bm.membership_status, 'active')))
  INTO v_membership_role, v_membership_status
  FROM public.business_memberships bm
  WHERE bm.business_id = v_biz_id
  AND bm.user_id = v_uid;

  IF v_membership_role IS NULL THEN
    RETURN false;
  END IF;

  -- Must be an active member
  IF v_membership_status NOT IN ('active') THEN
    RETURN false;
  END IF;

  -- 3. Business Owners & Business Admins have FULL permissions for everything
  IF v_membership_role IN ('owner', 'business_admin') THEN
    RETURN true;
  END IF;

  -- 4. Check if role is in the allowed_roles list (case-insensitive)
  RETURN EXISTS (
    SELECT 1 FROM unnest(v_roles) r
    WHERE lower(trim(r)) = v_membership_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Text overload for flexible RLS evaluations
CREATE OR REPLACE FUNCTION public.has_business_role(
  business_id text,
  allowed_roles text[]
) RETURNS boolean AS $$
BEGIN
  BEGIN
    RETURN public.has_business_role(business_id::uuid, allowed_roles);
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Dual camelCase & snake_case support for create_sale
CREATE OR REPLACE FUNCTION public.create_sale(payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
  v_business_id := COALESCE(payload->>'businessId', payload->>'business_id')::uuid;
  v_user_id := auth.uid();
  v_customer_id := COALESCE(payload->>'customerId', payload->>'customer_id')::uuid;
  v_idempotency_key := COALESCE(payload->>'idempotencyKey', payload->>'idempotency_key');
  v_currency_code := COALESCE(payload->>'currencyCode', payload->>'currency_code');
  v_occurred_at := COALESCE((payload->>'occurredAt')::timestamptz, (payload->>'occurred_at')::timestamptz, now());
  v_effective_date := COALESCE((payload->>'effectiveDate')::date, (payload->>'effective_date')::date, CURRENT_DATE);
  v_notes := COALESCE(payload->>'notes', payload->>'notes');
  v_items := COALESCE(payload->'items', '[]'::jsonb);
  v_payments := payload->'payments';

  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'business_id is required';
  END IF;

  IF NOT public.has_business_role(v_business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff']) THEN
    RAISE EXCEPTION 'Not authorized to create sales.';
  END IF;

  IF v_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_sale_id FROM public.sales WHERE business_id = v_business_id AND idempotency_key = v_idempotency_key;
    IF v_existing_sale_id IS NOT NULL THEN
      RETURN jsonb_build_object('id', v_existing_sale_id, 'status', 'idempotent_success');
    END IF;
  ELSE
    v_idempotency_key := gen_random_uuid()::text;
  END IF;

  IF jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'Sale must have at least one item.';
  END IF;

  v_sale_number := public.next_business_sequence(v_business_id, 'SAL-');

  INSERT INTO public.sales (
    business_id, sale_number, customer_id, currency_code, subtotal_minor, discount_total_minor, total_minor,
    occurred_at, effective_date, notes, created_by_user_id, idempotency_key
  ) VALUES (
    v_business_id, v_sale_number, v_customer_id, v_currency_code, 0, 0, 0,
    v_occurred_at, v_effective_date, v_notes, v_user_id, v_idempotency_key
  ) RETURNING id INTO v_sale_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(v_items) AS items(value) ORDER BY value->>'catalogItemId' LOOP
    v_catalog_item_id := COALESCE(v_item->>'catalogItemId', v_item->>'catalog_item_id')::uuid;
    v_line_quantity := COALESCE((v_item->>'quantity')::numeric(14,6), 1);
    v_line_discount := COALESCE((v_item->>'discountMinor')::bigint, (v_item->>'discount_minor')::bigint, 0);

    IF v_line_quantity <= 0 THEN
      RAISE EXCEPTION 'Item quantity must be greater than 0.';
    END IF;

    SELECT * INTO v_cat_record FROM public.catalog_items WHERE id = v_catalog_item_id AND business_id = v_business_id;
    IF NOT FOUND OR v_cat_record.status != 'active' THEN
      RAISE EXCEPTION 'Catalog item missing or inactive.';
    END IF;

    IF v_currency_code IS NULL THEN
      v_currency_code := v_cat_record.currency_code;
    ELSIF v_cat_record.currency_code != v_currency_code THEN
      RAISE EXCEPTION 'Currency mismatch on item.';
    END IF;

    v_line_unit_price := v_cat_record.selling_price_minor;
    v_line_gross := round(v_line_unit_price * v_line_quantity);

    IF v_line_discount > v_line_gross THEN
      RAISE EXCEPTION 'Discount cannot exceed line gross amount.';
    END IF;

    v_line_total := v_line_gross - v_line_discount;
    v_subtotal_minor := v_subtotal_minor + v_line_gross;
    v_discount_total_minor := v_discount_total_minor + v_line_discount;
    v_total_minor := v_total_minor + v_line_total;

    INSERT INTO public.sale_items (
      business_id, sale_id, catalog_item_id, item_type_snapshot, item_name_snapshot,
      sku_snapshot, unit_code_snapshot, track_inventory_snapshot, quantity,
      unit_price_minor, discount_minor, line_total_minor, line_order
    ) VALUES (
      v_business_id, v_sale_id, v_catalog_item_id, v_cat_record.item_type, v_cat_record.name,
      v_cat_record.sku, v_cat_record.unit_code, v_cat_record.track_inventory, v_line_quantity,
      v_line_unit_price, v_line_discount, v_line_total, v_line_order
    ) RETURNING id INTO v_sale_item_id;

    -- Inventory handling
    IF v_cat_record.track_inventory = true AND v_cat_record.item_type = 'product' THEN
      SELECT * INTO v_position_record FROM public.inventory_positions
      WHERE business_id = v_business_id AND catalog_item_id = v_catalog_item_id FOR UPDATE;

      IF NOT FOUND OR v_position_record.status != 'initialized' THEN
        RAISE EXCEPTION 'Product % is not initialized for inventory. Initialize it before selling.', v_cat_record.name;
      END IF;

      IF v_position_record.quantity_on_hand < v_line_quantity THEN
        RAISE EXCEPTION 'Insufficient stock for product %. Available: %', v_cat_record.name, v_position_record.quantity_on_hand;
      END IF;

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
        business_id, catalog_item_id, movement_type, quantity_delta,
        inventory_value_delta_minor, unit_code_snapshot, source_event_type,
        source_event_id, source_line_id, occurred_at, created_by_user_id, idempotency_key
      ) VALUES (
        v_business_id, v_catalog_item_id, 'sale_issue', -v_line_quantity,
        -v_line_cogs, v_cat_record.unit_code, 'sale', v_sale_id::text,
        v_sale_item_id, v_occurred_at, v_user_id, v_idempotency_key || '_issue_' || v_line_order
      );

      v_cogs_minor := v_cogs_minor + v_line_cogs;
    END IF;

    v_line_order := v_line_order + 1;
  END LOOP;

  -- Payment processing
  IF v_payments IS NOT NULL THEN
    FOR v_payment IN SELECT * FROM jsonb_array_elements(v_payments) LOOP
      v_total_paid_minor := v_total_paid_minor + COALESCE((v_payment->>'amountMinor')::bigint, (v_payment->>'amount_minor')::bigint);

      INSERT INTO public.sale_payments (
        business_id, sale_id, amount_minor, currency_code, payment_method,
        reference, occurred_at, effective_date, received_by_user_id, idempotency_key
      ) VALUES (
        v_business_id, v_sale_id,
        COALESCE((v_payment->>'amountMinor')::bigint, (v_payment->>'amount_minor')::bigint),
        v_currency_code,
        COALESCE(v_payment->>'paymentMethod', v_payment->>'payment_method')::public.payment_method,
        COALESCE(v_payment->>'reference', v_payment->>'reference'),
        v_occurred_at, v_effective_date, v_user_id,
        v_idempotency_key || '_pay_' || COALESCE(v_payment->>'paymentMethod', v_payment->>'payment_method', 'pay') || '_' || v_total_paid_minor
      );
    END LOOP;
  END IF;

  IF v_total_paid_minor > v_total_minor THEN
    RAISE EXCEPTION 'Payments cannot exceed sale total.';
  END IF;

  IF v_total_paid_minor < v_total_minor AND v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer required for outstanding balance.';
  END IF;

  UPDATE public.sales
  SET subtotal_minor = v_subtotal_minor,
      discount_total_minor = v_discount_total_minor,
      total_minor = v_total_minor,
      currency_code = v_currency_code
  WHERE id = v_sale_id;

  PERFORM public.update_sale_statuses(v_sale_id);

  -- Accounting
  SELECT id INTO v_cash_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'cash_and_cash_equivalents';
  SELECT id INTO v_ar_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'accounts_receivable';
  SELECT id INTO v_revenue_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'sales_revenue';
  SELECT id INTO v_cogs_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'cost_of_goods_sold';
  SELECT id INTO v_inventory_acct FROM public.ledger_accounts WHERE business_id = v_business_id AND system_key = 'inventory_asset';

  v_journal_lines := '[]'::jsonb;
  v_journal_lines := v_journal_lines || jsonb_build_object(
    'ledgerAccountId', v_revenue_acct,
    'debitMinor', 0,
    'creditMinor', v_total_minor,
    'memo', 'Sale Revenue'
  );

  IF v_total_paid_minor > 0 THEN
    v_journal_lines := v_journal_lines || jsonb_build_object(
      'ledgerAccountId', v_cash_acct,
      'debitMinor', v_total_paid_minor,
      'creditMinor', 0,
      'memo', 'Payment Received'
    );
  END IF;

  IF v_total_minor - v_total_paid_minor > 0 THEN
    v_journal_lines := v_journal_lines || jsonb_build_object(
      'ledgerAccountId', v_ar_acct,
      'debitMinor', v_total_minor - v_total_paid_minor,
      'creditMinor', 0,
      'memo', 'Outstanding Balance'
    );
  END IF;

  IF v_cogs_minor > 0 THEN
    v_journal_lines := v_journal_lines || jsonb_build_object(
      'ledgerAccountId', v_cogs_acct,
      'debitMinor', v_cogs_minor,
      'creditMinor', 0,
      'memo', 'Cost of Goods Sold'
    );
    v_journal_lines := v_journal_lines || jsonb_build_object(
      'ledgerAccountId', v_inventory_acct,
      'debitMinor', 0,
      'creditMinor', v_cogs_minor,
      'memo', 'Inventory Depletion'
    );
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

-- Database-driven issue_invoice
CREATE OR REPLACE FUNCTION public.issue_invoice(payload jsonb)
RETURNS uuid AS $$
DECLARE
  v_invoice_id uuid;
  v_invoice record;
  v_invoice_number text;
  v_sale_result jsonb;
  v_sale_id uuid;
  v_user_id uuid;
  v_effective_date date;
  v_items_json jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  v_invoice_id := COALESCE(payload->>'invoice_id', payload->>'invoiceId')::uuid;
  
  -- Lock Invoice
  SELECT * INTO v_invoice FROM public.invoices WHERE id = v_invoice_id AND document_status = 'draft' FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draft invoice not found or already issued';
  END IF;

  IF NOT public.has_business_role(v_invoice.business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff']) THEN
    RAISE EXCEPTION 'Not authorized to issue invoices.';
  END IF;

  v_effective_date := COALESCE((payload->>'effective_date')::date, (payload->>'effectiveDate')::date, CURRENT_DATE);

  -- Assemble line items from database invoice lines
  SELECT jsonb_agg(jsonb_build_object(
    'catalogItemId', il.catalog_item_id,
    'quantity', il.quantity,
    'discountMinor', il.discount_minor
  )) INTO v_items_json
  FROM public.invoice_lines il
  WHERE il.invoice_id = v_invoice_id;

  -- Create underlying Sale record
  v_sale_result := public.create_sale(jsonb_build_object(
    'businessId', v_invoice.business_id,
    'customerId', v_invoice.customer_id,
    'currencyCode', v_invoice.currency_code,
    'effectiveDate', v_effective_date::text,
    'notes', v_invoice.notes,
    'idempotencyKey', COALESCE(payload->>'idempotency_key', payload->>'idempotencyKey', gen_random_uuid()::text),
    'items', v_items_json
  ));

  v_sale_id := (v_sale_result->>'id')::uuid;

  IF v_sale_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create underlying sale: %', v_sale_result;
  END IF;

  -- Generate Invoice Number
  v_invoice_number := public.next_business_sequence(v_invoice.business_id, 'INV-');

  -- Update Invoice
  UPDATE public.invoices SET
    document_status = 'issued',
    sale_id = v_sale_id,
    invoice_number = v_invoice_number,
    issue_date = v_effective_date,
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
    customer_snapshot = (SELECT to_jsonb(c) FROM public.customers c WHERE c.id = v_invoice.customer_id),
    business_snapshot = (SELECT to_jsonb(b) FROM public.businesses b WHERE b.id = v_invoice.business_id)
  WHERE id = v_invoice_id;

  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
