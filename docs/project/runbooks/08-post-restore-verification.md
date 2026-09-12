# Runbook 08: Post-Restore Verification & Return-to-Service Gates

**Owner:** Platform Operations & QA  
**Audience:** Platform Admin / QA Engineer / David Bako  
**Severity:** CRITICAL (Sign-off Gate)  

---

## 1. Overview & Verification Principle

> [!IMPORTANT]
> **NO SYSTEM RETURNS TO SERVICE UNTIL ALL POST-RESTORE VERIFICATION GATES PASS.**  
> A responding database is not proof of recovery. Verification requires mathematical financial parity, proven multi-tenant isolation, and reconciled provider states.

---

## 2. Post-Restore Verification Checklist

### Gate 1: Financial Ledger Parity ($\Delta 0$ Discrepancy)
Execute `RecoveryVerificationService.reconcileFinancialLedgers(source, restored)`:
- [ ] **Net Sales:** Source = Restored ($\Delta 0$)
- [ ] **Gross Sales:** Source = Restored ($\Delta 0$)
- [ ] **Expenses:** Source = Restored ($\Delta 0$)
- [ ] **Payments:** Source = Restored ($\Delta 0$)
- [ ] **Refunds:** Source = Restored ($\Delta 0$)
- [ ] **Invoices Count:** Source = Restored ($\Delta 0$)
- [ ] **Inventory Movements Count:** Source = Restored ($\Delta 0$)
- [ ] **Journal Entries Count:** Source = Restored ($\Delta 0$)
- [ ] **Double-Entry Balance:** Restored Total Debits = Restored Total Credits

### Gate 2: Multi-Tenant Isolation & RLS
- [ ] Query all 60 public tables as `usr_alpha_owner`; confirm 0 rows returned for `biz_beta`.
- [ ] Verify RLS is enabled on 100% of tables:
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;
  ```
  *(Must return 0 rows).*

### Gate 3: Auth Identity & Last-Owner Invariant
- [ ] Confirm every membership references a valid `profiles` record.
- [ ] Confirm every business has at least one active user with role `owner`.

### Gate 4: External State Reconciliation
- [ ] Paystack: Zero duplicate fulfillment or double-charging.
- [ ] WhatsApp: All newer `STOP` opt-out commands remain strictly enforced.
- [ ] Inngest: Background jobs reviewed in `PAUSED` state before enabling live schedules.

---

## 3. Formal Sign-Off Record

| Gate | Result | Verified By | Timestamp |
|---|---|---|---|
| 1. Financial Ledger Parity | PASS ($\Delta 0$) | Platform Admin / Operations | [Date/Time] |
| 2. Multi-Tenant Isolation | PASS (0 Leaks) | Security / QA | [Date/Time] |
| 3. Auth & Ownership | PASS (0 Orphans) | Operations | [Date/Time] |
| 4. External Provider Reconciled | PASS | Platform Admin | [Date/Time] |
| **FINAL RETURN-TO-SERVICE APPROVAL** | **APPROVED** | **David Bako** | [Date/Time] |
