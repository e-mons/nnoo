# Risk Register

| Risk | Impact | Control | Status |
|---|---|---|---|
| One-month scope is too broad | Quality and schedule failure | One feature at a time; hard tranche boundaries; T4 release scope freeze | Controlled (T4-P01) |
| Web and mobile logic drifts | Conflicting totals and behaviour | Shared contracts/domain rules; cross-platform tests | Controlled |
| Supabase live state drifts from repository | Unrepeatable backend | MCP plus mandatory migrations and generated types | Controlled |
| Cross-business data exposure | Severe privacy failure | RLS, server checks, tenant tests across all 60 tables | Controlled (100% RLS verified) |
| Payment double fulfilment | Financial loss | Signature, verification, amount checks, idempotency | Controlled (T2-P10) |
| AI invents financial facts | Wrong business advice | Deterministic NNOO calculation; Gemini explains only; runtime Zod validation; numeric guards | Controlled (T3-P01..T3-P13) |
| Prompt injection / jailbreak attempts | Security & data leak | Boundary delimiters; untrusted data tagging; server authorization before provider | Controlled (T3-P01..T3-P13) |
| AI provider outage / rate limit | Service disruption | Bounded timeout, exponential retry backoff, graceful fallback; core NNOO accounting unaffected | Controlled (T3-P01..T3-P13) |
| Cross-tenant AI context leak | Tenant privacy breach | Server-resolved business membership preflight; no client tenant trust; RLS enforcement | Controlled (T3-P01..T3-P13) |
| External provider credentials delay (Meta WhatsApp, APNs/FCM) | Deployment blockage | Explicit external dependency tracking (T4-P10); webhook signatures, link code security, and receipt semantics certified; live credential linking pending store submission | Controlled (T4-P10) |
| Production database disaster / data loss | Business continuity failure | Automated backups, PITR, documented DR runbooks, financial parity Δ 0, isolated restore rehearsal | Controlled (T4-P04) |
| Production environment secrets leakage | Security breach | Strict server-only secret injection, zero client keys, @nnoo/config schema, mode mismatch assertions, Runbook 18 | Controlled (T4-P03, T4-P07) |
| Mobile app store rejection | Release delay | Expo config, Target API 35, minimal permissions, in-app & web account deletion, store disclosure matrices | Controlled (T4-P09) |
| Production deployment without evidence | Service failure | Release checklist, PRODUCTION_WEB_RELEASE manifest, vercel.json, smoke matrix, Δ 0 verification | Controlled (T4-P08) |
| Paystack real monetary live test | Financial exposure | Explicit human authorization gate; no unauthorized test charges; server-verified single-activation idempotency | Controlled (T4-P10) |
| Gemini API key lifecycle / migration | AI service disruption | Server-only key; runtime Zod validation; kill switch degrades gracefully; credential monitoring | Controlled (T4-P10) |
| WhatsApp unsigned webhook processing | Data/security breach | HMAC-SHA256 signature verification on all inbound; invalid signatures produce 0 processing | Controlled (T4-P10) |
| Push notification to wrong user | Privacy breach | Token bound to authenticated user; tap reauthorizes session; wrong-user access denied | Controlled (T4-P10) |
| Provider outage cascading to accounting | Financial data corruption | Failure isolation matrix verified; Paystack/Gemini/WhatsApp/Push/Inngest outages produce Δ 0 on ledgers | Controlled (T4-P10) |
| Full system UAT financial drift | Mathematical inaccuracy | End-to-end UAT journeys 1–10 executed with exact Δ 0 reconciliation across all operational & general ledger records | CLOSED (T4-P11) |
| Incomplete production operational handover | Operations failure post-launch | Dedicated P12 documentation package (45+ files), operations runbooks, and handover package for David Bako | CLOSED (T4-P12) |
| Premature release activation prior to P13 acceptance | Premature release | Hard tranche boundaries; P13 formal gate executed; baselines protected | CLOSED (T4-P13) |
| Post-handover account ownership transfer delays | Administrative delay | Explicit HANDOVER_ACTIONS_REQUIRED.md tracking matrix for David Bako | POST-ACCEPTANCE (T4-P13) |
