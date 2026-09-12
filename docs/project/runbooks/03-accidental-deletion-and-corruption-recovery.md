# Runbook 03: Accidental Tenant Deletion & Scoped Corruption Recovery

**Owner:** NNOO Engineering & Platform Operations  
**Audience:** Platform Admin / Lead Engineer  
**Severity:** HIGH (Single-Tenant Impact)  

---

## 1. Overview & Triggers

Triggered when an application bug or accidental administrative action corrupts or deletes data belonging to **one specific Business** (e.g. accidental deletion of sales items, customers, or invoices), while all other tenants remain healthy.

> [!IMPORTANT]
> **DO NOT RESTORE THE ENTIRE PLATFORM DATABASE FOR A SINGLE-TENANT ISSUE.**  
> Rolling back the whole database would destroy valid transactions recorded by other businesses after the backup point. Use Scoped Record Recovery instead.

---

## 2. Scoped Recovery Sequence

```text
1. DETECT & CONFIRM SCOPE
   - Identify affected business_id and corrupted table(s).
   - Freeze write operations for that specific business if necessary.
          ↓
2. SPIN UP ISOLATED RECOVERY INSTANCE
   - Restore database backup to a temporary, isolated target environment.
          ↓
3. EXTRACT TARGET BUSINESS RECORDS
   - Extract only the rows matching WHERE business_id = '$AFFECTED_BIZ_ID'.
   - Preserve primary keys, foreign key relationships, and journal links.
          ↓
4. VERIFY EXTRACTED RECORD INTEGRITY
   - Reconcile double-entry balance (Debits = Credits).
   - Reconcile inventory movement links and invoice references.
          ↓
5. CONTROLLED INSERTION / REPAIR
   - Execute controlled INSERT ON CONFLICT DO NOTHING / UPDATE on live DB.
          ↓
6. POST-REPAIR RECONCILIATION & AUDIT
   - Re-run financial reconciliation for the affected business.
   - Record incident in Platform Audit log.
```

---

## 3. Preservation Invariants

- **Relationships & IDs:** Extracted records must retain their original UUIDs to preserve foreign keys across `sale_items`, `journal_lines`, and `invoice_items`.
- **Double-Entry Journal Integrity:** Under no circumstances should individual ledger lines be inserted without their corresponding balancing debit/credit partner.
- **Audit Logging:** Every manual recovery action must record:
  - Incident ID
  - Target `business_id`
  - Number of restored rows per table
  - Approving operator name
  - Timestamp
