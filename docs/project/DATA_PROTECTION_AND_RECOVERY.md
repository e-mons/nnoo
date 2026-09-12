# NNOO Data Protection, Backup, Restore & Disaster Recovery Architecture

**Project:** NNOO — Africa's AI Business Operating System  
**Owner & Developer:** David Bako  
**Status:** **Authoritative Production Data Protection & Disaster Recovery Specification**  
**Governance Version:** 1.0.0  
**Effective Date:** 19 August 2026  

---

## 1. Executive Summary & Recovery Trust Model

The NNOO Data Protection and Disaster Recovery (DR) architecture defines the authoritative policies, mechanisms, runbooks, and verification gates required to safely reconstruct the NNOO system in the event of an infrastructure outage, catastrophic data loss, accidental deletion, bad migration, or external provider divergence.

### The Permanent Recovery Trust Model

```text
               PRIMARY DISASTER OCCURS / DATABASE CORRUPTED
                                    │
                                    ▼
                     ISOLATED RECOVERY ENVIRONMENT
           (Outbound Side Effects Killed: Paystack, Push, WhatsApp)
                                    │
                                    ▼
                      RESTORE FROM PROTECTED BACKUP
                    (Supabase PITR / pg_dump logical)
                                    │
                                    ▼
                      SCHEMA & MIGRATION RECONCILIATION
            (Restored DB = Repository Migrations = Generated Types)
                                    │
                                    ▼
                      AUTH & TENANT ISOLATION RECHECK
            (100% RLS Enforcement, Business A blocked from B)
                                    │
                                    ▼
                      FINANCIAL LEDGER RECONCILIATION
           (Exact Money Match Δ 0, Debits = Credits, Invoices)
                                    │
                                    ▼
                      EXTERNAL PROVIDER RECONCILIATION
        (Paystack Webhooks Idempotent, WhatsApp STOP Preserved, Jobs Paused)
                                    │
                                    ▼
                     FORMAL RETURN-TO-SERVICE GATE PASS
                                    │
                                    ▼
                             SAFE GO-LIVE
```

---

## 2. Authoritative Data Inventory

NNOO data spans five discrete domains across database tables, object storage, authentication, source assets, and environment configurations:

### 2.1 Core PostgreSQL Database (60 Tables)

| Domain | Key Database Tables | Criticality | System of Record |
|---|---|---|---|
| **Identity & Tenancy** | `profiles`, `businesses`, `business_memberships`, `business_invitations`, `platform_admins`, `public_enquiries` | Critical | Supabase PostgreSQL |
| **Financial Accounting** | `chart_of_accounts`, `fiscal_periods`, `journal_entries`, `journal_lines`, `audit_ledger_events` | Critical | Supabase PostgreSQL |
| **Catalogue & Stock** | `product_categories`, `products`, `services`, `inventory_locations`, `inventory_levels`, `inventory_movements`, `inventory_adjustments`, `stock_takes`, `stock_take_items` | Critical | Supabase PostgreSQL |
| **Counterparties** | `customers`, `suppliers` | Critical | Supabase PostgreSQL |
| **Sales & Revenue** | `sales`, `sale_items`, `sale_payments`, `refunds`, `receipts` | Critical | Supabase PostgreSQL |
| **Expenses & Outflows** | `expense_categories`, `expenses`, `expense_items` | Critical | Supabase PostgreSQL |
| **Billing & Invoices** | `invoices`, `invoice_items`, `invoice_payments`, `billing_plans`, `business_subscriptions`, `paystack_webhook_receipts`, `billing_access_overrides` | Critical | Supabase PostgreSQL & Paystack |
| **AI Intelligence** | `ai_invocation_logs`, `ai_bookkeeper_classifications`, `ai_bookkeeper_reviews`, `verified_business_summaries`, `ask_nnoo_conversations`, `ask_nnoo_messages`, `business_health_snapshots`, `credit_passport_snapshots`, `credit_passport_shares` | Immutable Audit / Derived | Supabase PostgreSQL |
| **Operations & Messaging** | `automation_rules`, `automation_execution_logs`, `attention_items`, `notifications`, `user_notification_preferences`, `whatsapp_link_requests`, `whatsapp_connections`, `whatsapp_message_logs`, `platform_audit_events`, `platform_feature_controls`, `push_devices`, `push_notification_deliveries` | Operations / Ephemeral | Supabase PostgreSQL |

### 2.2 Supabase Storage Buckets

| Bucket Name | Purpose | Criticality | Recoverability / Source of Truth |
|---|---|---|---|
| `business-logos` | Business branding & company logos | Non-Critical | User-uploaded; recoverable via business re-upload if lost. |
| `credit-passport-artifacts` | Rendered Credit Passport PDFs | Derived / Immutable | Deterministically reproducible from canonical `credit_passport_snapshots` table. |
| `receipt-documents` | Receipt attachments and expense proofs | Important | User-uploaded documents; should be captured in storage backups. |

### 2.3 Supabase Authentication State

