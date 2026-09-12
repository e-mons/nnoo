# NNOO — Platform Administration Operating Guide

Document ID: `ADM-GUIDE-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Platform Admin Guide**

---

## 1. Access & Authentication

The NNOO Platform Administration portal is located at `/admin` on the web application:
- **Authorization Requirement:** Requires an authenticated user with `is_platform_admin = true` in their `profiles` row.
- **Route Guard:** Normal business users attempting to access `/admin` receive an immediate HTTP 403 Forbidden response.

---

## 2. Platform Administration Modules

### 2.1 Business Workspace Management (`/admin/businesses`)
- **Tenant Directory:** View all registered businesses, creation dates, active plan tiers, and transaction volumes.
- **Business Inspection (`/admin/businesses/[id]`):** Inspect tenant health metrics and active staff memberships.
- **Business Suspension & Reactivation:** Platform admins can temporarily suspend a business (e.g. for terms violations or fraud investigation).
  - *Suspension Impact:* Users belonging to the suspended business cannot access workspace routes on Web or Mobile.
  - *Data Integrity:* Historical accounting records remain completely preserved ($\Delta 0$).
  - *Reactivation:* Clicking "Reactivate Business" immediately restores workspace access.

### 2.2 User & Staff Oversight (`/admin/users`)
- Inspect user accounts, email verification status, and business memberships.
- **Last-Active-Owner Invariant:** The admin portal strictly enforces that a business cannot be left with zero active owners.

### 2.3 Subscription Billing Oversight (`/admin/billing`)
- View active SaaS subscriptions, plan distributions, and Paystack payment transaction references.
- Inspect webhook processing failures or past-due subscriptions.

### 2.4 Customer Enquiries (`/admin/enquiries`)
- Review support inquiries submitted via the marketing contact form or in-app support requests.
- Assign tickets and update resolution statuses.

### 2.5 Intelligence & Jobs Operations (`/admin/intelligence`)
- Monitor Google Gemini API invocation counts and latency metrics.
- Inspect Inngest background job queue execution rates.
- Monitor Meta WhatsApp and Expo Push delivery health.

### 2.6 Immutable Audit Logs (`/admin/audit`)
- Every administrative action (suspension, reactivation, role change, plan update) is automatically recorded in `admin_audit_logs` with actor user ID, timestamp, target entity, and action details.

---

## 3. Strict Platform Administrator Limitations

> [!CAUTION]
> Platform Administrators must **NEVER**:
> 1. **Edit Customer Sales or Expenses:** Never manually alter business transaction records or general ledger numbers.
> 2. **Rewrite Double-Entry Journals:** Never manually patch `journal_entries` or `journal_lines`.
> 3. **Fabricate Subscription Payments:** Never manually mark a Paystack subscription paid without verified bank settlement.
> 4. **Alter Health Scores:** Never manually override a calculated Business Health Score.
> 5. **Bypass WhatsApp Opt-Out:** Never force outbound messaging to users who sent the `STOP` command.
