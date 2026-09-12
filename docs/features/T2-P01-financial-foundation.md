# Feature Specification: T2-P01 — Financial & Operational Data Foundation

## 1. Overview
This specification defines the canonical double-entry accounting foundation for NNOO. This engine guarantees that all future operational features (e.g., sales, expenses, inventory) store deterministic, balanced, and immutable financial history.

## 2. Scope
### In-Scope
- Canonical monetary representation (BigInt/BIGINT minor units).
- Core ledger accounts foundation (`ledger_accounts`).
- Initial system ledger accounts (Cash, Receivables, Inventory, Payables, Owner Equity, Revenue, COGS, Operating Expense).
- Immutable double-entry journal model (`journal_entries`, `journal_lines`).
- Server-side authoritative posting engine enforcing balancing invariants (Debits = Credits).
- Safe idempotent event tracking (`source_event_type`, `idempotency_key`).
- Accounting reversal workflow.
- Pure domain logic for money arithmetic avoiding floating point instability.
- Row-Level Security isolating financial records per business.

### Out-of-Scope
- Foreign exchange (multi-currency conversions).
- Tax engine/calculations.
- General Ledger user interface screens.
- Any operational feature UI (Sales, Invoices, Expenses, Dashboard).
- Manual journal entry via the client application by business users.

## 3. Architecture constraints
- **Tenancy**: Every ledger account and journal entry MUST strictly belong to a specific `business_id`.
- **Currency**: Enforces exact match against business's canonical currency (e.g., NGN).
- **Amounts**: Stored as integer minor units in PostgreSQL (`bigint`) and manipulated as `BigInt` or validated exact strings in TypeScript. NO binary floating-point (`number`) arithmetic for money.
- **Data Mutation**: Journal records cannot be UPDATED or DELETED. Mistakes are handled via the Reversal workflow.
- **Posting**: All postings go through a secure Server-Side implementation calling a trusted Supabase RPC function. Client apps cannot execute raw INSERTs to journal lines.

## 4. Required Database Elements
- `public.ledger_accounts`: The list of accounts (e.g., `cash_and_cash_equivalents`, `sales_revenue`).
- `public.journal_entries`: The transaction headers grouping lines.
- `public.journal_lines`: The individual debits and credits.
- RPC `post_financial_entry`: Atomically validates and commits balanced transactions.
- RPC `ensure_business_ledger_accounts`: Auto-provisions required baseline accounts.

## 5. Security & RLS
- All financial tables require RLS ensuring the authenticated user possesses an active `business_memberships` link to the record's `business_id`.
- No broad `INSERT/UPDATE/DELETE` client-facing policies for `journal_entries` or `journal_lines`.

## 6. Testing & Acceptance Criteria
- [x] Balanced Entry: A 10,000 minor unit debit and 10,000 minor unit credit is accepted.
- [x] Unbalanced Entry: Debits ≠ Credits is strictly rejected by the database.
- [x] Zero Entry: Lines with 0 on both sides are rejected.
- [x] Negative Money: Amounts < 0 are strictly rejected.
- [x] Cross-Business Leak: Using Account X (from Business A) in Business B's journal is rejected.
- [x] Currency Mismatch: Entry rejected if it claims USD for an NGN business.
- [x] Idempotency: Submitting the same `idempotency_key` twice returns the same single entry. Submitting conflicting data with the same key throws an error.
- [x] Reversal: Reversing an entry produces an equal and opposite entry with matching references.
- [x] Provisioning: An existing or new business safely provisions unique system ledger accounts without duplicates.
