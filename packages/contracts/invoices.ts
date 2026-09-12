export type InvoiceStatus = 'draft' | 'issued' | 'voided' | 'discarded';

export type Invoice = {
  id: string;
  business_id: string;
  customer_id: string;
  sale_id: string | null;
  invoice_number: string | null;
  document_status: InvoiceStatus;
  currency_code: string;
  subtotal_minor: number;
  discount_total_minor: number;
  total_minor: number;
  issue_date: string | null;
  due_date: string | null;
  notes: string | null;
  customer_snapshot: any | null;
  business_snapshot: any | null;
  snapshot_version: number | null;
  created_by_user_id: string | null;
  issued_by_user_id: string | null;
  issued_at: string | null;
  voided_at: string | null;
  voided_by_user_id: string | null;
  void_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type InvoiceLine = {
  id: string;
  business_id: string;
  invoice_id: string;
  catalog_item_id: string | null;
  sale_item_id: string | null;
  item_type_snapshot: string;
  item_name_snapshot: string;
  sku_snapshot: string | null;
  unit_code_snapshot: string;
  track_inventory_snapshot: boolean;
  quantity: number;
  unit_price_minor: number;
  discount_minor: number;
  line_total_minor: number;
  line_order: number;
  created_at: string;
};

export type Receipt = {
  id: string;
  business_id: string;
  sale_id: string;
  sale_payment_id: string;
  receipt_number: string;
  currency_code: string;
  amount_minor: number;
  payment_method_snapshot: string;
  payment_reference_snapshot: string | null;
  payment_occurred_at: string;
  customer_snapshot: any | null;
  business_snapshot: any | null;
  sale_number_snapshot: string;
  invoice_number_snapshot: string | null;
  balance_after_payment_minor: number;
  snapshot_version: number | null;
  created_at: string;
};

export interface InvoiceWithLines extends Invoice {
  lines: InvoiceLine[];
}

export interface InvoiceCustomerSnapshot {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  country_code: string | null;
}

export interface InvoiceBusinessSnapshot {
  id: string;
  name: string;
  legal_name: string | null;
  email: string | null;
  phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  country_code: string;
  registration_number: string | null;
  tax_identifier: string | null;
  logo_path: string | null;
}
