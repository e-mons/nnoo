# T2-P06 — Expenses & Business Spending

## 1. Feature Description
Provides a complete operational workflow for recording and managing ordinary business expenses. This includes organizing expenses by category, tracking payable amounts to suppliers, recording expense payments, handling evidence (receipts), and ensuring strict adherence to the exact money double-entry journal architecture.

**Note:** This does not include Inventory purchases, Cost of Goods Sold, tax reporting, or payroll.

## 2. Architecture & Data Model

### `expense_categories`
- `id` (UUID)
- `business_id` (UUID)
- `name` (text)
- `system_key` (text, nullable)
- `status` ('active', 'archived')

### `expenses`
- `id` (UUID)
- `business_id` (UUID)
- `expense_number` (text, from `business_sequences`)
- `category_id` (UUID)
- `supplier_id` (UUID, nullable - required if not fully paid at creation)
- `currency_code` (text, business currency)
- `total_minor` (bigint, > 0)
- `occurred_at` (timestamptz)
- `effective_date` (date)
- `due_date` (date, nullable)
- `description` (text)
- `external_reference` (text, nullable)
- `notes` (text, nullable)
- `receipt_path` (text, nullable)
- `status` ('posted', 'reversed')
- `created_by_user_id` (UUID)
- `reversed_by_user_id` (UUID, nullable)
- `reversal_reason` (text, nullable)
- `reversed_at` (timestamptz, nullable)

### `expense_payments`
- `id` (UUID)
- `business_id` (UUID)
- `expense_id` (UUID)
- `amount_minor` (bigint)
- `payment_method` (text)
- `currency_code` (text)
- `external_reference` (text, nullable)
- `occurred_at` (timestamptz)
- `effective_date` (date)
- `paid_by_user_id` (UUID)
- `idempotency_key` (text, unique)

## 3. Core Capabilities & Journal Effects

### A. Fully Paid Expense (Walk-Up)
No supplier required.
- Dr: Operating Expense
- Cr: Cash & Cash Equivalents

### B. Unpaid Expense (Credit)
Supplier required.
- Dr: Operating Expense
- Cr: Accounts Payable

### C. Partially Paid Expense
Supplier required.
- Dr: Operating Expense
- Cr: Cash & Cash Equivalents (for paid portion)
- Cr: Accounts Payable (for remaining portion)

### D. Record Later Payment
Against an existing open expense payable.
- Dr: Accounts Payable
- Cr: Cash & Cash Equivalents

### E. Expense Correction (Reversal)
Reverses the original expense and all associated payments.
Example (Fully Paid Reversal):
- Dr: Cash & Cash Equivalents
- Cr: Operating Expense

## 4. Supabase RPCs (Atomic Posting)
1. `create_expense`: Creates expense and initial payments, validates supplier requirement, posts journal entries.
2. `record_expense_payment`: Validates outstanding balance, records payment, posts AP settlement.
3. `reverse_expense`: Fully reverses an expense and its payments using the `reversal_of_entry_id` mechanism.
4. `provision_default_expense_categories`: A trigger/RPC that idempotently adds standard expense categories on business creation.

## 5. Next.js Web UI
- `/app/[businessSlug]/expenses`: Dashboard view with status badges (paid, unpaid, partial, reversed).
- `/app/[businessSlug]/expenses/new`: Form to create a new expense, attach a receipt, and allocate initial payments.
- `/app/[businessSlug]/expenses/[expenseId]`: Detailed view. Includes ability to 'Record Payment' and 'Reverse Expense', plus download/view the receipt.

## 6. Security, RLS & Storage
- Strict `business_id` RLS on all new tables.
- Evidence attachments stored in `businesses/{business_id}/expenses/{expense_id}/` in a private Supabase Storage bucket. Access requires valid signed URLs or authenticated proxy.
- Validation of exact money (`numeric`, `bigint`), ensuring totals cannot be forged or mismatched with journal postings.
