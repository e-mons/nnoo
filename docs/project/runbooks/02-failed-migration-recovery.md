# Runbook 02: Failed Database Migration Recovery

**Owner:** NNOO Engineering & Platform Operations  
**Audience:** Software Engineers / Release Engineers  
**Severity:** HIGH (Deployment Blocked)  

---

## 1. Overview & Triggers

Triggered when a deployment migration (`supabase/migrations/*.sql`) fails during execution against the staging or production database, leaving the database in an uncertain or partial state.

---

## 2. Core Operating Principles

1. **NEVER EDIT PAST APPLIED MIGRATIONS:** Applied migrations in `supabase/migrations/` are immutable history. Never edit an old migration to fix a forward deployment.
2. **SAFE FORWARD REPAIR:** Create a new timestamped migration script that safely applies missing changes or reconciles broken state.
3. **TRANSACTIONAL ROLLBACK CHECK:** PostgreSQL supports DDL transactions. Determine whether the migration rolled back cleanly or left partial objects.

---

## 3. Step-by-Step Resolution Procedure

### Step 1: Diagnose Failure Cause & Ledger State
1. Review migration execution logs from Supabase CLI / MCP tool.
2. Query `supabase_migrations.schema_migrations` to check if the failed version was recorded:
   ```sql
   SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 5;
   ```
3. If the failed migration is NOT in the table, the transaction rolled back.
4. If partial state exists (e.g. non-transactional statements like concurrent index creation), inspect created objects.

### Step 2: Determine Safe Forward Repair
1. If failure was due to missing prerequisite column or constraint violation:
   - Identify the missing prerequisite.
   - Write a new versioned migration (e.g. `YYYYMMDDHHMMSS_fix_prerequisite.sql`).
2. If failure was due to a syntax error in an unapplied migration:
   - Fix the syntax error in the pending migration if it has NEVER been executed in production.
   - Re-run `supabase db push`.

### Step 3: Regenerate & Verify Generated Types
1. Re-generate shared TypeScript types:
   ```bash
   pnpm --filter @nnoo/supabase run generate:types
   ```
2. Run web & mobile typecheck:
   ```bash
   pnpm run typecheck
   ```
3. Run full automated test suite to confirm zero regressions.
