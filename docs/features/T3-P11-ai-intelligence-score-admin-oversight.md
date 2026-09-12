# T3-P11 — Production NNOO AI, Intelligence & Score Admin Oversight

## 1. Feature Specification & Mission
The AI, Intelligence & Score Admin Oversight feature delivers an authoritative, unified **Intelligence Operations Center** inside the existing Platform Admin console (`apps/web/src/app/admin/intelligence`) for operational monitoring, telemetry diagnostics, emergency controls, and safety oversight across all 8 intelligence subsystems:
1. **AI Foundation & Gemini Platform** (T3-P01)
2. **AI Bookkeeper Classification & Confirmation** (T3-P02 / T3-P03)
3. **Verified Business Summaries & Insights** (T3-P04)
4. **Ask NNOO Business AI Assistant** (T3-P05)
5. **Business Health Score Engine** (T3-P06)
6. **Credit Passport Generation & Verification** (T3-P07)
7. **Intelligence Jobs & Automation Foundation** (T3-P08)
8. **Notification Center & WhatsApp Business Integration** (T3-P09 / T3-P10)

---

## 2. Hard Governance & Safety Invariants

1. **Zero Business Truth Manipulation / Financial Mutations**:
   - Platform Admin observes, diagnoses, monitors token metrics, reviews failures, and manages operational kill switches.
   - Platform Admin **CANNOT** create, edit, or void sales, expenses, payments, refunds, inventory items/movements, invoices, receipts, journal entries, AR, AP, or profitability.
2. **No Health Score Overrides**:
   - Scores are computed deterministically via `business-health-score-v1`. Zero UI or API capability exists to manually set, override, or alter dimension weights.
3. **No Credit Passport Overrides**:
   - Passports remain cryptographically verified and immutable. Admin cannot fabricate or edit financial snapshots or artifact hashes.
4. **No Bookkeeper Auto-Confirmation**:
   - Suggestions remain unposted until verified by authorized business staff. Platform Admins cannot accept or reject suggestions on behalf of businesses.
5. **Zero User Consent / Preference Overrides**:
   - If a user sends `STOP` (WhatsApp opt-out) or mutes notification preferences, Platform Admin retries are unconditionally blocked.
6. **Zero Gemini Provider Invocations on Admin Dashboard**:
   - Loading Admin Intelligence dashboards, overview metrics, token telemetry, and registries causes **0 Gemini API calls**.
7. **Mandatory Audit Logging with Reason**:
   - Every operational control toggle (kill switch), background job retry, and WhatsApp delivery retry requires an explicit audit reason and is permanently recorded in `public.platform_audit_events`.

---

## 3. Database Schema & Tables Applied

- **`public.platform_feature_controls`**:
  - Authoritative operational switches for `global_ai_enabled`, `ask_nnoo_enabled`, `ai_bookkeeper_enabled`, `business_summaries_enabled`, `health_score_enabled`, `credit_passport_enabled`, `automations_enabled`, `notifications_enabled`, `whatsapp_enabled`.
  - Records `updated_by_admin_id`, `updated_reason`, and timestamps.
- **Admin Query Performance Indexes**:
  - `idx_ai_invocations_created_at`, `idx_ai_invocations_feat_status_created`, `idx_intelligence_job_runs_type_status_created`, `idx_whatsapp_deliveries_status_created`, `idx_whatsapp_deliveries_template_status`, `idx_business_notifications_cat_created`, `idx_credit_passport_snapshots_status_created`, `idx_ai_business_health_snapshots_status_created`.

---

## 4. REST API Endpoints

- `GET /api/v1/admin/intelligence/overview`: Aggregated status and counts across all 8 intelligence areas.
- `GET /api/v1/admin/intelligence/ai-operations`: Detailed AI invocations, token consumption, accurate cost labeling, and model/prompt registries.
- `GET /api/v1/admin/intelligence/bookkeeper`: AI Bookkeeper classification, review, and application metrics.
- `GET /api/v1/admin/intelligence/health`: Health Score formula registry and calculation telemetry.
- `GET /api/v1/admin/intelligence/credit-passport`: Credit Passport generation, share, and integrity telemetry.
- `GET /api/v1/admin/intelligence/automations`: Background automations and job run history.
- `GET /api/v1/admin/intelligence/whatsapp`: WhatsApp connection, webhook, delivery, and template telemetry.
- `GET/PATCH /api/v1/admin/intelligence/controls`: Read/update platform operational feature controls with required audit reason.
- `POST /api/v1/admin/intelligence/jobs/retry`: Safe idempotent failed job retry with required audit reason.
- `POST /api/v1/admin/intelligence/whatsapp/retry`: Safe failed WhatsApp delivery retry with required audit reason.

---

## 5. Web UX

- **Intelligence Operations Center** (`/admin/intelligence`):
  - Real-time time window switcher (`24 Hours`, `7 Days`, `30 Days`).
  - **Overview Tab**: 8 system health cards with deterministic status badges (`HEALTHY`, `DEGRADED`, `NOT_CONFIGURED`, `UNAVAILABLE`).
  - **AI Platform Tab**: Token metrics, accurate cost pricing (`Estimated from configured pricing (USD)`), allowlisted model registry, source-controlled prompt version registry, and sanitized failure logs.
  - **Bookkeeper Tab**: Classification funnel, pending reviews, confirmation invariants.
  - **Health & Passports Tab**: Immutable formula definition viewer, passport share link states.
  - **Automations Tab**: Job run history, failure list, and safe idempotent retry modal.
  - **Messaging & WhatsApp Tab**: Notification channel breakdown, WhatsApp connection states, template registry, delivery funnel, and safe retry modal.
  - **Controls & Audit Tab**: Platform operational switches with emergency disable/enable and reason logging.
- **Admin Sidebar Integration**: Added "Intelligence" navigation item with `Cpu` icon to `AdminLayout`.

---

## 6. Test Evidence & Validation

- **Test Suite**: `apps/web/src/server/ai/__tests__/admin-intelligence.test.ts` (14 automated tests).
- **Total Test Baseline**: **169/169 tests passing across 22 test suites with 0 failures**.
- **Next.js Production Build**: Succeeded across 78 routes with 0 errors.
- **Mobile TypeScript Validation**: Succeeded with 0 errors.
