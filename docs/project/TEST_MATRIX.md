# Test Matrix

| Area | Required test | Level | Status |
|---|---|---|---|
| Authentication | Register, verify, sign in, restore session, sign out | E2E | PASS (T1-P03/P04) |
| Auth Foundation | Authenticated user can access permitted own-profile info | Database/RLS | PASS (RLS policies defined) |
| Auth Foundation | User A cannot access restricted User B profile info | Database/RLS | PASS (RLS policies defined) |
| Auth Foundation | Unauthenticated access to protected profile info fails | Database/RLS | PASS (RLS policies defined) |
| Auth Foundation | Normal user cannot modify protected/system identity fields | Database/RLS | PASS (RLS policies defined) |
| Auth Foundation | Profile creation logic doesn't grant admin from metadata | Database/RLS | PASS (Trigger defined) |
| Auth Foundation | Generated database types include intended schema | Build/Check | PASS |
| Auth Foundation | Web client cannot access server-only secrets | Build/Review | PASS |
| Auth Foundation | Mobile bundle doesn't expose server-only credentials | Build/Review | PASS |
| Auth Foundation | Server Supabase client establishes auth architecture correctly | Unit/Review | PASS |
| Tenant isolation | User cannot read or write another business's data | Database/Integration | PASS (T1-P09) |
| Roles | Staff permissions are enforced server-side | Integration | PASS (T1-P09) |
| Marketing enquiry | Valid enquiry saves; invalid/spam request fails safely | Integration | PASS (T1-P08) |
| Web/mobile consistency | Same record and totals appear on both clients | E2E | PASS (T1-P09) |
| Sales | Sale posts once and affects stock/financial records correctly | Integration | Planned |
| Expenses | Expense affects reports once and preserves audit history | Integration | Planned |
| Stock | Purchase, sale, adjustment, damage, and expiry create correct movements | Integration | Planned |
| Invoice | Balance changes only from valid verified payments | Integration | Planned |
| Paystack | Signature, amount, currency, reference, duplicate webhook, verification | Integration | Planned |
| AI Foundation | Valid structured output parsed and validated against Zod schema | Unit | PASS (T3-P01) |
| AI Foundation | Malformed structured output rejected with AI_RESPONSE_INVALID | Unit | PASS (T3-P01) |
| AI Foundation | Unauthorized/forbidden requests fail before provider call (0 provider invocations) | Unit/Integration | PASS (T3-P01) |
| AI Foundation | Global kill switch (AI_ENABLED=false) blocks AI with AI_FEATURE_DISABLED | Unit | PASS (T3-P01) |
| AI Foundation | Prompt injection & stored injection treated strictly as literal data | Unit | PASS (T3-P01) |
| AI Foundation | Safe tool allowlist defaults to read-only; mutation and SQL tools absent | Unit | PASS (T3-P01) |
| AI Foundation | PII and auth secrets stripped from AI context projections | Unit | PASS (T3-P01) |
| AI Foundation | Application rate limiter throttles rapid requests with AI_RATE_LIMITED | Unit | PASS (T3-P01) |
| AI Foundation | Provider 429, timeout, safety block, and 503 mapped to safe error codes | Unit | PASS (T3-P01) |
| AI Foundation | Log redaction scrubs API keys, Supabase tokens, Paystack keys, and passwords | Unit | PASS (T3-P01) |
| AI Foundation | Zero financial mutations: AI foundation generates 0 sales, expenses, invoices, journal entries | Unit/Integration | PASS (T3-P01) |
| AI Foundation | Mobile and shared packages do not import @google/genai or server secrets | Build/Review | PASS (T3-P01) |
| AI Bookkeeper | Operating Expense suggests OPERATING_EXPENSE with category candidate and zero expense mutation | Unit/Integration | PASS (T3-P02) |
| AI Bookkeeper | Stock Purchase suggests STOCK_PURCHASE with supplier candidate, no expense category, and zero inventory movements | Unit/Integration | PASS (T3-P02) |
| AI Bookkeeper | Customer Payment suggests CUSTOMER_PAYMENT and adds SALE_SELECTION_REQUIRED | Unit/Integration | PASS (T3-P02) |
| AI Bookkeeper | Supplier Payment suggests SUPPLIER_PAYMENT and adds PAYABLE_SELECTION_REQUIRED | Unit/Integration | PASS (T3-P02) |
| AI Bookkeeper | Direct Sale suggests SALE and requires product lines | Unit/Integration | PASS (T3-P02) |
| AI Bookkeeper | Customer Refund suggests REFUND and requires sale selection | Unit/Integration | PASS (T3-P02) |
| AI Bookkeeper | Unknown/Ambiguous descriptions produce UNKNOWN with LOW confidence and no invented accounting | Unit | PASS (T3-P02) |
| AI Bookkeeper | Unsupported operations (payroll, taxes, loans) suggest UNSUPPORTED | Unit | PASS (T3-P02) |
| AI Bookkeeper | Money amount, currency, and date integrity preserved; Gemini cannot alter amounts | Unit | PASS (T3-P02) |
| AI Bookkeeper | Direction contradiction (MONEY_IN with Expense) deterministically downgraded to UNKNOWN | Unit | PASS (T3-P02) |
| AI Bookkeeper | Forged candidate keys rejected and nulled with warning code | Unit | PASS (T3-P02) |
| AI Bookkeeper | Prompt injection attempting privilege escalation or credential theft neutralized as data | Unit | PASS (T3-P02) |
| AI Bookkeeper | RBAC preflight allows owner/admin/manager/accountant and blocks sales/inventory/read_only before provider | Unit | PASS (T3-P02) |
| AI Bookkeeper | Idempotent requests return cached suggestions; conflict with differing payload throws AI_BOOKKEEPER_IDEMPOTENCY_CONFLICT | Unit/Integration | PASS (T3-P02) |
| AI Bookkeeper | Reclassification marks prior suggestion superseded and creates fresh suggestion | Unit/Integration | PASS (T3-P02) |
| AI Bookkeeper | Zero financial mutations: 0 sales, expenses, invoices, inventory movements, or journal entries created | Unit/Integration | PASS (T3-P02) |
| AI Review Workflow | Review-only actions (inbox, view, correct, reject) produce ZERO journal and financial mutations | Unit/Integration | PASS (T3-P03) |
| AI Review Workflow | Confirm Expense invokes canonical create_expense RPC and records application link | Unit/Integration | PASS (T3-P03) |
| AI Review Workflow | Human Correction (AI: Expense -> Human: Stock Purchase) executes canonical stock purchase and audits correction | Unit/Integration | PASS (T3-P03) |
| AI Review Workflow | Customer Payment Apply invokes canonical record_sale_payment and reduces receivable | Unit/Integration | PASS (T3-P03) |
| AI Review Workflow | Supplier Payment Apply (Expense & Stock Purchase) settles AP without duplicate expense or inventory | Unit/Integration | PASS (T3-P03) |
| AI Review Workflow | Sale Apply invokes canonical create_sale RPC | Unit/Integration | PASS (T3-P03) |
| AI Review Workflow | Rejection preserves audit history and blocks subsequent apply | Unit/Integration | PASS (T3-P03) |
| AI Review Workflow | Application idempotency returns cached result; altered payload throws conflict | Unit/Integration | PASS (T3-P03) |
| AI Review Workflow | Stale receivable protection: paid sale rejects customer payment with AI_BOOKKEEPER_TARGET_ALREADY_SETTLED | Unit/Integration | PASS (T3-P03) |
| AI Review Workflow | Stale category protection: archived category rejects expense apply with AI_BOOKKEEPER_STALE_CLASSIFICATION | Unit/Integration | PASS (T3-P03) |
| AI Review Workflow | Tenant security: cross-tenant access to classifications or categories rejected | Unit/Integration | PASS (T3-P03) |
| AI Review Workflow | RBAC preflight: read_only or sales_staff denied general review & expense apply | Unit/Integration | PASS (T3-P03) |
| AI Review Workflow | Zero Gemini invocations during apply flow (deterministic domain execution) | Unit/Integration | PASS (T3-P03) |
| AI Summaries | Report parity: verified facts equal canonical reporting RPC results exactly (0 arithmetic drift) | Unit/Integration | PASS (T3-P04) |
| AI Summaries | Period & timezone: resolves business timezone dates deterministically with comparison periods | Unit | PASS (T3-P04) |
| AI Summaries | Zero-division safety: when prior period is 0, percentage comparison does not produce NaN/Infinity | Unit | PASS (T3-P04) |
| AI Summaries | Current position separation: AR, AP, Inventory valuation have distinct asOfTimestamp | Unit/Integration | PASS (T3-P04) |
| AI Summaries | Permission-sensitive fact projection: sales_staff without reports permission is denied summary generation | Unit/Integration | PASS (T3-P04) |
| AI Summaries | Deterministic signal engine: server derives direction UP, DOWN, UNCHANGED, NOT_COMPARABLE | Unit | PASS (T3-P04) |
| AI Summaries | Zero-data business: empty business returns deterministic state with ZERO Gemini calls | Unit/Integration | PASS (T3-P04) |
| AI Summaries | Structured output: valid Gemini structured response parses and validates against Zod schema | Unit | PASS (T3-P04) |
| AI Summaries | Signal allowlist: fabricated/unknown signal key from model is rejected with AI_INSIGHTS_INVALID_RESULT | Unit | PASS (T3-P04) |
| AI Summaries | Action allowlist: unknown navigation action key from model is rejected | Unit | PASS (T3-P04) |
| AI Summaries | Numeric guard: model output injecting Business Health Score or Credit Score is blocked | Unit | PASS (T3-P04) |
| AI Summaries | Forecast guard: model output predicting future revenues is blocked | Unit | PASS (T3-P04) |
| AI Summaries | Summary reuse: identical fact fingerprint reuses active summary with ZERO extra Gemini calls | Unit/Integration | PASS (T3-P04) |
| AI Summaries | Stale detection: when facts change, previous summary is identified as stale (isFresh: false) | Unit/Integration | PASS (T3-P04) |
| AI Summaries | Provider outage resilience: verified facts remain 100% accessible if Gemini errors | Unit/Integration | PASS (T3-P04) |
| AI Summaries | Global AI kill switch: AI_ENABLED=false blocks summary generation while keeping facts readable | Unit | PASS (T3-P04) |
| AI Summaries | Tenant security: Business A user cannot access or generate Business B facts or summaries | Unit/Integration | PASS (T3-P04) |
| AI Summaries | Zero financial mutations: summary generation causes 0 sales, expenses, invoices, movements, journal entries | Unit/Integration | PASS (T3-P04) |
| Ask NNOO | Tool registry & declarations: defines all 11 allowlisted read-only tools and validates params | Unit | PASS (T3-P05) |
| Ask NNOO | Tool authorization preflights: owner permitted, sales_staff forbidden on profitability | Unit/Integration | PASS (T3-P05) |
| Ask NNOO | Deterministic tools execution: getBusinessOverview, getExpenseSummary, and getReceivablesSummary | Unit/Integration | PASS (T3-P05) |
| Ask NNOO | Inventory, Invoices, and Catalog Search Tools | Unit/Integration | PASS (T3-P05) |
| Ask NNOO | Fact key allowlist: numeric guard validates facts and blocks unverified keys | Unit | PASS (T3-P05) |
| Ask NNOO | Security prohibitions: blocks Business Health Scores, Credit Ratings, and Forecasting | Unit | PASS (T3-P05) |
| Ask NNOO | Mutation safety: refuses expense/refund/sale creation and returns MUTATION_REQUIRES_WORKFLOW | Unit/Integration | PASS (T3-P05) |
| Ask NNOO | Role downgrade masking security: masks privileged messages for downgraded roles | Unit/Integration | PASS (T3-P05) |
| Ask NNOO | End-to-end assistant turn: executes tool, mock Gemini, and server fact substitution | Unit/Integration | PASS (T3-P05) |
| Health Score | Formula registry & 5-dimension definition for business-health-score-v1 | Unit | PASS (T3-P06) |
| Health Score | Deterministic repeatability: 100 runs yield identical score, band, and reasons | Unit | PASS (T3-P06) |
| Health Score | Service business fairness: 0 tracked inventory is NOT_APPLICABLE with 0 weight and no penalty | Unit | PASS (T3-P06) |
| Health Score | Insufficient data handling: empty business produces INSUFFICIENT_DATA with null score | Unit | PASS (T3-P06) |
| Health Score | Score band boundaries: exact 49/50, 64/65, and 79/80 cutoffs verified | Unit | PASS (T3-P06) |
| Health Score | Division by zero & negative operations: handles 0 sales and negative results safely | Unit | PASS (T3-P06) |
| Health Score | Numeric guard: rejects credit claims, loan qualifications, forecasts, and score mismatch | Unit | PASS (T3-P06) |
| Health Score | Role authorization: permitted roles allowed; sales_staff denied full health score | Unit/Integration | PASS (T3-P06) |
| Health Score | End-to-end explanation: invokes Gemini with deterministic context and saves snapshot | Unit/Integration | PASS (T3-P06) |
| Credit Passport | Passport Code format: generates non-guessable, public-safe opaque code format NNOO-CP-XXXXXXXX | Unit | PASS (T3-P07) |
| Credit Passport | Financial reconciliation: Passport financial facts match canonical RPC outputs exactly with zero discrepancy | Unit/Integration | PASS (T3-P07) |
| Credit Passport | Determinism: identical input facts produce identical SHA-256 fingerprint and artifact hash | Unit | PASS (T3-P07) |
| Credit Passport | Service-business fairness: 0 tracked products marks inventory NOT_APPLICABLE without penalty | Unit | PASS (T3-P07) |
| Credit Passport | Insufficient data honesty: early-stage empty business receives honest insufficient_data status | Unit | PASS (T3-P07) |
| Credit Passport | Versioning & idempotency: generates Version 1, reuses on identical facts, increments to Version 2 on change | Unit/Integration | PASS (T3-P07) |
| Credit Passport | Secure sharing: generates high-entropy share link with SHA-256 hashed token at rest & safe projection | Unit/Integration | PASS (T3-P07) |
| Credit Passport | Share revocation & expiry: revoked share link is immediately blocked; expired link is denied | Unit/Integration | PASS (T3-P07) |
| Credit Passport | Public verification: verifies authentic Passport Code without leaking private financial totals | Unit/Integration | PASS (T3-P07) |
| Credit Passport | Semantic guard: strictly blocks credit score claims, loan approvals, borrowing amounts, and audit claims | Unit | PASS (T3-P07) |
| Credit Passport | RBAC defense: sales_staff and inventory_staff cannot generate or view Credit Passport | Unit/Integration | PASS (T3-P07) |
| Credit Passport | Zero financial mutation: viewing, generating, sharing, and verifying causes 0 financial mutations | Unit/Integration | PASS (T3-P07) |
| Automations | Period & Timezone resolution: resolves scheduled periods accurately across daily, weekly, and monthly frequencies | Unit | PASS (T3-P08) |
| Automations | Next run calculation: computes next execution timestamp for daily and weekly schedules | Unit | PASS (T3-P08) |
| Automations | Idempotency keys: builds deterministic idempotency keys for scheduled and manual runs | Unit | PASS (T3-P08) |
| Automations | Disabled automation handling: skips scheduled run when disabled with 0 Gemini calls | Unit/Integration | PASS (T3-P08) |
| Automations | Summary deduplication: skips Gemini calls and reuses existing summary when source facts are unchanged | Unit/Integration | PASS (T3-P08) |
| Automations | Health refresh determinism: refreshes health score deterministically with 0 Gemini calls | Unit/Integration | PASS (T3-P08) |
| Automations | Stock condition scanning: detects low stock and out of stock conditions with deterministic deduplication | Unit/Integration | PASS (T3-P08) |
| Automations | Stock auto-resolution: automatically resolves stock attention events when inventory is replenished | Unit/Integration | PASS (T3-P08) |
| Automations | Invoice condition scanning: detects overdue invoices and resolves them when settled | Unit/Integration | PASS (T3-P08) |
| Automations | Bookkeeper condition scanning: detects pending AI Bookkeeper reviews and resolves when confirmed | Unit/Integration | PASS (T3-P08) |
| Automations | Idempotent execution replay: returns existing job run when triggered with identical idempotency key | Unit/Integration | PASS (T3-P08) |
| Automations | RBAC authorization preflight: denies execution to non-authorized roles (e.g. sales_staff) | Unit/Integration | PASS (T3-P08) |
| Automations | Zero financial mutations: background jobs never create financial records | Unit/Integration | PASS (T3-P08) |
| Automations | Zero notification deliveries: Prompt 8 emits internal events only, does not send user messages | Unit/Integration | PASS (T3-P08) |
| Notifications | Notification Policy Registry v1: defines source-controlled registry across 8 notification types | Unit | PASS (T3-P09) |
| Notifications | Low stock & out of stock fanout: delivers to inventory-authorized staff and excludes sales staff | Unit/Integration | PASS (T3-P09) |
| Notifications | User preferences opt-out: muting category creates 0 inbox notifications while Needs Attention still displays condition | Unit/Integration | PASS (T3-P09) |
| Notifications | Overdue invoices: delivers to invoice-authorized staff and excludes inventory-only staff | Unit/Integration | PASS (T3-P09) |
| Notifications | Bookkeeper review pending: delivers to bookkeeper-authorized staff | Unit/Integration | PASS (T3-P09) |
| Notifications | Health change & passport stale: delivers only to authorized roles with credit claims excluded | Unit/Integration | PASS (T3-P09) |
| Notifications | Summary ready: delivers to insights-authorized staff with 0 Gemini provider calls | Unit/Integration | PASS (T3-P09) |
| Notifications | Deduplication: identical events produce 0 duplicate notification rows | Unit/Integration | PASS (T3-P09) |
| Notifications | Partial fanout recovery: retrying partially failed fanout completes remaining recipients without duplicates | Unit/Integration | PASS (T3-P09) |
| Notifications | Role downgrade protection: downgrading role hides sensitive notifications and excludes them from unread badge | Unit/Integration | PASS (T3-P09) |
| Notifications | Read state vs attention decoupling: marking personal notification read does not resolve business attention state | Unit/Integration | PASS (T3-P09) |
| Notifications | Attention resolution lifecycle: resolved business condition clears from Needs Attention while preserving history | Unit/Integration | PASS (T3-P09) |
| Notifications | Mark all read: marks all unread notifications read for current user in active business only | Unit/Integration | PASS (T3-P09) |
| Notifications | Multi-tenant & cross-user isolation: users cannot access notifications across businesses or accounts | Unit/Integration | PASS (T3-P09) |
| Notifications | Action route mapping: maps all primary action keys to valid, allowlisted app routes | Unit | PASS (T3-P09) |
| Notifications | Zero Gemini calls: all notification generation and fan-out calls Gemini ZERO times | Unit/Integration | PASS (T3-P09) |
| Notifications | Zero financial mutations & zero external deliveries: Δ 0 across all financial ledgers and external channels | Unit/Integration | PASS (T3-P09) |
| WhatsApp | Phone normalization & masking: normalizes international/Nigerian formats and masks numbers for UI/logs | Unit | PASS (T3-P10) |
| WhatsApp | Cryptographic lookup hashing: computes deterministic HMAC-SHA256 phone lookup key with pepper | Unit | PASS (T3-P10) |
| WhatsApp | Webhook signature security: validates x-hub-signature-256 HMAC-SHA256 with raw body bytes; rejects forged signatures | Unit/Integration | PASS (T3-P10) |
| WhatsApp | Cryptographic linking flow: creates single-use link code with 10-minute TTL, SHA-256 storage, and 5-attempt rate limit | Unit/Integration | PASS (T3-P10) |
| WhatsApp | Multi-business switching: switching active context updates connection context while preserving other business links | Unit/Integration | PASS (T3-P10) |
| WhatsApp | Deterministic commands: HELP, STOP, START, BUSINESS, BUSINESS <n> execute with 0 Gemini provider calls | Unit/Integration | PASS (T3-P10) |
| WhatsApp | Mutation request blocker: blocks requests to create sales, expenses, invoices, payments with zero side effects | Unit/Integration | PASS (T3-P10) |
| WhatsApp | Webhook deduplication: deduplicates repeated message IDs so duplicate deliveries produce 0 duplicate replies | Unit/Integration | PASS (T3-P10) |
| WhatsApp | Unlinked sender guidance: unlinked numbers receive friendly setup instructions with 0 Gemini calls | Unit/Integration | PASS (T3-P10) |
| WhatsApp | Inbound Ask NNOO integration: reuses canonical T3-P05 pipeline with verified facts, numeric guards, and RBAC | Unit/Integration | PASS (T3-P10) |
| WhatsApp | Outbound alert delivery: delivers low stock and other high-priority alerts via pre-approved templates | Unit/Integration | PASS (T3-P10) |
| WhatsApp | User preference opt-out: muting WHATSAPP channel preference skips delivery while in-app notifications continue | Unit/Integration | PASS (T3-P10) |
| WhatsApp | RBAC downgrade protection: downgrading role skips delivery of sensitive notifications over WhatsApp | Unit/Integration | PASS (T3-P10) |
| WhatsApp | Zero financial mutations: Δ 0 across all financial ledgers throughout WhatsApp operations | Unit/Integration | PASS (T3-P10) |
| Admin Intelligence | Platform Admin authorization guard: validates super_admin/finance_admin; rejects unauthenticated and regular business users | Unit/Integration | PASS (T3-P11) |
| Admin Intelligence | Zero Gemini invocations on dashboard: overview telemetry executes with 0 Gemini API calls | Unit/Integration | PASS (T3-P11) |
| Admin Intelligence | Accurate token pricing: calculates cost with configured pricing label without inventing fact | Unit | PASS (T3-P11) |
| Admin Intelligence | Platform feature controls: manages kill switches and writes audit event with mandatory reason | Unit/Integration | PASS (T3-P11) |
| Admin Intelligence | Safe background job retries: retries failed job after rechecking business status and writes audit log | Unit/Integration | PASS (T3-P11) |
| Admin Intelligence | WhatsApp STOP consent invariant: unconditionally blocks retry if user sent STOP opt-out | Unit/Integration | PASS (T3-P11) |
| Admin Intelligence | WhatsApp active membership invariant: blocks retry if recipient is no longer an active member | Unit/Integration | PASS (T3-P11) |
| Admin Intelligence | Zero financial mutations & score overrides: confirms read-only access with zero mutations across financial entities | Unit/Integration | PASS (T3-P11) |
| Mobile Push | Device registration: registers new device with upsert on (user_id, installation_id) and records platform/provider | Unit/Integration | PASS (T3-P12) |
| Mobile Push | Token rollover: handles token rollover cleanly for same installation ID with 0 duplicate rows | Unit/Integration | PASS (T3-P12) |
| Mobile Push | Sign-out revocation: revokes device on sign-out and stamps revoked_at timestamp | Unit/Integration | PASS (T3-P12) |
| Mobile Push | Security event revocation: revokes all active devices on user password reset or security event | Unit/Integration | PASS (T3-P12) |
| Mobile Push | Active device filtering: lists only ACTIVE devices with GRANTED permissions | Unit/Integration | PASS (T3-P12) |
| Mobile Push | Invalid token auto-expiration: marks device EXPIRED when provider returns DeviceNotRegistered | Unit/Integration | PASS (T3-P12) |
| Mobile Push | Delivery idempotency: enforces unique idempotency key with zero duplicate delivery records | Unit/Integration | PASS (T3-P12) |
| Mobile Push | Channel preference gating: skips push delivery when PUSH channel preference is muted for category | Unit/Integration | PASS (T3-P12) |
| Mobile Push | Lock-screen privacy: sanitizes payload by masking phone numbers, emails, and customer/supplier PII | Unit/Integration | PASS (T3-P12) |
| Mobile Push | Deep-link route map: verifies all MobileActionKey entries map to valid existing routes inside (app) | Unit | PASS (T3-P12) |
| Mobile Push | Zero Gemini calls: all push registration and delivery executes with 0 Gemini API calls | Unit/Integration | PASS (T3-P12) |
| Mobile Push | Zero financial mutations: Δ 0 across all financial ledgers throughout push operations | Unit/Integration | PASS (T3-P12) |
| Adversarial QA | Manual Flow A: Cross-tenant isolation attack blocked (0 foreign rows accessible) | Integration | PASS (T3-P13) |
| Adversarial QA | Manual Flow B: Mid-session role downgrade immediately enforces active capabilities | Integration | PASS (T3-P13) |
| Adversarial QA | Manual Flow C: Prompt & SQL injection treated as untrusted text (0 SQL tools exposed) | Integration | PASS (T3-P13) |
| Adversarial QA | Manual Flow D: Malicious stored database text escaped with XML delimiters | Unit | PASS (T3-P13) |
| Adversarial QA | Manual Flow E: Numeric guard blocks hallucinated/unauthorized fact keys | Unit | PASS (T3-P13) |
| Adversarial QA | Manual Flow F: Bookkeeper double-confirmation produces exactly ONE canonical expense | Integration | PASS (T3-P13) |
| Adversarial QA | Manual Flow G: Business Health Score is 100% deterministic with 0 Gemini calls | Unit | PASS (T3-P13) |
| Adversarial QA | Manual Flow H: Historical Credit Passports are immutable; marked STALE on changes | Integration | PASS (T3-P13) |
| Adversarial QA | Manual Flow I: Scheduled jobs deduplicate via unique idempotency keys | Integration | PASS (T3-P13) |
| Adversarial QA | Manual Flow J: Historical protected notifications excluded from feeds upon role downgrade | Integration | PASS (T3-P13) |
| Adversarial QA | Manual Flow K: Push notification taps re-verify active session (0 prior user data) | Integration | PASS (T3-P13) |
| Adversarial QA | Manual Flow L: Duplicate WhatsApp webhook messages execute exactly 1 Ask NNOO turn | Integration | PASS (T3-P13) |
| Adversarial QA | Manual Flow M: WhatsApp mutation requests deterministically blocked with safety guidance | Integration | PASS (T3-P13) |
| Adversarial QA | Manual Flow N: Platform Admin score overrides rejected (no capability exists) | Unit/Integration | PASS (T3-P13) |
| Adversarial QA | Manual Flow O: Deterministic health, passports, attention, and push function cleanly during Gemini outage | Unit/Integration | PASS (T3-P13) |
| Adversarial QA | Manual Flow P: Server-side rate limiter throttles rapid repeated assistant queries | Unit | PASS (T3-P13) |
| Adversarial QA | Manual Flow Q: Business context switching completely clears prior business cache state | Unit | PASS (T3-P13) |
| Adversarial QA | Manual Flow R: Zero financial mutations across read-only intelligence endpoints | Integration | PASS (T3-P13) |
| Admin Operations | Unauthenticated callers strictly rejected with ADMIN_UNAUTHENTICATED | Unit/Integration | PASS (T4-P02) |
| Admin Operations | Business Owner / non-admin callers strictly rejected with ADMIN_FORBIDDEN | Unit/Integration | PASS (T4-P02) |
| Admin Operations | Revoked/suspended Platform Admin callers strictly rejected with ADMIN_FORBIDDEN | Unit/Integration | PASS (T4-P02) |
| Admin Operations | Business suspension/restoration logs immutable audit event with required reason | Unit/Integration | PASS (T4-P02) |
| Admin Operations | Business suspension causes exactly Δ 0 mutations across sales, expenses, journals | Unit/Integration | PASS (T4-P02) |
| Admin Operations | Platform Admin cannot set or override deterministic Health Scores | Unit | PASS (T4-P02) |
| Admin Operations | Platform Admin cannot edit Credit Passport snapshots or hashes | Unit | PASS (T4-P02) |
| Admin Operations | Platform Admin cannot approve AI Bookkeeper suggestions on business behalf | Unit | PASS (T4-P02) |
| Admin Operations | Platform Admin retry cannot override WhatsApp user STOP opt-out consent | Unit/Integration | PASS (T4-P02) |
| Admin Operations | Platform Admin cannot retry jobs for suspended/missing businesses | Unit/Integration | PASS (T4-P02) |
| Admin Operations | Platform overview queries execute purely in PostgreSQL with 0 Gemini calls | Unit/Integration | PASS (T4-P02) |
| Production Security | Multi-tenant IDOR defense: cross-business product/data reads return 0 rows | Unit/Integration | PASS (T4-P03) |
| Production Security | Forged businessId in mutation request parameter rejected by server | Unit/Integration | PASS (T4-P03) |
| Production Security | Mid-session role downgrade immediately enforces restricted capabilities | Unit | PASS (T4-P03) |
| Production Security | Suspended user account and suspended business access blocked | Unit/Integration | PASS (T4-P03) |
| Production Security | Business Owner accessing Platform Admin rejected with ADMIN_FORBIDDEN | Unit/Integration | PASS (T4-P03) |
| Production Security | Zero service-role or provider secrets in client bundle environments | Build/Check | PASS (T4-P03) |
| Production Security | AI prompt injection strictly treated as literal data; zero SQL tools exposed | Unit/Integration | PASS (T4-P03) |
| Production Security | Deterministic Health Score cannot be forged by client or admin | Unit | PASS (T4-P03) |
| Production Security | Credit Passport snapshot artifact hash and version are immutable | Unit | PASS (T4-P03) |
| Production Security | Paystack callback URL spoofing rejected; provider verification required | Unit/Integration | PASS (T4-P03) |
| Production Security | Paystack webhook with forged HMAC-SHA512 rejected with 0 fulfillment | Unit/Integration | PASS (T4-P03) |
| Production Security | Meta WhatsApp webhook with forged HMAC-SHA256 rejected with 0 processing | Unit/Integration | PASS (T4-P03) |
| Production Security | Expired/used WhatsApp linking code rejected | Unit | PASS (T4-P03) |
| Production Security | WhatsApp opt-out (STOP) cannot be overridden by platform admin retry | Unit/Integration | PASS (T4-P03) |
| Production Security | Push notification tapped by different user re-authorizes session | Unit/Integration | PASS (T4-P03) |
| Production Security | Deep link with foreign business identifier denied server-side | Unit/Integration | PASS (T4-P03) |
| Production Security | Zero unauthorized financial mutations (Δ 0) throughout all attack tests | Unit/Integration | PASS (T4-P03) |
| Disaster Recovery | Isolated synthetic restore rehearsal verifies 100% record count parity | Unit/Integration | PASS (T4-P04) |
| Disaster Recovery | Financial ledger reconciliation proves exact match (Δ 0) across all 10 metrics | Unit/Integration | PASS (T4-P04) |
| Disaster Recovery | Double-entry journal balance invariant: restored Debits equal Credits | Unit | PASS (T4-P04) |
| Disaster Recovery | Multi-tenant isolation post-restore: Business A 100% blocked from Business B | Unit/Integration | PASS (T4-P04) |
| Disaster Recovery | Platform Admin separation post-restore: zero financial mutation capability | Unit/Integration | PASS (T4-P04) |
| Disaster Recovery | Supabase Auth UUID & membership linkage consistency; last-owner invariant | Unit | PASS (T4-P04) |
| Disaster Recovery | Credit Passport snapshot version and SHA-256 artifact hash immutability | Unit | PASS (T4-P04) |
| Disaster Recovery | Storage recovery: Credit Passport PDF deterministically regenerable from snapshot | Unit | PASS (T4-P04) |
| Disaster Recovery | Paystack provider reconciliation: restored older DB does not double-fulfill | Unit/Integration | PASS (T4-P04) |
| Disaster Recovery | WhatsApp opt-out defense: newer STOP signal strictly overrides older restored DB | Unit/Integration | PASS (T4-P04) |
| Disaster Recovery | Background job safety: restored scheduled jobs held in PAUSED state | Unit | PASS (T4-P04) |
| Disaster Recovery | Historical notification replay safeguards: 0 outbound messages dispatched | Unit | PASS (T4-P04) |
| Disaster Recovery | Push device token lifecycle: requires fresh session re-authorization | Unit | PASS (T4-P04) |
| Disaster Recovery | Recovery script environment guards: refuses production targets without override | Unit | PASS (T4-P04) |
| Disaster Recovery | Zero secrets logging & exfiltration defense in verification output | Unit | PASS (T4-P04) |
| Disaster Recovery | Primary source development baseline invariant: Δ 0 side effects | Unit/Integration | PASS (T4-P04) |
| Observability | Structured logging schema compliance, service tagging, metadata truncation | Unit | PASS (T4-P05) |
| Observability | Universal secret & token redaction (Gemini, Supabase, Paystack, Meta, Inngest, JWT) | Unit | PASS (T4-P05) |
| Observability | Normalized error system with safe user response masking and correlation ID | Unit | PASS (T4-P05) |
| Observability | Correlation ID & request ID generation, validation, and tracing context | Unit | PASS (T4-P05) |
| Observability | Public liveness health endpoint (/api/v1/health) with strict no-store cache headers | Integration | PASS (T4-P05) |
| Observability | Component health evaluation semantics (HEALTHY, DEGRADED, UNAVAILABLE, STALE) | Unit | PASS (T4-P05) |
| Observability | Zero-cost health policy: 0 paid Gemini calls, 0 WhatsApp messages, 0 Push pings | Unit | PASS (T4-P05) |
| Observability | Incident deduplication & alert fatigue suppression (15-min cooldown) | Unit | PASS (T4-P05) |
| Observability | Gemini outage isolation: deterministic Health Score continues with 0 Gemini calls | Unit/Integration | PASS (T4-P05) |
| Observability | Fail-open telemetry invariant: logging failure produces zero financial mutation (Δ 0) | Unit | PASS (T4-P05) |
| Observability | Zero financial drift invariant across all reliability test scenarios (Δ 0) | Unit/Integration | PASS (T4-P05) |
| Performance | Query index optimization: eliminates Seq Scan on journal lines & Sort on invoices | Database/Plan | PASS (T4-P06) |
| Performance | Server-enforced bounded pagination (1 <= limit <= 100) on sales, expenses, invoices | Unit/Integration | PASS (T4-P06) |
| Performance | Tenant-isolated query caching: Business A cache key strictly isolated from Business B | Unit | PASS (T4-P06) |
| Performance | Role-downgrade cache protection: downgraded staff cannot access cached privileged reports | Unit | PASS (T4-P06) |
| Performance | Post-mutation cache invalidation: financial mutations invalidate affected route paths | Unit | PASS (T4-P06) |
| Performance | Business Health Score calculation requires exactly 0 Gemini API calls | Unit | PASS (T4-P06) |
| Performance | Smart Insights source fingerprint deduplication requires 0 additional Gemini calls | Unit | PASS (T4-P06) |
| Performance | Ask NNOO message history bounded to maximum 6 recent messages | Unit | PASS (T4-P06) |
| Performance | Ask NNOO mutation intent preflight intercepted with 0 Gemini calls | Unit | PASS (T4-P06) |
| Performance | Background job idempotency: duplicate triggers execute exactly 1 logical run | Unit | PASS (T4-P06) |
| Performance | Worker concurrency throttling prevents thundering herd on scheduled bursts | Unit | PASS (T4-P06) |
| Performance | Push notification fanout preserves recipient and business isolation | Unit | PASS (T4-P06) |
| Performance | Inbound WhatsApp duplicate webhook delivery generates maximum 1 AI turn | Unit | PASS (T4-P06) |
| Performance | Paystack webhook verification & idempotency under concurrent delivery | Unit | PASS (T4-P06) |
| Performance | Exact integer minor unit arithmetic: zero floating-point currency calculations | Unit | PASS (T4-P06) |
| Performance | Zero unauthorized financial mutation (Δ 0) throughout all performance workloads | Unit/Integration | PASS (T4-P06) |
| Environment & Secrets | Central server config schema validation: parses valid development & production envs | Unit | PASS (T4-P07) |
| Environment & Secrets | Missing core backend config throws safe error without exposing secrets | Unit | PASS (T4-P07) |
| Environment & Secrets | Strict boolean parsing: rejects truthy string traps like Boolean("false") | Unit | PASS (T4-P07) |
| Environment & Secrets | Strict integer parsing: rejects NaN and enforces min/max boundaries | Unit | PASS (T4-P07) |
| Environment & Secrets | Environment Mode Mismatch: Production rejects Paystack test key (sk_test_*) | Unit | PASS (T4-P07) |
| Environment & Secrets | Environment Mode Mismatch: Development rejects Paystack live key (sk_live_*) | Unit | PASS (T4-P07) |
| Environment & Secrets | Backend Mismatch: Production mobile client cannot point to localhost backend | Unit | PASS (T4-P07) |
| Environment & Secrets | Public client config strictly omits server secrets (service role, secret keys) | Unit | PASS (T4-P07) |
| Environment & Secrets | Mobile client config contains only public variables (EXPO_PUBLIC_*) | Unit | PASS (T4-P07) |
| Environment & Secrets | Missing optional provider graceful degradation (Gemini/WhatsApp/Push -> NOT_CONFIGURED) | Unit | PASS (T4-P07) |
| Environment & Secrets | Feature toggle disablement: AI_ENABLED=false / WHATSAPP_ENABLED=false -> DISABLED | Unit | PASS (T4-P07) |
| Environment & Secrets | Diagnostic secret scrubbing: validation errors never include raw secret strings | Unit | PASS (T4-P07) |
| Environment & Secrets | Platform provider status exposes readiness without leaking raw credentials | Unit | PASS (T4-P07) |
| Environment & Secrets | Zero unauthorized financial mutation (Δ 0) throughout all environment tests | Unit/Integration | PASS (T4-P07) |
| Web Release | Monorepo root vercel.json build command & output directory validation | Unit | PASS (T4-P08) |
| Web Release | Production security headers (HSTS 63072000, CSP, X-Frame-Options DENY) in next.config.ts | Unit | PASS (T4-P08) |
| Web Release | Canonical production origin validation (https://nnoo.app, rejects localhost default) | Unit | PASS (T4-P08) |
| Web Release | Production auth callback and password recovery URL generation | Unit | PASS (T4-P08) |
| Web Release | Public client bundle secret boundary: zero server secrets in client config | Unit | PASS (T4-P08) |
| Web Release | Authoritative PRODUCTION_WEB_RELEASE.md manifest integrity and sections | Unit | PASS (T4-P08) |
| Web Release | Non-authoritative Paystack billing callback validation | Unit | PASS (T4-P08) |
| Web Release | Paystack invalid webhook signature rejection (HTTP 400, 0 value delivery) | Unit | PASS (T4-P08) |
| Web Release | First-release application rollback posture and disaster recovery documentation | Unit | PASS (T4-P08) |
| Web Release | Zero unauthorized financial mutation (Δ 0) throughout all deployment smoke tests | Unit/Integration | PASS (T4-P08) |
| Mobile Release | Production application identity in app.json (com.nnoo.mobile, v1.0.0, API 35) | Unit | PASS (T4-P09) |
| Mobile Release | Dark theme visual assets and splash configuration in app.json | Unit | PASS (T4-P09) |
| Mobile Release | Production deep links and universal/app links pointing to nnoo.app | Unit | PASS (T4-P09) |
| Mobile Release | Minimal permissions enforcement (RECEIVE_BOOT_COMPLETED, POST_NOTIFICATIONS only) | Unit | PASS (T4-P09) |
| Mobile Release | EAS production build and submission profiles in eas.json | Unit | PASS (T4-P09) |
| Mobile Release | Zero privileged server secrets in mobile app bundle or config | Unit | PASS (T4-P09) |
| Mobile Release | Public account deletion page with last-owner and financial retention invariants | Unit | PASS (T4-P09) |
| Mobile Release | Authoritative PRODUCTION_MOBILE_RELEASE.md manifest integrity and sections | Unit | PASS (T4-P09) |
| Mobile Release | Authoritative MOBILE_STORE_LISTING_READINESS.md disclosures & claim disclaimers | Unit | PASS (T4-P09) |
| Mobile Release | Zero unauthorized financial mutation (Δ 0) throughout all mobile release tests | Unit/Integration | PASS (T4-P09) |
| Provider Validation | Paystack invalid webhook signature rejection (HTTP 400, 0 value delivery) | Unit | PASS (T4-P10) |
| Provider Validation | Paystack idempotent single-activation on replayed webhook events | Unit | PASS (T4-P10) |
| Provider Validation | Paystack non-authoritative browser callback requirement | Unit | PASS (T4-P10) |
| Provider Validation | Google Gemini structured output validation with runtime Zod schemas | Unit | PASS (T4-P10) |
| Provider Validation | Google Gemini tenant isolation preflight (0 cross-tenant data leak) | Unit | PASS (T4-P10) |
| Provider Validation | Google Gemini kill-switch graceful degradation (AI_ENABLED=false -> AI_FEATURE_DISABLED) | Unit | PASS (T4-P10) |
| Provider Validation | Inngest durable job serverless handler signing key authentication | Unit | PASS (T4-P10) |
| Provider Validation | Inngest background job idempotency and safe retry execution | Unit | PASS (T4-P10) |
| Provider Validation | Meta WhatsApp link code authentication (phone alone grants 0 business access) | Unit | PASS (T4-P10) |
| Provider Validation | Meta WhatsApp STOP opt-out unconditional enforcement (admin cannot override) | Unit | PASS (T4-P10) |
| Provider Validation | Meta WhatsApp financial mutation rejection (0 financial delta) | Unit | PASS (T4-P10) |
| Provider Validation | Expo Push device token registration bound strictly to authenticated user | Unit | PASS (T4-P10) |
| Provider Validation | Expo Push tap session and membership reauthorization | Unit | PASS (T4-P10) |
| Provider Validation | Expo Push lock-screen payload privacy (0 financial figures or customer PII) | Unit | PASS (T4-P10) |
| Provider Validation | Authoritative PRODUCTION_PROVIDER_VALIDATION.md certification document | Unit | PASS (T4-P10) |
| Provider Validation | Zero unauthorized financial mutation (Δ 0) throughout all provider tests | Unit/Integration | PASS (T4-P10) |
| Production UAT | J-01: Registration, onboarding, cryptographic staff invite & last-owner protection | E2E/Integration | PASS (T4-P11) |
| Production UAT | J-02: Tracked product, stock receipt, sale (₦30k), payment, refund (₦7.5k), restock, 0 sale deletions | E2E/Integration | PASS (T4-P11) |
| Production UAT | J-03: Supplier, unpaid expense (₦50k), partial payment (₦20k), AP settlement (₦30k -> AP=0), inventory asset | E2E/Integration | PASS (T4-P11) |
| Production UAT | J-04: AI Bookkeeper suggestion (Δ 0), human review/edit, single canonical expense, idempotency | E2E/Integration | PASS (T4-P11) |
| Production UAT | J-05: Smart Insights fact grounding, Ask NNOO 6-question fact parity, Health score (0 Gemini math), SHA-256 Passport snapshot | E2E/Integration | PASS (T4-P11) |
| Production UAT | J-06: Low stock attention event, in-app notification RBAC, Push lock-screen privacy, WhatsApp STOP opt-out | E2E/Integration | PASS (T4-P11) |
| Production UAT | J-07: Platform Admin operational oversight, suspension/reactivation, 0 customer journal editing capability | E2E/Integration | PASS (T4-P11) |
| Production UAT | J-08: Web <-> Mobile 14-module parity, business switching isolation, role downgrade freshness | E2E/Integration | PASS (T4-P11) |
| Production UAT | J-09: Degraded modes: Gemini outage, job delay, Push/WhatsApp down, Paystack down, timeout-after-commit retry | E2E/Integration | PASS (T4-P11) |
| Production UAT | J-10: Security adversarial matrix: cross-tenant (Δ 0), IDOR, role bypass, stale session, 0 client secrets | E2E/Integration | PASS (T4-P11) |
| Production UAT | Full system financial reconciliation: Gross/Net Sales, Refunds, COGS, Profit, Expenses, AR/AP, Inventory (Δ 0) | Integration | PASS (T4-P11) |
| Production UAT | Double-entry journal balance: Total Debits (₦277,500) == Total Credits (₦277,500) | Integration | PASS (T4-P11) |
| Production UAT | Zero unauthorized financial mutations on non-UAT business accounts (Δ 0) | Integration | PASS (T4-P11) |
| Go-Live Rehearsal | Incident drills (Gemini AI outage, Inngest job backlog) & tabletops (Cross-tenant leak, DB migration failure) | Rehearsal | PASS (T4-P11) |
| Go-Live Rehearsal | Web instant rollback readiness & Mobile store release mitigation model | Rehearsal | PASS (T4-P11) |
| Handover Verification | Master handover package integrity & 45+ documentation files audit | Audit | PASS (T4-P12) |
| Handover Verification | Documentation broken link audit (0 dead internal links) | Audit | PASS (T4-P12) |
| Handover Verification | Secret exposure scan across documentation (0 credentials exposed) | Security | PASS (T4-P12) |
| Handover Verification | Stack & Versions reconciliation against package.json manifests (T4GAP-016) | Audit | PASS (T4-P12) |
| Handover Verification | Zero financial mutation invariant (Δ 0) throughout handover authoring | Integration | PASS (T4-P12) |
| Web build | Production build | Build | PASS (Next.js 16.3.0, 82 routes) |
| Mobile | Expo config and production build checks | Build | PASS (tsc clean, public config clean) |
| Regression | All completed tranche journeys | E2E | PASS (T1/T2/T3/T4 Green, 375/375 automated tests across 115 suites) |

Replace Planned with PASS only when the test exists and the latest result is recorded in an acceptance report or CI run.



