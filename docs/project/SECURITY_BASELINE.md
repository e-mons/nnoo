# Security Baseline

## Identity and Access

- Supabase Auth is the sole identity source.
- Profiles are separate from auth identities; metadata cannot escalate privileges.
- Business access requires active, verified membership.
- Platform admin access is a separate authorised role in `public.platform_admins`.
- Mobile sessions use secure native storage (`expo-secure-store`).
- Stale permissions: Role downgrades take effect immediately on next protected request.
- Revoked users and suspended businesses are denied access on next request.

## Multi-Tenant Isolation & RLS

- 100% RLS enforced across all 60 public database tables.
- Server-side validation for privileged operations (admin, owners, managers, accountants, staff).
- No client-selected tenant (`business_id`) is trusted without active membership validation.
- Cross-tenant IDOR tests mandatory and verified across all resources.
- Invitation tokens use cryptographic hashes; raw tokens are never logged or stored in plaintext.
- Owner invariant enforced (cannot remove, demote, or deactivate the last active owner).
- Platform-admin separation enforced through server actions, layouts, and route guards.
- Business suspension blocks tenant access while preserving complete financial audit history.
- Public enquiry privacy enforced (only active platform admins can view).

## Production Web Security Headers (Tranche 4 Prompt 3)

- **Content-Security-Policy (CSP):** Strict allowlist for script, style, image, font, and connect origins (Paystack, Supabase, Google Fonts). `frame-ancestors 'none'` blocks all clickjacking attempts.
- **Strict-Transport-Security (HSTS):** `max-age=63072000; includeSubDomains; preload` enforces HTTPS everywhere.
- **X-Frame-Options:** `DENY` prevents framing in legacy browsers.
- **X-Content-Type-Options:** `nosniff` prevents MIME-type sniffing attacks.
- **Referrer-Policy:** `strict-origin-when-cross-origin` protects sensitive URL paths.
- **Permissions-Policy:** Restricts camera, microphone, and geolocation; restricts payment API to self and Paystack.

## Server-Only Secrets Boundary

