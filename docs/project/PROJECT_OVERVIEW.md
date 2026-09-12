# NNOO — Project Overview & Release Scope

Document ID: `PROJ-OVERVIEW-01`  
Project: **NNOO — Africa’s AI Business Operating System**  
Target Release: **August 2026 Production Release (Tranche 4)**  
Status: **Authoritative Project Overview**

---

## 1. Executive Mission & Vision

**NNOO** is Africa’s first AI-native Business Operating System, purpose-built for micro, small, and growing African enterprises. It replaces fragmented paper notebooks, manual spreadsheets, and complex enterprise ERPs with a unified, lightweight, and intelligent operating system accessible via modern Web and Mobile interfaces.

NNOO empowers business owners to:
1. Record daily sales, inventory movements, customer payments, and operational expenses in seconds.
2. Maintain mathematically verified, double-entry financial accounts with zero accounting training required.
3. Automatically classify natural-language receipts and transaction descriptions through the **AI Bookkeeper**.
4. Track operational business performance with the deterministic **Business Health Score** (0–100).
5. Generate verified, tamper-evident **Credit Passports** to share with prospective commercial partners, suppliers, and financial institutions.
6. Engage with their business via conversational natural language (**Ask NNOO**) and multi-channel messaging (**WhatsApp & Push Notifications**).

---

## 2. August 2026 Release Scope (What is Built & Accepted)

The August 2026 production release represents the complete, accepted implementation of Tranches 1 through 4:

### 2.1 Core Commerce & Daily Operations
- **Product & Service Management:** Tracked physical inventory and non-tracked service items. Support for barcode/SKU indexing, cost tracking, selling prices, and category classification.
- **Customer & Supplier Directories:** Centralized counterparties directory with phone number normalization, transaction history, outstanding receivables (AR), and payables (AP) balances.
- **Sales & Invoicing:** Cash sales, credit sales, partial payments, and overdue tracking. Deterministic PDF invoice and receipt rendering with downloadable exports.
- **Inventory & Costing:** Stock receipts, automated weighted-average cost computation, automatic inventory decrements upon sales, and restock increments upon refunds.
- **Expenses & Payables:** Operational expense tracking, category allocation, unpaid supplier expense liabilities (AP), partial payments, and full settlement.
- **Refunds & Reversals:** Controlled sales refunds with restock support; immutability of historical transaction records via compensating journal entries.

### 2.2 Accounting Engine & Analytics
- **Double-Entry General Ledger:** Automated creation of debit and credit journal entries for every transaction; real-time double-entry balance verification ($\text{Total Debits} = \text{Total Credits}$).
- **Integer Financial Arithmetic:** Canonical storage of all monetary figures in minor currency units (e.g. Kobo for NGN) to eliminate floating-point rounding errors.
- **Executive Dashboard:** Real-time Gross Sales, Net Sales, COGS, Gross Profit, Operating Expenses, Net Profit, Inventory Valuation, and Receivables/Payables aggregates.

### 2.3 AI & Intelligence (Server-Side Grounded)
- **AI Bookkeeper:** Natural-language transaction intake, suggestion-only classification, human-in-the-loop review and correction interface, single canonical expense posting, and idempotency protection.
- **Smart Insights:** Automated deterministic business summaries explaining revenue drivers, margin trends, and expense spikes using verified database facts.
- **Ask NNOO:** Conversational assistant answering financial questions using authorized read-only tools, strictly bound to the authenticated business context with zero ability to mutate ledgers.
- **Business Health Score:** 100% deterministic domain algorithm (`business-health-score-v1`, 0–100) assessing Profitability, Cash Flow & Liquidity, Operational Efficiency, and Record Consistency.
- **Credit Passport:** Digitally signed, point-in-time financial profile snapshots with SHA-256 integrity hashing, downloadable PDF generation, and time-bounded public share links with instant revocation.

