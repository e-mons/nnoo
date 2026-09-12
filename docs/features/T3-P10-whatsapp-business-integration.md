# T3-P10 — Production NNOO WhatsApp Business Integration

## 1. Feature Specification & Mission
The WhatsApp Business Integration delivers an enterprise-grade, channel-based communication layer powered by the official Meta WhatsApp Business Platform Cloud API. The integration provides two distinct, strictly governed capabilities:

- **Capability A (Outbound Channel Delivery)**: Extends Prompt 9 Notification Center by dispatching high-priority business alerts (`LOW_STOCK`, `OVERDUE_INVOICE`, `BOOKKEEPER_REVIEW_PENDING`, `BUSINESS_HEALTH_CHANGED`, `CREDIT_PASSPORT_STALE`, `BUSINESS_SUMMARY_READY`, `AUTOMATION_FAILED`) to consented business members via registered Meta templates or fallback lock-screen-safe messages.
- **Capability B (Inbound Q&A & Command Routing)**: Securely ingests signed Meta webhooks (`x-hub-signature-256`), deduplicates incoming message IDs, verifies active user business membership and RBAC, executes deterministic fast commands (`HELP`, `STOP`, `START`, `BUSINESS`, `BUSINESS <n>`) with **0 Gemini calls**, and routes general business questions to the canonical `AskNnooAssistantService` (T3-P05) pipeline.

---

## 2. Hard Governance & Safety Invariants

1. **Zero Financial Mutations**:
   - WhatsApp is strictly an alerting and conversational query channel.
   - It will **NEVER** create, update, or void sales, expenses, payments, refunds, inventory receipts/adjustments, invoices, receipts, customers, suppliers, staff, credit passports, or journal entries.
   - Any inbound command attempting financial mutation (e.g. "Record sale", "Add expense", "Create invoice") is deterministically intercepted with educational safety guidance.
2. **AI Bookkeeper Review Boundary**:
   - AI Bookkeeper classifications cannot be auto-posted or approved via WhatsApp; confirmation remains inside the NNOO web/mobile app.
3. **No Separate/Competing AI Logic**:
   - Inbound queries reuse the exact T3-P05 `AskNnooAssistantService` pipeline (same tool executor, verified facts, numeric guards, prompt injection delimiters, and RBAC).
4. **Dynamic RBAC & Role Downgrade Enforcement**:
   - User permissions are re-evaluated on every outbound notification and inbound message. Downgrading a user immediately strips access to sensitive financial metrics (e.g. profitability).
5. **Deterministic Command Cost Protection**:
   - Commands (`HELP`, `STOP`, `START`, `BUSINESS`, `BUSINESS <n>`) and unlinked sender messages execute with **0 Gemini API calls**.
6. **Delivery Retry Safety**:
   - If WhatsApp provider dispatch fails after successful AI answer generation, the answer is safely stored, and channel retry does **NOT** call Gemini a second time.

---

## 3. Database Schema & Tables Applied

- **`public.whatsapp_connections`**: Stores user-business link status, provider phone ID, HMAC-SHA256 phone lookup key, masked phone display, opt-in/opt-out consent timestamps, and active business context flag.
- **`public.whatsapp_link_requests`**: Manages short-lived (10-minute TTL), single-use, high-entropy cryptographic link codes with SHA-256 hashed storage and 5-attempt rate-limiting.
- **`public.whatsapp_deliveries`**: Tracks outbound template/text message dispatches, idempotency keys, delivery statuses (`QUEUED`, `SENT`, `DELIVERED`, `READ`, `FAILED`, `SKIPPED`), provider message IDs, and error codes.
- **`public.whatsapp_webhook_receipts`**: Records incoming provider event IDs to guarantee idempotent webhook processing without double execution.

---

## 4. REST & Webhook API Endpoints

- `GET /api/v1/webhooks/whatsapp`: Meta Cloud API subscription verification (`hub.mode`, `hub.verify_token`, `hub.challenge`).
- `POST /api/v1/webhooks/whatsapp`: Signed Meta webhook ingestion with raw body byte verification, status tracking, deduplication, and message routing.
- `GET /api/v1/ai/whatsapp/link`: Retrieves user connection status, masked phone, and available business memberships.
- `POST /api/v1/ai/whatsapp/link`: Generates one-time 6-character link code with 10-minute expiry and WhatsApp click-to-chat URL.
- `POST /api/v1/ai/whatsapp/disconnect`: Revokes WhatsApp connection for the business.
- `POST /api/v1/ai/whatsapp/switch-business`: Switches active business context for WhatsApp interactions.
- `POST /api/v1/ai/whatsapp/test-message`: Sends real-time test alert to the user's connected number.

---

## 5. Web UX

- **WhatsApp Settings Dashboard** (`/app/[businessSlug]/settings/whatsapp`):
  - Real-time connection status pill (`Connected`, `Not Connected`, `Opted Out`).
  - Masked phone display (`+234 *** *** 4821`).
  - Interactive "Connect WhatsApp" modal with copyable code, 10-minute expiration countdown, and WhatsApp direct chat link.
  - Multi-business context switcher.
  - WhatsApp notification category preference toggles.
  - One-click disconnect action with confirmation.
- **Navigation Integration**:
  - Integrated into `/app/[businessSlug]/settings` navigation menu.

---

## 6. Verification & Quality Gates

- **Unit & Integration Tests**: 155 tests passing across 15 suites in 8.5s (`pnpm --filter web test`).
- **Next.js Production Build**: 100% clean build across 67 routes in 8.4s (`pnpm --filter web build`).
- **Mobile TypeScript**: 0 errors (`pnpm --filter mobile exec tsc --noEmit`).
- **Zero Financial Side Effects**: Verified Δ 0 across all financial ledgers.
