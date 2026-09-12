# Runbook 01: Database Recovery (Supabase PITR & Logical Restore)

**Owner:** NNOO Platform Operations  
**Audience:** Platform Admin / Database Administrator  
**Severity:** CRITICAL (Incident Response)  

---

## 1. Overview & Triggers

This runbook defines the exact procedure to restore the NNOO PostgreSQL database in the event of:
- Major database outage or unrecoverable disk failure.
- Widespread data corruption affecting multiple tenants.
- Accidental catastrophic truncation or dropping of critical financial tables.

---

## 2. Pre-Requisites & Safety Rules

> [!CAUTION]
> **NEVER PERFORM AN EXPERIMENTAL RESTORE ON PRODUCTION.**  
> Always restore to an isolated staging or recovery environment first to verify data and financial reconciliation before routing live traffic.

1. **Confirm Outbound Side Effects are Disabled:**
   - Paystack webhooks / fulfillment: set to test/standby mode.
   - Outbound WhatsApp dispatch: paused.
   - Mobile Push notifications: paused.
   - Background jobs (Inngest): paused.

---

## 3. Procedure: Point-in-Time Recovery (PITR) via Supabase

If Supabase PITR is enabled on the project:

1. **Access Supabase Dashboard / CLI:**
   - Log into Supabase Management Console with platform admin credentials.
   - Navigate to **Project Settings** $\to$ **Database** $\to$ **Backups** $\to$ **Point in Time Recovery**.
2. **Select Recovery Point:**
   - Identify the exact UTC timestamp $T_{\text{safe}}$ immediately preceding the incident (e.g. `2026-08-19 11:45:00 UTC`).
3. **Execute Restore to New Target Project:**
   - Select "Restore to a new project" (e.g. `nnoo-recovery-isolated`).
   - Allow Supabase WAL replay to complete.
4. **Inspect Connection & Schema:**
   - Test connectivity using database credentials for the recovery project.
   - Confirm table count matches expected 60 public tables.

---

## 4. Procedure: Logical Restore via `pg_restore` / `psql`

If restoring from an encrypted logical backup file:

1. **Retrieve Validated Backup Artifact:**
   - Obtain the latest encrypted backup dump from secure storage (e.g. `nnoo-backup-20260819.dump`).
   - Verify SHA-256 checksum against signed backup manifest.
2. **Provision Target Database:**
   - Ensure target PostgreSQL 17 instance is initialized.
3. **Execute Restore Command:**
   ```bash
   # Restore schema and data into isolated recovery database
   pg_restore --clean --if-exists --no-owner --no-privileges -d "$TARGET_DATABASE_URL" nnoo-backup-20260819.dump
   ```
4. **Re-apply Required Forward Migrations:**
   - If backup is older than repository migrations, apply missing migrations sequentially using Supabase CLI:
   ```bash
   supabase db push
   ```

---

## 5. Post-Restore Verification

Execute Runbook 08 (`08-post-restore-verification.md`):
1. Run financial ledger reconciliation ($\Delta 0$ difference).
2. Run multi-tenant isolation tests.
3. Verify RLS policies are active across all 60 tables.
4. Verify Auth user UUID linkages.
