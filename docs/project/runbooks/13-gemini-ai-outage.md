# Runbook 13: Google Gemini AI Outage Response

**Severity:** SEV-3 (Medium - AI Intelligence Degraded)  
**Target:** Google Gemini API Integration, Ask NNOO, AI Bookkeeper & Smart Summaries  
**Authority:** David Bako (NNOO Lead Developer / Platform Owner)

---

## 1. Absolute Operating Principle
> **When Google Gemini is down, core NNOO business operations MUST continue uninterrupted.**
> Deterministic features (Health Scores, Credit Passports, Sales, Invoices, Expenses, Payments) do not require Gemini and must remain 100% operational.

---

## 2. Trigger Conditions
- Google Gemini API returning `429 Too Many Requests`, `503 Service Unavailable`, or connection timeouts.
- High rate of malformed structured output validation failures (`VALIDATION_FAILED`).
- Spike in latency (> 15,000ms) on `/api/v1/ai/assistant/conversations` or `/api/v1/ai/bookkeeper/classify`.

---

## 3. Immediate Containment
1. **Activate Global or Feature AI Kill-Switch:**
   - Use Platform Admin Controls (`/admin/intelligence` or `/api/v1/admin/intelligence/controls`) to toggle `is_enabled = false` on failing features (`ask_nnoo`, `ai_bookkeeper`, `smart_summaries`).
   - This provides immediate fail-safe user messaging without spamming failing provider calls.
2. **Verify Provider Status:**
   - Check Google Cloud / Gemini Service Health status.

---

## 4. Diagnostic Procedures
1. Filter structured AI logs (`service: "ai"`):
   - Check `errorCode` (`GEMINI_RATE_LIMITED`, `GEMINI_UNAVAILABLE`, `SCHEMA_VALIDATION_ERROR`).
2. Inspect `public.ai_invocations` for error clustering:
   ```sql
   SELECT feature_key, error_code, count(*) 
   FROM public.ai_invocations 
   WHERE created_at > now() - interval '1 hour' AND status = 'failed'
   GROUP BY feature_key, error_code;
   ```
3. Check quota exhaustion vs upstream outage.

---

## 5. Remediation & Recovery
- **Scenario A: Quota / Rate Limiting (429)**
  - Implement exponential backoff in background jobs.
  - Request tier quota upgrade in Google AI Studio / Google Cloud Console.
- **Scenario B: Upstream Outage (503)**
  - Keep AI kill switch enabled.
  - Return safe, friendly user notification: *"AI Assistant is temporarily taking a breather. Your bookkeeping and accounting continue normally."*
  - Monitor Google Gemini API until uptime resumes.
- **Scenario C: Model Deprecation / Schema Shift**
  - Switch to backup model in `apps/web/src/server/ai/config/env.ts`.

---

## 6. Verification & Deactivation of Kill-Switch
1. Execute single diagnostic smoke test via `/api/v1/ai/assistant/conversations`.
2. Verify parsed response satisfies runtime Zod schema with 0 errors.
3. Deactivate AI kill switch in Platform Admin.
4. Confirm zero financial mutations occurred as a side-effect ($\Delta 0$).
