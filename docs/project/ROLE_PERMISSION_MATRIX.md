# NNOO — Role-Based Access Control (RBAC) & Permission Matrix

Document ID: `RBAC-MATRIX-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative RBAC Matrix**

---

## 1. System Roles Overview

NNOO defines 7 distinct business-level roles plus a dedicated platform administration role:
- **`owner`**: Primary business owner with full operational, financial, staff, and billing authority. Protected by last-active-owner invariant.
- **`business_admin`**: General administrator with operational, financial, and staff management permissions (cannot demote or remove the sole owner).
- **`manager`**: Store/branch manager with sales, inventory, and operational expense permissions.
- **`accountant`**: Financial specialist with access to general ledger, P&L reports, AP/AR, and AI Bookkeeper confirmation.
- **`sales_staff`**: Frontline cashier/clerk permitted only to record sales, collect payments, and view product prices.
- **`inventory_staff`**: Warehouse/stock clerk permitted to receive stock, view quantities, and manage catalog items.
- **`read_only`**: Auditor or stakeholder permitted to view non-sensitive reports with zero mutation privileges.
- **`platform_admin`**: Global system operator with access to `/admin` routes.

---

## 2. Comprehensive RBAC Permission Matrix

| Capability / Module | Owner | Admin | Manager | Accountant | Sales Staff | Inventory Staff | Read Only | Platform Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **View Dashboard Summary** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Record Sales & Receipts** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Process Customer Refunds** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Manage Catalog & Products** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Receive Stock & Update Cost**| ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Record Expenses & Payables** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Settle Supplier AP Bills** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **AI Bookkeeper Confirm** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **View Financial Reports (P&L)**| ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Generate Credit Passport** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Invite & Manage Staff** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Manage Paystack Billing** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Access Platform Admin (`/admin`)**| ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 3. Defense-in-Depth Enforcement Layers

1. **UI Layer:** Navigation links and action buttons are conditionally hidden based on `membership.role`.
2. **Server Action & API Layer:** Server routes validate `membership.role` using `@nnoo/contracts` preflights before processing requests.
3. **Database RLS Layer:** PostgreSQL RLS policies evaluate `business_memberships` dynamically, ensuring direct API manipulation cannot bypass role constraints.
