# NNOO Master Documentation Index

Document ID: `DOC-INDEX-01`  
Project: **NNOO — Africa’s AI Business Operating System**  
Owner: **David Bako**  
Release: **August 2026 Production Delivery (Tranche 4)**  
Status: **Authoritative System Index**

Welcome to the complete, authoritative documentation package for NNOO. This index organizes all technical, operational, architectural, and governance documents across the repository.

---

## 1. Start Here (Core Handover & Governance)

- **[Master Project Handover](file:///c:/Users/H-P/Desktop/nnoo/docs/project/NNOO_PROJECT_HANDOVER.md)** — The primary entry point for new owners, operators, and incoming engineers.
- **[Operating Rules & Governance](file:///c:/Users/H-P/Desktop/nnoo/AGENTS.md)** — Authoritative repository rules, safety constraints, and engineering protocols.
- **[Project State](file:///c:/Users/H-P/Desktop/nnoo/docs/project/PROJECT_STATE.md)** — Current tranche, active feature, and release status.
- **[Project Overview](file:///c:/Users/H-P/Desktop/nnoo/docs/project/PROJECT_OVERVIEW.md)** — High-level product summary, August 2026 scope, and roadmap exclusions.
- **[Technical Handover Walkthrough](file:///c:/Users/H-P/Desktop/nnoo/docs/project/TECHNICAL_HANDOVER_WALKTHROUGH.md)** — Structured 90-minute technical onboarding agenda.
- **[Handover Checklist](file:///c:/Users/H-P/Desktop/nnoo/docs/project/HANDOVER_CHECKLIST.md)** — Service-by-service operational handover verification checklist.
- **[Handover Actions Required](file:///c:/Users/H-P/Desktop/nnoo/docs/project/HANDOVER_ACTIONS_REQUIRED.md)** — Account transfers, invitations, and actions required by the owner.
- **[Handover Package Manifest](file:///c:/Users/H-P/Desktop/nnoo/docs/project/HANDOVER_PACKAGE_MANIFEST.md)** — Complete inventory of all handover documentation files.

---

## 2. Project Architecture & Contracts

- **[System Architecture](file:///c:/Users/H-P/Desktop/nnoo/docs/project/ARCHITECTURE.md)** — High-level multi-platform architecture, unified backend, and integration topologies.
- **[Domain Model Reference](file:///c:/Users/H-P/Desktop/nnoo/docs/architecture/DOMAIN_MODEL.md)** — Conceptual models across identity, tenancy, commerce, inventory, accounting, and intelligence.
- **[API & Data Contracts Reference](file:///c:/Users/H-P/Desktop/nnoo/docs/project/API_AND_DATA_CONTRACTS.md)** — REST API v1 endpoints, Server Actions, DTOs, and event payloads.
- **[Role & Permission Matrix](file:///c:/Users/H-P/Desktop/nnoo/docs/project/ROLE_PERMISSION_MATRIX.md)** — RBAC authorization matrix across UI, Server Actions, API routes, and database RLS.
- **[Stack & Versions Reference](file:///c:/Users/H-P/Desktop/nnoo/docs/project/STACK_AND_VERSIONS.md)** — Reconciled dependency and runtime versions across Web, Mobile, and packages.
- **[Definition of Done](file:///c:/Users/H-P/Desktop/nnoo/docs/project/DEFINITION_OF_DONE.md)** — Quality gates and completion standards for features.

---

## 3. Engineering & Local Development

- **[Beginner’s Local Setup Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/guides/BEGINNER_LOCAL_SETUP_GUIDE.md)** — Complete step-by-step novice guide with direct links for all keys and local testing.
- **[Repository Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/development/REPOSITORY_GUIDE.md)** — Monorepo layout, package boundaries, and dependency rules.
- **[Local Development Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/development/LOCAL_DEVELOPMENT.md)** — Setup instructions, prerequisite toolchains, and package scripts.
- **[Developer Onboarding Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/development/DEVELOPER_ONBOARDING.md)** — Step-by-step checklist for new engineers joining the project.
- **[Environment & Secrets Reference](file:///c:/Users/H-P/Desktop/nnoo/docs/project/ENVIRONMENT_AND_SECRETS.md)** — Complete inventory of environment variables and rotation protocols (no values).

---

## 4. Database & Tenancy Operations

- **[Database Operations Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/DATABASE_OPERATIONS.md)** — Supabase management, forward-only migrations, schema parity, and MCP tooling.
- **[Data Protection & Disaster Recovery](file:///c:/Users/H-P/Desktop/nnoo/docs/project/DATA_PROTECTION_AND_RECOVERY.md)** — Backups, PITR, restore rehearsals, and return-to-service gates.
- **[Database Recovery Runbook](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/01-database-recovery.md)** — Operator instructions for database recovery from snapshots.
- **[Failed Migration Recovery](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/02-failed-migration-recovery.md)** — Operator instructions for repairing failed migration scripts.
- **[Post-Restore Verification](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/08-post-restore-verification.md)** — Financial parity ($\Delta 0$) and RLS checks following database restore.

---

## 5. Financial Engine & Accounting Truth

- **[Financial Engine Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/architecture/FINANCIAL_ENGINE.md)** — Double-entry accounting rules, exact integer money, journal balancing, COGS, and refunds.
- **[Financial Integrity Incident Runbook](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/11-financial-integrity-incident.md)** — Investigating and reconciling financial discrepancies without manual patching.

---

## 6. AI & Business Intelligence Architecture

- **[AI & Intelligence Architecture](file:///c:/Users/H-P/Desktop/nnoo/docs/architecture/AI_AND_INTELLIGENCE.md)** — Gemini integration, deterministic fact grounding, and server-only AI boundaries.
- **[Business Health Score Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/architecture/BUSINESS_HEALTH_SCORE.md)** — Deterministic scoring algorithms, weighted components, and credit bureau boundaries.
- **[Credit Passport Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/architecture/CREDIT_PASSPORT.md)** — Immutable financial snapshots, SHA-256 integrity hashing, PDF exports, and public share tokens.
- **[Gemini AI Outage Runbook](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/13-gemini-ai-outage.md)** — Operator instructions for handling AI rate limits, outages, and kill switches.

---

## 7. Production Operations & Deployment

- **[Complete Beginner Vercel Production Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/guides/VERCEL_PRODUCTION_SETUP_GUIDE.md)** — Click-by-click beginner guide for deploying and testing NNOO on Vercel with zero technical experience.
- **[Resend Email Setup Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/guides/RESEND_EMAIL_SETUP_GUIDE.md)** — Step-by-step Custom SMTP and verification code setup for localhost and production.
- **[Web Production Deployment Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/WEB_PRODUCTION_DEPLOYMENT.md)** — GitHub to Vercel deployment pipeline, apex domain configuration, and smoke tests.
- **[Production Web Release Manifest](file:///c:/Users/H-P/Desktop/nnoo/docs/project/PRODUCTION_WEB_RELEASE.md)** — Release manifest for `RELEASE-WEB-20260819-01`.
- **[Release Rollback Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/RELEASE_ROLLBACK.md)** — Rapid application rollback vs. database recovery separation.
- **[Production Environment Configuration](file:///c:/Users/H-P/Desktop/nnoo/docs/project/PRODUCTION_ENVIRONMENT_CONFIGURATION.md)** — Production domains, redirects, and environment bindings.
- **[System Inventory](file:///c:/Users/H-P/Desktop/nnoo/docs/project/SYSTEM_INVENTORY.md)** — Comprehensive inventory of services, environments, and components.
- **[Production Identifiers Reference](file:///c:/Users/H-P/Desktop/nnoo/docs/project/PRODUCTION_IDENTIFIERS.md)** — Safe non-secret production IDs, package names, and domain references.


---

## 8. Mobile Release & App Store Readiness

- **[Mobile Release Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/MOBILE_RELEASE.md)** — EAS build workflows, release candidate packaging (`com.nnoo.mobile`), and signing keys.
- **[Production Mobile Release Manifest](file:///c:/Users/H-P/Desktop/nnoo/docs/project/PRODUCTION_MOBILE_RELEASE.md)** — Release manifest for `RELEASE-MOBILE-20260819-01`.
- **[Mobile Store Listing Readiness](file:///c:/Users/H-P/Desktop/nnoo/docs/project/MOBILE_STORE_LISTING_READINESS.md)** — Store copy, Apple App Privacy declarations, Google Play Data Safety, and screenshot plans.

---

## 9. External Providers & Integrations

- **[Provider Operations Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/PROVIDER_OPERATIONS.md)** — Central map of all 6 production external providers.
- **[Production Provider Validation](file:///c:/Users/H-P/Desktop/nnoo/docs/project/PRODUCTION_PROVIDER_VALIDATION.md)** — Master certification of Paystack, Gemini, Inngest, WhatsApp, Push, and Supabase Auth.
- **[External Dependencies Register](file:///c:/Users/H-P/Desktop/nnoo/docs/project/EXTERNAL_DEPENDENCIES.md)** — Criticality, failure impacts, and fallback strategies for external services.
- **[Paystack Billing Operations](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/PAYSTACK_BILLING.md)** — SaaS subscription plans, webhook signatures, and idempotent fulfillment.
- **[Automations & Jobs Operations](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/AUTOMATIONS_AND_JOBS.md)** — Inngest serverless job registration, event triggers, and replay controls.
- **[Notifications & Channels Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/NOTIFICATIONS_AND_CHANNELS.md)** — Notification lifecycle across In-App, Push, and WhatsApp.
- **[Push Notifications Operations](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/PUSH_NOTIFICATIONS.md)** — Expo Push gateway, token lifecycle, and receipt handling.
- **[WhatsApp Operations Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/WHATSAPP.md)** — Meta Cloud API v20.0, cryptographic link codes, and STOP opt-out enforcement.

---

## 10. Operations, Observability & Incident Runbooks

- **[Observability & Incident Management](file:///c:/Users/H-P/Desktop/nnoo/docs/project/OBSERVABILITY_AND_INCIDENT_MANAGEMENT.md)** — Logging standards, telemetry boundaries, and incident workflows.
- **[Operations Quick Reference](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/OPERATIONS_QUICK_REFERENCE.md)** — Fast answers to common production operational emergencies.
- **[Runbook Index](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/RUNBOOK_INDEX.md)** — Catalog of all 18 production incident runbooks.
- **[Troubleshooting Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/TROUBLESHOOTING.md)** — Symptom-based troubleshooting across auth, sales, inventory, and AI.
- **[Support Operations Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/SUPPORT_OPERATIONS.md)** — Customer support triage, data minimization, and defect escalation.
- **[Security Operations Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/SECURITY_OPERATIONS.md)** — Security monitoring, tenant verification, and compromised device response.
- **[Secret Rotation Runbook](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/18-secret-rotation.md)** — Step-by-step procedures for rotating all 6 production credentials.
- **[Business Continuity Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/BUSINESS_CONTINUITY.md)** — Provider degradation impact matrix and business continuity procedures.
- **[Maintenance & Dependency Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/MAINTENANCE.md)** — Safe dependency upgrades, framework maintenance, and deprecation tracking.

---

## 11. User & Administration Guides

- **[Platform Admin Operations Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/guides/PLATFORM_ADMIN_GUIDE.md)** — Complete manual for platform operators using `/admin`.
- **[Business User Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/guides/BUSINESS_USER_GUIDE.md)** — Non-technical operating manual for African business owners and staff.
- **[Mobile User Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/guides/MOBILE_USER_GUIDE.md)** — User guide for the NNOO React Native Expo mobile application.

---

## 12. Account Ownership & Risk Management

- **[Production Account Ownership Matrix](file:///c:/Users/H-P/Desktop/nnoo/docs/project/PRODUCTION_ACCOUNT_OWNERSHIP.md)** — Account ownership, access levels, and transfer actions.
- **[Risk Register](file:///c:/Users/H-P/Desktop/nnoo/docs/project/RISK_REGISTER.md)** — Comprehensive register of technical, provider, and operational risks.
- **[Release Checklist](file:///c:/Users/H-P/Desktop/nnoo/docs/project/RELEASE_CHECKLIST.md)** — Production release gating checklist.

---

## 13. Historical Governance & Acceptance Reports

- **[Tranche Plan](file:///c:/Users/H-P/Desktop/nnoo/docs/project/TRANCHE_PLAN.md)** — Overall 4-tranche delivery roadmap.
- **[Tranche 4 Release Scope](file:///c:/Users/H-P/Desktop/nnoo/docs/project/TRANCHE_4_RELEASE_SCOPE.md)** — Frozen release scope and gap ledger for Tranche 4.
- **[Feature Ledger](file:///c:/Users/H-P/Desktop/nnoo/docs/project/FEATURE_LEDGER.md)** — Ledger of all implemented features.
- **[Decision Log (ADRs)](file:///c:/Users/H-P/Desktop/nnoo/docs/project/DECISION_LOG.md)** — Architectural Decision Records from ADR-001 through ADR-026.
- **[Changelog](file:///c:/Users/H-P/Desktop/nnoo/docs/project/CHANGELOG.md)** — Chronological release history across all tranches.
- **[Prompt Log](file:///c:/Users/H-P/Desktop/nnoo/docs/project/PROMPT_LOG.md)** — Detailed prompt records.
- **[Master Test Matrix](file:///c:/Users/H-P/Desktop/nnoo/docs/project/TEST_MATRIX.md)** — Master automated test coverage matrix (375/375 tests passing).
- **[Tranche 1 Acceptance Report](file:///c:/Users/H-P/Desktop/nnoo/docs/project/TRANCHE_1_ACCEPTANCE_REPORT.md)** — Formally accepted.
- **[Tranche 2 Acceptance Report](file:///c:/Users/H-P/Desktop/nnoo/docs/project/TRANCHE_2_ACCEPTANCE_REPORT.md)** — Formally accepted.
- **[Tranche 3 Acceptance Report](file:///c:/Users/H-P/Desktop/nnoo/docs/project/TRANCHE_3_ACCEPTANCE_REPORT.md)** — Formally accepted.
- **[Go-Live Rehearsal & UAT Report](file:///c:/Users/H-P/Desktop/nnoo/docs/project/GO_LIVE_REHEARSAL.md)** — Formally accepted.
- **[T4-P12 Handover Acceptance Report](file:///c:/Users/H-P/Desktop/nnoo/docs/features/T4-P12-documentation-operations-project-handover.md)** — Handover acceptance report.
