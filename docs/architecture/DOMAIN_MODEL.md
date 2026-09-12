# NNOO — Canonical Domain Model Reference

Document ID: `DOM-MODEL-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Domain Model**

---

## 1. Domain Overview & Entity Relationships

The NNOO domain model is organized into 6 core modules:
1. **Identity, Tenancy & Membership**
2. **Catalog, Counterparties & Commerce**
3. **Double-Entry General Ledger & Costing**
4. **Artificial Intelligence & Grounded Intelligence**
5. **Durable Jobs, Attention & Multi-Channel Messaging**
6. **SaaS Subscriptions & Platform Administration**

```text
┌────────────────┐       ┌────────────────────────┐       ┌────────────────┐
│   auth.users   │ ────► │  business_memberships  │ ◄──── │   businesses   │
│   (Supabase)   │       │  (role, status)        │       │   (tenant)     │
└───────┬────────┘       └────────────────────────┘       └───────┬────────┘
        │                                                         │
        ▼                                                         ▼
┌────────────────┐                                ┌───────────────────────────────┐
│    profiles    │                                │     OPERATIONAL DOMAINS       │
└────────────────┘                                │  - Products & Inventory Items │
                                                  │  - Customers & Suppliers      │
                                                  │  - Sales & Customer Payments  │
                                                  │  - Expenses & AP Liabilities  │
                                                  │  - Invoices & PDF Receipts    │
                                                  │  - Journal Entries & Lines    │
                                                  │  - AI Bookkeeper Reviews      │
                                                  │  - Health Scores & Passports  │
                                                  │  - Notifications & WhatsApp   │
                                                  └───────────────────────────────┘
```

---

## 2. Core Domain Entities

### 2.1 Identity & Tenancy
- **`Profile`**: User metadata (first name, last name, phone, avatar) linked 1-to-1 with `auth.users` by UUID.
- **`Business`**: Isolated tenant entity with legal name, slug, country, base currency (`NGN`), fiscal settings, and subscription tier.
- **`BusinessMembership`**: Relational bridge joining User and Business. Enforces RBAC roles: `owner`, `business_admin`, `manager`, `accountant`, `sales_staff`, `inventory_staff`, and `read_only`.

### 2.2 Catalog & Inventory
- **`Product`**: Commercial item or service. Attributes: name, SKU/barcode, category, description, is_tracked (boolean), selling_price (minor units), cost_price (minor units), reorder_level.
- **`InventoryMovement`**: Immutable audit record of stock quantity changes. Types: `OPENING_STOCK`, `STOCK_PURCHASE`, `SALE_DECREMENT`, `REFUND_RESTOCK`, `MANUAL_ADJUSTMENT`. Tracks quantity delta, unit cost, and total value.

### 2.3 Counterparties & Commerce
- **`Customer`**: Buyer entity with name, normalized phone number, email, address, total sales count, and outstanding Accounts Receivable balance.
- **`Supplier`**: Vendor entity with contact details, category, total purchases, and outstanding Accounts Payable liability.
- **`Sale`**: Commercial exchange record. Attributes: invoice_number, customer_id, gross_amount, discount_amount, net_amount, payment_status (`PAID`, `PARTIAL`, `UNPAID`), fulfillment_status.
- **`SaleLineItem`**: Individual product line with product_id, quantity, unit_price, line_total, and unit_cost at time of sale.
- **`CustomerPayment`**: Financial receipt recording money received against a sale or invoice. Tracks payment_method (`CASH`, `BANK_TRANSFER`, `CARD`, `POS`), reference, and amount.
- **`Refund`**: Compensating record for returned goods or cancelled sales. Links to original `Sale`, tracks refunded_amount, restock_quantity, and reason.

### 2.4 Expenses & Payables
- **`Expense`**: Operating expense or supplier bill. Attributes: category (`RENT`, `UTILITIES`, `SALARIES`, `LOGISTICS`, `MARKETING`, `OTHER`), supplier_id, amount, payment_status (`PAID`, `UNPAID`), due_date, description.
- **`Invoice`**: Formal payment request issued to customer. Attributes: invoice_number, issue_date, due_date, status (`DRAFT`, `ISSUED`, `PAID`, `OVERDUE`, `CANCELLED`), line items, total amount.

### 2.5 General Ledger & Accounting Truth
- **`JournalEntry`**: Canonical financial header. Attributes: entry_number, entry_date, description, source_type (`SALE`, `EXPENSE`, `PAYMENT`, `REFUND`, `STOCK_RECEIPT`, `AP_SETTLEMENT`), source_id.
- **`JournalLine`**: Individual debit or credit row. Attributes: journal_entry_id, account_code (`1010`–`6090`), entry_type (`DEBIT`, `CREDIT`), amount (integer minor units). Invariant: $\sum \text{Debit} = \sum \text{Credit}$.

### 2.6 Artificial Intelligence & Intelligence
- **`AIBookkeeperReview`**: Staged transaction recommendation. Attributes: raw_input_text, suggested_type, suggested_category, suggested_amount, confidence_score, status (`PENDING`, `REVIEWED`, `APPLIED`, `REJECTED`), confirmed_expense_id.
- **`BusinessHealthScoreRecord`**: Historical health score calculation. Attributes: score (0–100), profitability_score, liquidity_score, inventory_score, consistency_score, algorithm_version (`business-health-score-v1`), timestamp.
- **`CreditPassportSnapshot`**: Point-in-time financial profile. Attributes: snapshot_json, sha256_hash, generated_by_user_id, status (`ACTIVE`, `ARCHIVED`).
- **`CreditPassportShare`**: Public access token for a snapshot. Attributes: share_token, expires_at, is_revoked, access_count.

### 2.7 Jobs, Notifications & Messaging
- **`AttentionCondition`**: Detected business condition requiring human notice (e.g. `LOW_STOCK`, `OVERDUE_INVOICE`, `PENDING_REVIEW`). Attributes: condition_type, severity (`LOW`, `MEDIUM`, `HIGH`), status (`ACTIVE`, `RESOLVED`).
- **`Notification`**: User-facing inbox item. Attributes: recipient_user_id, business_id, title, body, action_url, is_read, channel_dispatches (`IN_APP`, `PUSH`, `WHATSAPP`).
- **`PushDeviceInstallation`**: Registered mobile device token for Expo Push. Attributes: user_id, device_token, platform (`ANDROID`, `IOS`), is_active.
- **`WhatsAppConnection`**: Linked WhatsApp phone number for an authenticated user. Attributes: user_id, phone_hash, opt_in_status (`OPTED_IN`, `OPTED_OUT`), is_active.

### 2.8 Subscriptions & SaaS Billing
- **`SubscriptionPlan`**: NNOO subscription tier (`STARTER`, `GROWTH`, `SCALE`). Attributes: name, paystack_plan_code, price_kobo, billing_interval (`MONTHLY`, `ANNUAL`), feature_limits.
- **`Subscription`**: Business subscription entitlement. Attributes: business_id, plan_id, paystack_subscription_code, status (`ACTIVE`, `PAST_DUE`, `CANCELLED`), current_period_end.
