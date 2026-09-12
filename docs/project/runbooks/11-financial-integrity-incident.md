# Runbook 11: Suspected Financial Integrity Incident Response

**Severity:** SEV-1 (Critical Data Integrity Incident)  
**Target:** Double-Entry Ledger, Sales, Expenses, Payments, Inventory Costing & Invoices  
**Authority:** David Bako (NNOO Lead Developer / Platform Owner)

---

## 1. Absolute Operating Rules
1. **NEVER manually patch accounting database rows with ad-hoc SQL updates.**
2. **NEVER invent or fabricate compensating journal entries without cryptographic proof.**
3. **NEVER restart traffic until mathematical parity ($\Delta 0$) is proven.**

---

## 2. Trigger Conditions
- Automated ledger audit detects unposted or unbalanced journal entries (`SUM(debits) != SUM(credits)`).
- Business customer reports mismatched balance between invoice lines and payment receipts.
- Moving-average inventory unit cost computes as negative or undefined.
- Concurrent transaction race condition suspect in high-volume sales terminal.

---

## 3. Immediate Containment
```text
STOP AFFECTED MUTATION PATH
          ↓
PRESERVE RAW DATABASE SNAPSHOT
          ↓
IDENTIFY AFFECTED TENANT / SOURCE ENTITY
          ↓
ISOLATE SYSTEM LOGS & CORRELATION IDS
```

1. Temporarily pause write mutations for the affected business tenant if isolated, or activate global read-only maintenance mode if system-wide.
2. Capture a cold logical backup (`pg_dump`) of the exact state before touching any data.

---

## 4. Diagnostic & Reconciliation Procedures
1. Run mathematical ledger verification query across the affected tenant:
   ```sql
   SELECT 
     je.id AS entry_id,
     SUM(jl.debit_minor) AS total_debits,
     SUM(jl.credit_minor) AS total_credits,
     SUM(jl.debit_minor) - SUM(jl.credit_minor) AS imbalance
   FROM public.journal_entries je
   JOIN public.journal_lines jl ON jl.journal_entry_id = je.id
   WHERE je.business_id = '<AFFECTED_BUSINESS_ID>'
   GROUP BY je.id
   HAVING SUM(jl.debit_minor) != SUM(jl.credit_minor);
   ```
2. Trace the originating `correlationId` from structured server logs to identify the exact API request, user actor, and timestamp.
3. Compare the state using `RecoveryVerificationService.reconcileFinancialLedgers`.

---

## 5. Controlled Repair Sequence
1. If the defect was caused by a software race condition:
   - Deploy code fix to prevent recurrence.
   - Author a safe, idempotent forward migration or transactional domain service script that posts legitimate adjusting journal entries.
2. Re-run reconciliation audit to prove exact match ($\Delta 0$ difference).
3. Validate that inventory quantities, customer balances, and supplier payables strictly balance.

---

## 6. Return to Service
1. Obtain formal sign-off from David Bako.
2. Re-enable write mutations for the affected business.
3. Execute postmortem review per [Runbook 17](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/17-incident-postmortem-template.md).
