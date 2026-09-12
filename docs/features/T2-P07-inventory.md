# T2-P07 — Inventory & Stock Movement

## Overview
This feature implements the canonical inventory ledger and stock movement system for NNOO. It introduces exact quantity tracking, exact minor-unit inventory valuation based on a perpetual moving weighted-average cost model, and stock acquisition processes (purchases and accounts payable). It also integrates inventory checking and COGS allocation into the existing Sales and Refunds workflows.

## Objectives
1. **Inventory Positions & Movements:** Create immutable inventory movements that deterministically update a derived inventory position (Quantity on Hand and Inventory Value) for tracked products.
2. **Stock Purchasing & Receipts:** Allow businesses to acquire stock from Suppliers, properly updating Inventory Asset and Accounts Payable / Cash, without conflating stock purchases with operating expenses.
3. **Sales & COGS Integration:** Update the Sale and Refund processes to lock inventory positions, ensure sufficient stock, allocate COGS from the moving average, and post exactly balancing journal entries (Debit COGS, Credit Inventory Asset).
4. **Manual Adjustments:** Support explicit manual stock adjustments (increases/decreases) with dedicated system ledger accounts for shrinkage/gains.
5. **Exact Arithmetic:** Use strictly deterministic minor-unit money and precise numeric quantities.
6. **Robust Permissions & RLS:** Maintain strict tenant isolation, restricting inventory modifications to authorized roles via RLS and security-definer RPCs.

## Database Schema Extensions

### 1. New System Ledger Accounts
- `inventory_adjustment_gain` (revenue/gain)
- `inventory_shrinkage_loss` (expense)

### 2. Inventory Positions
- `inventory_positions`
  - `id` (UUID)
  - `business_id` (UUID)
  - `catalog_item_id` (UUID)
  - `status` ('pending_initialization', 'initialized')
  - `quantity_on_hand` (Numeric, >= 0)
  - `inventory_value_minor` (BigInt, >= 0)

### 3. Inventory Movements
- `inventory_movements`
  - `id` (UUID)
  - `business_id` (UUID)
  - `catalog_item_id` (UUID)
  - `movement_type` ('opening_stock', 'purchase_receipt', 'sale_issue', 'sale_refund_return', 'adjustment_increase', 'adjustment_decrease')
  - `quantity_delta` (Numeric)
  - `inventory_value_delta_minor` (BigInt)
  - `source_event_type` (String)
  - `source_event_id` (String)
  - `source_line_id` (UUID nullable)
  - `occurred_at` (Timestamp)
  - `idempotency_key` (String)

### 4. Stock Receipts
- `stock_receipts`
  - `id` (UUID)
  - `business_id` (UUID)
  - `receipt_number` (String)
  - `supplier_id` (UUID)
  - `currency_code` (String)
  - `total_minor` (BigInt)
  - `payment_status` ('unpaid', 'partially_paid', 'paid')
  - `status` ('posted', 'reversed')
- `stock_receipt_items`
  - `stock_receipt_id` (UUID)
  - `catalog_item_id` (UUID)
  - `quantity` (Numeric)
  - `unit_cost_minor` (BigInt)
- `stock_receipt_payments`
  - Tracks payments made against the stock receipt.

## RPC Functions
- `initialize_inventory`: Set opening stock and cost for a tracked product.
- `create_stock_receipt`: Atomically insert receipt, items, initial payments, inventory movements, position updates, and journal entries.
- `record_stock_receipt_payment`: Pay off outstanding Accounts Payable for stock.
- `adjust_inventory`: Atomically create adjustment movements and journal entries for shrinkage/gains.
- **Updated `create_sale`**: Atomically lock positions, deduct stock, calculate COGS, and post inventory cost journals alongside revenue journals.
- **Updated `create_sale_refund`**: Atomically restock returned items, reverse COGS, and update positions alongside revenue refunds.

## User Interface Requirements
- **Inventory Dashboard**: Display current stock levels, low-stock indicators, and initialization statuses.
- **Initialization UI**: Provide a clear interface to initialize stock for tracking-enabled products.
- **Stock Receipts**: A robust form to receive stock from Suppliers.
- **Sales & Refunds**: Enhance existing UI to allow refunding to stock (restock toggle).

## Acceptance Criteria
- [ ] System strictly forbids negative stock.
- [ ] COGS dynamically calculates using moving weighted average, leaving exactly `0` value when quantity reaches `0`.
- [ ] Stock purchases debit Inventory Asset and credit AP/Cash, remaining distinct from Operating Expenses.
- [ ] All mutations are governed by Idempotency Keys and Row-Level Security.
- [ ] Inventory initialization enforces proper Opening Balance Equity offset without corrupting Sales Revenue.
