# Runbook 10: Database & Supabase Outage Response

**Severity:** SEV-1 (Database unavailable / corruption risk)  
**Target:** Supabase Managed PostgreSQL Database & Connection Pooler  
**Authority:** David Bako (NNOO Lead Developer / Platform Owner)

---

## 1. Trigger Conditions
- Application queries returning `ECONNREFUSED`, `connection timeout`, or `pool exhausted`.
- Supabase project status shows `UNHEALTHY` or `RESTARTING`.
- Database query latency spikes beyond 10,000ms across multiple tables.

---

## 2. Immediate Containment
1. **Check Supabase Status:**
   - Inspect Supabase status dashboard (https://status.supabase.com).
   - Review project metrics in Supabase Dashboard (CPU, RAM, Disk IOPS, Connection Count).
2. **Prevent Cascade / Connection Thundering Herd:**
   - If connection pool is saturated, temporarily pause background queue processing (Inngest).
   - Rate-limit unauthenticated incoming requests at edge to allow database recovery.

---

## 3. Diagnostic Steps
1. Test connection via direct Supabase Client in isolated script:
   ```bash
   node scratch/check_db.js
   ```
2. Check PostgreSQL active connection count and lock contention via Supabase MCP / Dashboard SQL:
   ```sql
   SELECT count(*), state FROM pg_stat_activity GROUP BY state;
   ```
3. Inspect for long-running blocking transactions:
   ```sql
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
   FROM pg_stat_activity 
   WHERE state != 'idle' AND now() - pg_stat_activity.query_start > interval '30 seconds';
   ```

---

## 4. Remediation Procedures
- **Scenario A: Connection Pool Saturation**
  - Switch server connection strings to use Supavisor connection pooler (port 6543 / transaction mode).
  - Terminate blocking idle-in-transaction connections.
- **Scenario B: Resource Exhaustion (CPU/Memory)**
  - Upgrade compute instance tier or restart PostgreSQL server in Supabase project settings.
- **Scenario C: Database Corruption or Unrecoverable Outage**
  - Execute authoritative Point-in-Time Recovery (PITR) to latest safe timestamp per [Runbook 01](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/01-database-recovery.md).

---

## 5. Verification & Return to Service
1. Run automated reconciliation checks (`RecoveryVerificationService.reconcileFinancialLedgers`).
2. Verify 100% of the 60 public tables enforce RLS.
3. Confirm core accounting transactions execute cleanly ($\Delta 0$ drift).
4. Authorize resume of background jobs and user traffic.