- **`auth.users` & `auth.identities`:** User credentials, password hashes, email verification flags, and UUID mappings.
- **Dependency:** All NNOO memberships and profiles reference `auth.users(id)`. A database restoration must restore `auth` schema or preserve identity UUID mappings to prevent orphaned records.

### 2.4 Source Repository & Build Assets

- Git repository (GitHub), lockfile (`pnpm-lock.yaml`), immutable migration files (`supabase/migrations/*.sql`), generated database types (`packages/supabase/src/types.ts`), and deployment configurations (`apps/web`, `apps/mobile`).

### 2.5 Environment & Provider Configuration

- Supabase API URLs & Keys, Paystack Secret/Public keys, Gemini API key, Inngest Signing keys, and Meta WhatsApp tokens. Managed exclusively via secure environment secret stores (Vercel / Expo EAS / GitHub Secrets), never in Git.

---

## 3. Data Classification & Recovery Priority

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. CRITICAL SYSTEM OF RECORD (Recovery Priority: IMMEDIATE)           │
│    - Double-entry Journal, Sales, Expenses, Payments, Inventory        │
│    - Business Tenancy, Memberships, Auth User UUIDs, Invoices          │
├────────────────────────────────────────────────────────────────────────┤
│ 2. IMPORTANT IMMUTABLE / AUDIT (Recovery Priority: HIGH)               │
│    - Credit Passport Snapshots, AI Review Confirmations, Audit Events  │
│    - Paystack Webhook Receipts & Subscription States                   │
├────────────────────────────────────────────────────────────────────────┤
│ 3. REGENERABLE DERIVED DATA (Recovery Priority: MEDIUM)               │
│    - Credit Passport PDF Artifacts (rebuilt from canonical snapshot)   │
│    - Business Health Score Metrics (recomputed from ledger inputs)     │
│    - Aggregated operational analytics and financial dashboards         │
├────────────────────────────────────────────────────────────────────────┤
│ 4. EPHEMERAL / RECREATABLE (Recovery Priority: LOW)                    │
│    - WhatsApp temporary linking tokens (10-min TTL)                    │
│    - Cached AI summaries, transient push tokens, delivery retry logs   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Recovery Objectives (RPO & RTO)

### 4.1 Business Target Status

- **Formal Business RPO:** `FORMAL BUSINESS RPO NOT YET APPROVED` (Pending final commercial sign-off by David Bako in T4-P12).
- **Formal Business RTO:** `FORMAL BUSINESS RTO NOT YET APPROVED` (Pending final operations sign-off).

### 4.2 Current Technical Capabilities Matrix

| System / Layer | Technical Recovery Capability | Technical RPO | Estimated Technical RTO | Infrastructure Requirements / Notes |
|---|---|---|---|---|
| **Core Database (Supabase)** | Point-in-Time Recovery (PITR) / Daily Backups | ~2 minutes (PITR enabled) / 24 hours (Daily) | 15–30 minutes | Requires Supabase Pro tier for continuous WAL archiving (PITR). |
| **Database (Logical Export)** | `pg_dump` snapshot | Point of last dump | 10–20 minutes | Operator-initiated logical backup prior to major release. |
| **Object Storage** | Deterministic PDF regeneration + S3 replica | 0 for PDFs; 24 hrs for user uploads | 10 minutes | Credit Passport PDFs are 100% regenerable from DB snapshots. |
| **Auth Identities** | Bundled in Supabase Managed Backup | Same as DB RPO | 15 minutes | Managed inside PostgreSQL `auth` schema by Supabase. |
| **External Paystack State** | Live Provider API Re-synchronization | Real-time (0 loss) | 5 minutes | Re-queries Paystack API to reconcile un-synced charges. |
| **WhatsApp Messaging** | Inviolable Opt-out Preservation | Real-time (0 loss) | Immediate | Newer STOP webhook events override older restored DB states. |
| **Scheduled Jobs (Inngest)** | Paused Mode Re-initialization | 0 loss | 5 minutes | Jobs restored in PAUSED state to prevent duplicate runs. |

---

## 5. Database Backup Strategy & Security

### 5.1 Defense-in-Depth Backup Layers

1. **Supabase Managed Continuous Backups:** WAL-based continuous archiving providing Point-in-Time Recovery to any second within the retention window (Plan-dependent).
2. **Immutable Repository Migrations:** Every database schema modification exists as an immutable, versioned SQL script in `supabase/migrations/`.
3. **Pre-Deployment Logical Snapshots:** For high-risk releases, operators take a dedicated logical export (`pg_dump`) to an encrypted, access-controlled vault.

### 5.2 Backup Confidentiality & Security Rules

- **Zero Git Storage:** Backup dumps (`*.dump`, `*.tar`, `*.sql.bak`) are strictly ignored in `.gitignore` and must NEVER be committed to source control.
- **Zero Public Bucket Storage:** Backups must never be uploaded to public Supabase buckets or public cloud storage.
- **Zero Plaintext Secrets:** Backup automation tools and runbooks do not store database passwords in code or documentation.
- **Strict Role Access:** Only authorized platform administrators may access backup snapshots or initiate restore procedures.
- **No User/Admin Download Endpoint:** Platform Admin web UI does not expose a "Download Full Database Dump" button to prevent bulk data exfiltration.

