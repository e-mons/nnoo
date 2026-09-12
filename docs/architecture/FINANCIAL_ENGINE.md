# NNOO — Financial Engine & Double-Entry Accounting Guide

Document ID: `FIN-ENG-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Financial Engine Architecture**

---

## 1. Core Financial Principles

NNOO’s financial engine powers accurate, tamper-evident, and auditable accounting for African businesses. It operates under four inviolable principles:

1. **Exact Integer Arithmetic:** All monetary amounts are stored and computed in minor currency units (e.g. Kobo for Nigerian Naira: ₦1,500.00 is stored as integer `150000`). Floating-point arithmetic is strictly prohibited in financial calculations.
2. **Double-Entry General Ledger:** Every economic event (sale, payment, refund, stock receipt, expense) automatically creates balanced debit and credit entries in `journal_entries` and `journal_lines`.
3. **The Balance Sheet Invariant:** At all times and across all businesses:
   $$\sum \text{Debits} \equiv \sum \text{Credits} \quad (\Delta 0 \text{ discrepancy})$$
4. **Permanent Immutability via Reversals:** In accordance with statutory accounting standards, historical transaction records are **NEVER** deleted. Adjustments and refunds post compensating reversal entries.

---

## 2. Standard Chart of Accounts (COA)

Every NNOO business operates on a standardized, automated Chart of Accounts:

| Account Code | Account Name | Type | Normal Balance | Description |
|---|---|---|---|---|
| `1010` | **Cash & Bank** | Asset | Debit | Physical cash and operational bank balances |
| `1020` | **Accounts Receivable (AR)** | Asset | Debit | Money owed by customers for credit sales |
| `1030` | **Inventory Asset** | Asset | Debit | Valuation of physical goods on hand at cost |
| `2010` | **Accounts Payable (AP)** | Liability | Credit | Money owed to suppliers for unpaid expenses/stock |
| `3010` | **Owner's Equity** | Equity | Credit | Initial business capital and retained earnings |
| `4010` | **Sales Revenue** | Revenue | Credit | Gross proceeds earned from product/service sales |
| `4020` | **Sales Returns & Allowances**| Contra-Revenue| Debit | Refunds issued to customers for returned goods |
| `5010` | **Cost of Goods Sold (COGS)** | Expense | Debit | Direct cost of inventory sold during the period |
| `6010–6090` | **Operating Expenses** | Expense | Debit | Utilities, Rent, Fuel, Salaries, Logistics, etc. |

---

## 3. Automated Transaction Journal Postings

### 3.1 Initial Stock Receipt (Opening Inventory)
*Example: Received 100 units @ ₦1,000 unit cost = ₦100,000 total.*
- **Debit:** `1030 — Inventory Asset` (₦100,000)
- **Credit:** `3010 — Owner's Equity` or `2010 — Accounts Payable` (₦100,000)

### 3.2 Product Sale (Cash Sale)
*Example: Sold 20 units @ ₦1,500 = ₦30,000 revenue. Cost was 20 × ₦1,000 = ₦20,000 COGS.*
- **Debit:** `1010 — Cash & Bank` (₦30,000)
- **Credit:** `4010 — Sales Revenue` (₦30,000)
- **Debit:** `5010 — Cost of Goods Sold` (₦20,000)
- **Credit:** `1030 — Inventory Asset` (₦20,000)

### 3.3 Customer Payment on Credit Sale
*Example: Customer pays ₦30,000 owed on credit sale.*
- **Debit:** `1010 — Cash & Bank` (₦30,000)
- **Credit:** `1020 — Accounts Receivable` (₦30,000)

### 3.4 Customer Refund with Inventory Restock
*Example: Refunded 5 units of above sale (₦7,500 revenue refunded; ₦5,000 inventory restored).*
- **Debit:** `4020 — Sales Returns & Allowances` (₦7,500)
- **Credit:** `1010 — Cash & Bank` (₦7,500)
- **Debit:** `1030 — Inventory Asset` (₦5,000)
- **Credit:** `5010 — Cost of Goods Sold` (₦5,000)

### 3.5 Operating Expense (Unpaid Supplier Expense)
*Example: Recorded ₦50,000 unpaid store expense.*
- **Debit:** `6010 — Operating Expenses` (₦50,000)
- **Credit:** `2010 — Accounts Payable` (₦50,000)

### 3.6 AP Settlement Payment
*Example: Paid ₦50,000 to settle supplier liability.*
- **Debit:** `2010 — Accounts Payable` (₦50,000)
- **Credit:** `1010 — Cash & Bank` (₦50,000)

---

## 4. Weighted-Average Inventory Costing

When new stock is received at a different cost, the system automatically recalculates the moving weighted-average unit cost:

$$\text{New Unit Cost} = \frac{(\text{Current Qty} \times \text{Current Unit Cost}) + (\text{Received Qty} \times \text{Received Unit Cost})}{\text{Current Qty} + \text{Received Qty}}$$

*Example:*
- Current stock: 80 units @ ₦1,000 = ₦80,000 valuation.
- New receipt: 40 units @ ₦1,300 = ₦52,000 valuation.
- Total stock: 120 units; Total value: ₦132,000.
- Updated Unit Cost: $\frac{₦132,000}{120} = \text{₦1,100.00}$.

---

## 5. Dashboard & Analytics Truth

- **Derived Values Only:** Dashboard metrics (Gross Revenue, Net Profit, Inventory Value) are calculated dynamically from transactional source records.
- **No Manual Patching:** If a dashboard figure is queried, the operator must never manually alter aggregate tables. Any correction requires identifying and posting canonical compensating transaction records.
