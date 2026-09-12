# NNOO — Customer Support & Operational Triage Guide

Document ID: `SUP-OPS-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Support Guide**

---

## 1. Support Triage Framework

When a customer reports an issue or unexpected system behavior, support staff must execute the standard 8-step triage process:

```text
┌───────────────────────────┐     ┌───────────────────────────┐     ┌───────────────────────────┐
│  1. Identify User Safely  │ ──► │ 2. Identify Business Context│ ──► │  3. Capture Correlation ID│
└───────────────────────────┘     └───────────────────────────┘     └─────────────┬─────────────┘
                                                                                  │
┌───────────────────────────┐     ┌───────────────────────────┐                   │
│  6. Check Provider Status │ ◄── │ 5. Identify Environment   │ ◄── 4. Identify Module
└─────────────┬─────────────┘     └───────────────────────────┘
              │
              ▼
┌───────────────────────────┐     ┌───────────────────────────┐
│  7. Reproduce with Test Acc│ ──►│  8. Escalate by Severity  │
└───────────────────────────┘     └───────────────────────────┘
```

---

## 2. Strict Data Minimization Policy

> [!CAUTION]
> Support personnel must **NEVER** request or accept the following from customers:
> - User account passwords or one-time passcodes (OTPs).
> - Full credit/debit card numbers, CVVs, or bank PINs.
> - Private API keys or provider tokens.

---

## 3. Investigating Financial & Accounting Complaints

If a customer reports: *"My Sales, Gross Profit, or Inventory valuation looks incorrect on the dashboard"*:

1. **Do NOT Alter Totals Manually:** Support staff have zero ability to manually overwrite database totals.
2. **Reconcile Source Transactions:**
   - Request the date range and transaction reference.
   - Compare the sum of Sales vs Refunds in `/app/[businessSlug]/reports/sales`.
   - Compare Inventory movements in `/app/[businessSlug]/reports/inventory`.
3. **Escalate Defect if Ledger Discrepancy Found:** If a mathematical bug is suspected, capture the `business_id` and open a SEV-1 ticket following [11-financial-integrity-incident.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/11-financial-integrity-incident.md).
