# NNOO — Credit Passport Architecture & Verification Guide

Document ID: `PASSPORT-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Credit Passport Architecture**

---

## 1. Product Purpose & Statutory Boundaries

The **NNOO Credit Passport** is a standardized, tamper-evident digital financial profile that aggregates verified transaction history, sales volume, operating margins, supplier reliability, and the Business Health Score into an exportable and shareable credential.

> [!WARNING]
> **LEGAL & REGULATORY BOUNDARY:**  
> The Credit Passport is a **verified business-record summary compiled from the enterprise's own accounting ledgers**. It is **NOT** a formal credit rating agency certificate, licensed credit bureau report, government-guaranteed certificate, or a binding guarantee of loan approval by external commercial banks. Marketing and technical documentation must accurately describe it as a business-generated verified record.

---

## 2. Technical Architecture & Immutability Model

```text
┌─────────────────────────────────────────────────────────────┐
│             DETERMINISTIC GENERAL LEDGER                    │
│   (Sales, Payments, Inventory, AP/AR, Health Score)         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               SNAPSHOT GENERATION ENGINE                    │
│  1. Queries point-in-time financial facts                   │
│  2. Serializes facts into canonical JSON structure          │
│  3. Computes SHA-256 integrity hash:                        │
│     hash = SHA-256(canonical_facts_json)                   │
│  4. Saves immutable row to `credit_passport_snapshots`     │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│    DETERMINISTIC PDF ENGINE │ │     PUBLIC SHARE ENGINE     │
│  - @react-pdf/renderer      │ │  - Cryptographic token      │
│  - Embeds SHA-256 digest    │ │  - Time-bounded TTL         │
│  - Downloadable offline doc │ │  - Instant owner revocation │
│  - Tamper-evident badge     │ │  - Public verification route│
└─────────────────────────────┘ └─────────────────────────────┘
```

---

## 3. Core Snapshot Data Model

Each generated Credit Passport snapshot captures an immutable point-in-time representation:
- **Business Profile:** Legal name, registration number, business age, sector/category.
- **Financial Volume:** 30/90/180-day Gross Sales, Net Sales, Gross Margin, and Net Profit.
- **Operational Metrics:** Inventory turnover, on-time supplier payment rate, customer payment collection speed (DSO).
- **Business Health Score:** Score (0–100) and 4-tier sub-score breakdown at the moment of snapshot generation.
- **Cryptographic Digest:** SHA-256 hash computed over normalized JSON facts.

---

## 4. Public Sharing & Instant Revocation

- **Share Link Generation:** Business owners can create share links with a defined validity period (e.g. 7, 30, or 90 days).
- **Public Verification Endpoint:** Third parties (suppliers, lenders) visit `/passport/share/[token]` or `/api/v1/credit-passport/verify` to view the authenticated profile.
- **Instant Revocation:** The business owner can click "Revoke Access" at any time. The share token is marked `revoked: true` in the database, and subsequent public queries immediately return HTTP 404 / 403 `TOKEN_REVOKED`.
- **Zero Financial Mutation:** Generating, viewing, downloading, sharing, or revoking a Credit Passport causes exactly **$\Delta 0$ mutations** across financial ledgers.