---

## 6. External State Reconciliation Matrix

When restoring an older database snapshot, external provider state may have progressed beyond the backup point. The following rules govern reconciliation:

| Provider / Subsystem | Restored DB State | External Provider State | Reconciliation Rule | Authority |
|---|---|---|---|---|
| **Paystack SaaS Billing** | Subscription marked `inactive` or missing | Paystack confirms successful charge | Reconcile idempotently from Paystack API; mark subscription `active` with zero duplicate charge. | Paystack API |
| **Meta WhatsApp Business** | User marked `opted_out = false` (older state) | User sent `STOP` opt-out after backup | **INVIOLABLE:** Newer `STOP` opt-out wins. System enforces `opted_out = true`; zero messages sent. | Newer Webhook Event |
| **Inngest Durable Jobs** | Jobs in scheduled state | Provider already ran job or queued new runs | Initialize restored jobs in `PAUSED` mode; inspect queue before resuming to prevent job storm. | Operator Review |
| **Mobile Push Notifications** | Historical notifications in queue | Push tokens may be stale or reassigned | Invalidate active push queue; require fresh client session verification before dispatching alerts. | Active App Session |
| **Credit Passport PDF** | PDF missing from storage | Immutable snapshot exists in DB | Deterministically re-render PDF using standard template; verify SHA-256 matches snapshot hash. | Canonical Snapshot Table |

---

## 7. Data Retention & Pruning Policy (`T4GAP-005`)

To balance historical audit compliance with storage minimization and user privacy:

| Data Category | Target Table | Retention Window | Pruning Action & Safeguards |
|---|---|---|---|
| **Financial Ledgers** | `journal_entries`, `sales`, `expenses`, `invoices` | Indefinite (7+ Years) | **NEVER PRUNED.** Permanent canonical accounting records. |
| **Credit Passports** | `credit_passport_snapshots` | Indefinite | **IMMUTABLE.** Permanent credit history. |
| **Credit Passport Public Shares**| `credit_passport_shares` | 30 Days past `expires_at` | Revoked/expired shares automatically marked inactive. |
| **AI Invocation Logs** | `ai_invocation_logs` | 90 Days | Telemetry pruning job archives aggregated metrics and purges prompt raw text. |
| **Paystack Webhook Receipts** | `paystack_webhook_receipts` | 365 Days | Retained for 1 year for financial reconciliation audits, then pruned. |
| **WhatsApp Temporary Tokens** | `whatsapp_link_requests` | 10 Minutes | Expired or consumed link codes purged daily. |
| **WhatsApp Message Logs** | `whatsapp_message_logs` | 180 Days | Delivery status logs pruned after 6 months; consent state preserved. |
| **Push Notification Deliveries**| `push_notification_deliveries` | 90 Days | Historical delivery records pruned quarterly. |
| **Platform Audit Events** | `platform_audit_events` | 365 Days (1 Year) | Immutable security audit trail; protected against manual truncation. |

---

## 8. Checklists & Return-to-Service Gates

### 8.1 Pre-Restore Checklist

- [ ] **Containment:** Stop application traffic to prevent further data corruption.
- [ ] **Isolate Target:** Create or select an isolated recovery database environment (never restore into live production directly).
- [ ] **Kill Outbound Side Effects:** Confirm that Paystack test mode is active, WhatsApp outbound is disabled, Push is paused, and Inngest jobs are held.
- [ ] **Identify Recovery Point:** Select the latest verified backup or target timestamp prior to corruption.

### 8.2 Restore Execution Checklist

- [ ] **Restore Database:** Execute Supabase PITR or pg_restore to the isolated environment.
- [ ] **Verify Schema & Migrations:** Confirm all migrations (`supabase/migrations/*.sql`) are present and generated types match.
- [ ] **Verify RLS Policies:** Ensure 100% of the 60 tables have `ROW LEVEL SECURITY` active.
- [ ] **Reconcile Financial Totals:** Run `RecoveryVerificationService.reconcileFinancialLedgers` ($\Delta 0$ difference).
- [ ] **Reconcile Auth & Tenancy:** Verify UUID linkages between `auth.users`, `profiles`, and `business_memberships`; assert last-owner invariant.

### 8.3 Return-to-Service Gate

```text
               ┌──────────────────────────────────────────────┐
               │         RETURN-TO-SERVICE CRITERIA           │
               ├──────────────────────────────────────────────┤
               │ 1. Database connection & schema verified     │
               │ 2. 100% RLS policies enabled and active     │
               │ 3. Financial parity verified (Δ 0 discrepancy)│
               │ 4. Multi-tenant isolation verified (0 leaks) │
               │ 5. Auth identities & last-owner valid        │
               │ 6. Paystack & WhatsApp consent reconciled    │
               │ 7. Background jobs safely resumed in batches │
               │ 8. Operator & David Bako formal sign-off     │
               └──────────────────────┬───────────────────────┘
                                      │
                                      ▼
                        [ SAFE TO RESUME TRAFFIC ]
```
