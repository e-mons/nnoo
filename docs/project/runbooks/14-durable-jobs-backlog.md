# Runbook 14: Durable Jobs Backlog & Outage Response

**Severity:** SEV-2 (High - Background Automation Backlog)  
**Target:** Inngest Job Queue, Intelligence Schedules, Attention Scanners & Summary Generators  
**Authority:** David Bako (NNOO Lead Developer / Platform Owner)

---

## 1. Trigger Conditions
- Inngest Cloud dashboard reports growing queue backlog (> 500 queued jobs).
- Terminal job failures spike across scheduled jobs (`ai-daily-summary`, `attention-scan`, `health-refresh`).
- Stale jobs stuck in `RUNNING` status for > 30 minutes without heartbeat.
- Retry storm detected (rapid consecutive retries causing downstream rate-limiting).

---

## 2. Immediate Containment
1. **Pause Job Dispatch in Inngest Cloud / Platform Admin:**
   - Temporarily pause recurring schedule execution to allow queue draining.
2. **Prevent Duplicate AI Execution:**
   - Inngest functions enforce idempotency keys (`businessId + date + promptVersion`).
   - Do NOT force un-idempotent job re-runs.

---

## 3. Diagnostic Procedures
1. Check Inngest function execution logs in Inngest Cloud dashboard.
2. Query `public.ai_automation_jobs` for stale or failing executions:
   ```sql
   SELECT id, job_type, business_id, status, attempt_count, error_message, started_at 
   FROM public.ai_automation_jobs 
   WHERE status = 'RUNNING' AND started_at < now() - interval '30 minutes';
   ```
3. Check if failures are caused by upstream provider dependency (e.g. Gemini 429s or database timeouts).

---

## 4. Remediation Procedures
- **Stale RUNNING Job Reconciliation:**
  - Mark orphaned `RUNNING` jobs as `FAILED` with reason `"Worker execution timeout / crash"`.
- **Controlled Replay:**
  - Use Platform Admin Job Operations (`/admin/intelligence/jobs`) to trigger controlled single-job retry with reason auditing.
- **Concurrency Rate Limiting:**
  - Adjust Inngest function concurrency limits (e.g. `concurrency: 5`) to prevent throttling upstream APIs.

---

## 5. Verification & Return to Service
1. Confirm queue backlog returns to 0.
2. Verify daily summaries and attention items are generated without duplicates.
3. Confirm zero duplicate journal or financial entries were posted ($\Delta 0$).