### 2.4 Automation, Messaging & Subscriptions
- **Durable Background Jobs:** Inngest serverless job orchestration powering scheduled daily/weekly attention scans, health refreshes, and notification fanouts.
- **Multi-Channel Notifications:** In-app notification center with role-based access filtering (RBAC), generic privacy-safe Mobile Push notifications, and Meta WhatsApp automated alert dispatches.
- **Meta WhatsApp Integration:** WhatsApp Cloud API v20.0, cryptographic 6-digit link codes, multi-business context switching, deterministic commands (`HELP`, `STOP`, `START`, `BUSINESS`), and inviolable `STOP` opt-out compliance.
- **Paystack SaaS Billing:** Self-service subscription management for Starter, Growth, and Scale plans, server-verified checkout sessions, HMAC-SHA512 webhook signature verification, and idempotent single-activation.

### 2.5 Platform Administration & Security
- **Platform Admin (`/admin`):** Tenant health metrics, business suspension/reactivation, user/role management, billing audit, job monitoring, and immutable audit logs (with zero admin ability to edit customer journal entries).
- **Security & Privacy:** 100% Row-Level Security (RLS) across 60 tables, zero client-side secrets, server-side RBAC enforcement, and account deletion compliance for Apple and Google Play store requirements.

---

## 3. Explicitly Deferred Roadmap Items (Future Work)

To avoid ambiguity, the following items are intentionally excluded from the August 2026 delivery:

1. **Direct Institutional Lending:** NNOO is not a licensed bank or lender and does not issue loans from its balance sheet.
2. **Public Loan Marketplace:** Multi-lender bidding platforms and automatic loan origination networks are deferred to future roadmap releases.
3. **External Bank Credit Intelligence API:** Direct third-party API endpoints for commercial banks to query credit scores.
4. **Government Tax Filing (FIRS / LIRS):** Automated tax filing and direct remittance to revenue authorities.
5. **Automated Payroll Engine:** Employee salary disbursement, direct bank batch transfers, and statutory pension/PAYE withholding.
6. **USSD & SMS Interfaces:** Offline GSM features via Telco USSD gateways or SMS parsers.
7. **Voice / IVR Calling Agents:** Automated telephone interactive voice response bots.
8. **Full Two-Way Offline Synchronization:** Offline SQLite syncing back to Supabase.
9. **Multi-Country Complex Tax Compliance:** Support for multi-jurisdictional VAT/GST rules outside Nigeria base models.

---

## 4. Supported Client Interfaces & Architecture

```text
                           ┌──────────────────────────────────────────────┐
                           │               NNOO CLIENTS                   │
                           └──────────────────────┬───────────────────────┘
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 ▼                                                                 ▼
   ┌───────────────────────────┐                                     ┌───────────────────────────┐
   │     NEXT.JS WEB APP       │                                     │     EXPO MOBILE APP       │
   │       (apps/web)          │                                     │       (apps/mobile)       │
   │  - Marketing & Auth       │                                     │  - React Native (iOS/And) │
   │  - Business Application   │                                     │  - Expo Router            │
   │  - Platform Admin         │                                     │  - SecureStore Sessions   │
   │  - Server Actions / API v1│                                     │  - Expo Push Notifications│
   └─────────────┬─────────────┘                                     └─────────────┬─────────────┘
                 │                                                                 │
                 └────────────────────────────────┬────────────────────────────────┘
                                                  │
                                                  ▼
                               ┌─────────────────────────────────────┐
                               │     SHARED CANONICAL BACKEND        │
                               │        (Supabase PostgreSQL)        │
                               │  - 60 Tables with 100% Active RLS   │
                               │  - Canonical Double-Entry Ledgers   │
                               │  - Edge Functions & Storage         │
                               └──────────────────┬──────────────────┘
                                                  │
                 ┌────────────────────────────────┼────────────────────────────────┐
                 ▼                                ▼                                ▼
   ┌───────────────────────────┐    ┌───────────────────────────┐    ┌───────────────────────────┐
   │     PAYSTACK BILLING      │    │     GOOGLE GEMINI AI      │    │     INNGEST & CHANNELS    │
   │  - SaaS Subscriptions     │    │  - gemini-2.5-flash       │    │  - Serverless Jobs        │
   │  - HMAC-SHA512 Webhooks   │    │  - Server-Only AI Engine  │    │  - Meta WhatsApp API v20  │
   │  - Server Verification    │    │  - Deterministic Grounding│    │  - Expo Push Gateway      │
   └───────────────────────────┘    └───────────────────────────┘    └───────────────────────────┘
```
