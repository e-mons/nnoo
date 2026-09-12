# Runbook 09: Core Web & API Outage Response

**Severity:** SEV-1 (Platform-wide outage) or SEV-2 (Partial route degradation)  
**Target:** Next.js Web Application & API Route Subsystem  
**Authority:** David Bako (NNOO Lead Developer / Platform Owner)

---

## 1. Trigger Conditions
- Public liveness endpoint `GET /api/v1/health` returns non-200 or times out (> 5000ms).
- Edge CDN / Vercel reports 5xx error rate > 5% over 5 minutes.
- Critical user authentication or route rendering failures across web or mobile apps.

---

## 2. Immediate Containment & Triage
1. **Verify Edge Status:**
   - Check Vercel Status page (https://www.vercel-status.com).
   - Inspect edge deployment logs via Vercel CLI or project dashboard.
2. **Inspect Core Liveness:**
   ```bash
   curl -I https://api.nnoo.app/api/v1/health
   ```
3. **Identify Fault Domain:**
   - **Scenario A (Vercel Edge/DNS outage):** Edge gateway failing before reaching Node.js runtime.
   - **Scenario B (Next.js Runtime Crash):** Unhandled server error in root middleware or layout.
   - **Scenario C (Database Exhaustion):** Supabase connection pool exhausted (see [Runbook 10](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/10-database-supabase-outage.md)).

---

## 3. Diagnostic Steps
1. Filter structured server logs for `level: "ERROR"` and `service: "api" | "web"`.
2. Extract the `correlationId` from failing HTTP response headers.
3. Verify whether deployment ID matches the latest verified stable release.

---

## 4. Remediation Procedures
- **Rollback to Prior Stable Deployment:**
  - If the outage coincides with a new deployment, trigger instant rollback to previous verified deployment in Vercel.
- **Restart Application Instances:**
  - Redeploy latest green commit if process memory leak or stuck event loop is diagnosed.
- **Fail-Open Safe Degradation:**
  - If a non-essential upstream dependency is causing edge timeouts, enable the upstream circuit breaker.

---

## 5. Verification & Return to Service
1. Confirm `GET /api/v1/health` returns `200 OK` with `< 200ms` latency.
2. Execute smoke test across critical user journeys (`/sign-in`, `/app`, `/admin`).
3. Monitor error rates for 15 minutes before closing incident.
4. Record incident entry in platform audit log and initiate postmortem ([Runbook 17](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/17-incident-postmortem-template.md)).