- `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `GEMINI_API_KEY`, `INNGEST_SIGNING_KEY`, Meta WhatsApp access tokens, and push server keys are strictly server-only.
- Zero secret keys are bundled into Web or Mobile client bundles.
- Public environment contains only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Paystack SaaS Billing Security

- Server-side initialization and verification against Paystack API.
- Webhook signature validation uses HMAC-SHA512 over raw request body.
- Idempotent webhook fulfillment prevents duplicate subscription delivery.
- Client callback redirects are non-authoritative.

## WhatsApp Business Platform Security

- Webhook signature verification uses HMAC-SHA256 over raw request body.
- Cryptographic link codes are short-lived (10-minute TTL), single-use, and rate-limited.
- Phone number alone never grants business access; active business membership is required.
- User `STOP` opt-out is inviolable; cannot be overridden by platform admin or automated retries.
- Financial mutation requests via WhatsApp are deterministically blocked with safety guidance.

## Mobile Push & Deep-Link Security

- Push tokens are private device identifiers scoped to active users.
- Lock-screen push payloads minimize PII and financial figures.
- Tapping push notifications requires active user session authentication; deep links to foreign businesses are rejected.

## AI Security Baseline (Tranche 3)

- **Server-Only Gemini Credentials:** `GEMINI_API_KEY` is strictly server-only.
- **Tenant-Scoped Authorization Preflight:** All business AI requests verify server-resolved user identity and active membership before retrieving context or calling provider APIs.
- **Role-Based Access Control (RBAC):** AI operations inherit exact NNOO permissions (`manage_financials`, `view_financials`, etc.). Forbidden users are blocked before provider invocation.
- **No Financial Mutation or Arbitrary SQL:** Gemini has zero tools to mutate sales, expenses, inventory, invoices, or journal entries, and zero access to run SQL.
- **Data Minimization:** Context builders strip PII before passing data to Gemini.
- **Prompt Injection Defense in Depth:** Boundary delimiters isolate untrusted user text and stored business descriptions (treated as literal data).
- **Runtime Schema Validation:** All machine-consumed model outputs are parsed and validated through versioned Zod schemas. Invalid payloads fail safely with `AI_RESPONSE_INVALID`.
- **Global Kill Switch & Fault Tolerance:** `AI_ENABLED="false"` degrades AI features safely without impacting core business accounting operations.
- **Observability & Log Redaction:** Logs automatically scrub API keys, JWTs, Paystack secrets, and full prompts.

## AI Bookkeeper Security Controls

- **Suggestion-Only Architecture:** AI classification produces structured suggestions in `public.ai_bookkeeping_classifications` only with `requiresHumanReview: true`. Zero financial mutations are auto-posted.
- **Opaque Candidate Keys:** Gemini chooses only from ephemeral candidate keys (`category_1`, `supplier_1`, `customer_1`). Unknown or forged keys returned by the model are rejected and nulled by server post-validation.
- **No Financial Authority:** Canonical Money amounts, transaction dates, and currency codes cannot be altered by Gemini.
- **Strict RBAC:** Only `owner`, `business_admin`, `manager`, and `accountant` roles can request transaction classification.

## Data Protection, Backup Security & Disaster Recovery (Tranche 4 Prompt 4)

- **Backup Confidentiality & Encryption:** Database backups are encrypted in transit and at rest. Dumps (`*.dump`, `*.tar`, `*.sql.bak`) are strictly excluded from source control (`.gitignore`) and public cloud storage.
- **Zero Backdoor / Break-Glass Protection:** Emergency recovery does not utilize master backdoor passwords or unauthenticated endpoints. Privileged recovery operations require authorized operator credentials and generate auditable operational logs.
- **Post-Restore RLS & Tenant Enforcement:** Restored database instances require 100% RLS policy verification across all 60 tables; cross-business access tests must return 0 leaked records before returning to service.
- **Inviolable Consent Protection on Restore:** Restoring an older database state cannot silently re-enable outbound messaging for users who opted out (`STOP`) after the backup timestamp.
- **Zero Accidental Outbound Side Effects:** Recovery rehearsal and staging environments operate with outbound communications (WhatsApp, Push) and payment mutations (Paystack live) strictly disabled.
- **Exact Financial Parity Requirement:** Return-to-service requires mathematical financial reconciliation ($\Delta 0$) across sales, expenses, payments, refunds, invoices, inventory movements, and balancing journal debits/credits.

## Production Provider Security Certification (Tranche 4 Prompt 10)

- **Provider Validation Model:** Environment variable presence alone is not production verification. Certification requires validated HMAC signatures, runtime schema parsing, deduplicated event receipts, and verified failure isolation.
- **Paystack Live:** HMAC-SHA512 webhook signature verification certified; invalid signatures produce 0 fulfillment. Browser callback is non-authoritative. Replay idempotency enforces single subscription activation. Real monetary charges require explicit human operator authorization.
- **Gemini Production:** Server-only API key (`gemini-2.5-flash` model). Runtime Zod schema validation rejects malformed outputs. Cross-tenant context leak = 0. Arbitrary SQL = impossible. Kill switch (`AI_ENABLED=false`) degrades gracefully with 100% core accounting continuity.
- **Inngest Durable Jobs:** Signing key authentication on `/api/inngest`. Deduplication keys prevent duplicate canonical effects. Zero schedule startup storms on worker restart.
- **WhatsApp Production:** HMAC-SHA256 webhook signature verification certified; invalid signatures produce 0 processing. Phone number alone grants 0 business access. Link codes are cryptographic, time-bounded, and single-use. STOP opt-out is unconditionally enforced; admin override = impossible. Financial mutation requests via WhatsApp are deterministically blocked.
- **Push Production:** Device tokens bound strictly to authenticated user IDs. Push tap reauthorizes session and business membership. Wrong-user access = denied. Lock-screen payloads omit customer names and financial amounts. Invalid device tokens trigger deactivation, not infinite retry.
- **Supabase Auth:** Password recovery and confirmation links target `https://nnoo.app` exclusively. Zero localhost/development URL fallbacks.
- **Failure Isolation:** Any external provider outage (Paystack, Gemini, Inngest, WhatsApp, Push) leaves core double-entry accounting and tenant operations 100% operational with $\Delta 0$ on all financial ledgers.

## Production UAT & Go-Live Rehearsal Security Certification (Tranche 4 Prompt 11)

- **End-to-End Multi-Tenant Isolation:** Verified 0 cross-tenant data leaks across 60 database tables during full multi-user UAT operations.
- **IDOR Defense:** Direct object reference manipulation across sales, expenses, invoices, inventory, and credit passport endpoints returns HTTP 403/404 with 0 unauthorized record exposure.
- **Role Downgrade Freshness:** Membership role downgrades and suspensions are evaluated dynamically on every protected request; stale tokens/sessions cannot execute privileged operations.
- **AI Non-Authority & Immutability:** Suggestion-only AI Bookkeeper requires explicit human confirmation before creating financial entries ($\Delta 0$ pre-confirmation). Historical Credit Passport snapshots remain strictly immutable via SHA-256 integrity hashes.
- **Multi-Channel Consent & Privacy:** Lock-screen push payloads omit raw financial sums and customer names; WhatsApp `STOP` opt-out is unconditionally enforced and cannot be overridden by platform administrators.
- **Clean Environment Scan:** Zero privileged secrets (`SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `GEMINI_API_KEY`, `WHATSAPP_ACCESS_TOKEN`, `INNGEST_SIGNING_KEY`) exist in public client bundles, repository files, or telemetry logs.
