# T2-P02 — Products & Services Catalogue

## 1. Scope
This feature establishes the canonical catalogue of products and services for each NNOO business. It implements the data models, contracts, server actions, and web UI required to manage what a business sells.

## 2. Out of Scope
- **Inventory/Stock Levels**: Current stock, available quantity, stock movements, etc. are explicitly excluded and deferred to Prompt 7.
- **Sales/Invoices**: Deducting stock on sale or generating financial impact upon catalogue creation.
- **Advanced Variants**: Matrix variants (Size x Color) are excluded.
- **Batch/Expiry Tracking**: Pharmacy/grocery style lot tracking is excluded.
- **Tax/Discount Engines**: Not implemented in this feature.
- **Mobile UI**: Mobile operations are deferred to Prompt 12.

## 3. Product vs Service Model
- **Product**: A sellable item that *may* be inventory-tracked. 
- **Service**: A sellable activity that does *not* produce stock movement. 
- The `item_type` column stores either `'product'` or `'service'`. If `'service'`, `track_inventory` MUST be false.

## 4. Categories & Uniqueness
- **Categories**: Flat, business-scoped categorization. 
- **SKU/Barcode**: Optional strings. Enforce uniqueness only within the same business. No global uniqueness.

## 5. Pricing & Exact Money
- **Selling Price**: Required, stored as a non-negative BIGINT `selling_price_minor` alongside `currency_code` using Prompt 1's monetary architecture.
- **Cost Reference**: Optional `cost_price_minor`. Not used for authoritative accounting yet.

## 6. Permissions & Cost Privacy
- Permissions: `catalog.view`, `catalog.cost.view`, `catalog.create`, `catalog.update`, `catalog.archive`, `catalog.category.manage`.
- Mutations are allowed for: Owner, Business Admin, Manager, Inventory Staff.
- Cost visibility is allowed for: Owner, Business Admin, Manager, Inventory Staff, Accountant.
- **Server Projection**: Cost price is stripped from Next.js server responses for unauthorized roles (e.g., Sales Staff). CSS hiding alone is insufficient.

## 7. RLS & Tenancy
- Every item requires a valid `business_id`. RLS restricts read and mutation access strictly to authorized business members.
- Mass-assignment is mitigated by server actions securely parsing input and injecting the trusted `business_id` from the active session.

## 8. Lifecycle
- Statuses: `'active'`, `'inactive'`, `'archived'`.
- Deletions are logical (Archive), never destructive, ensuring future sales/invoices have a valid reference.

## 9. Search, Filter, Pagination
- Server-side search by name, SKU, or barcode.
- Filters by item type, category, and status.
- Next.js pagination via URL query parameters.

## 10. Tests
- Database (pgTAP): Verify constraints (Service -> no inventory), RLS business isolation, SKU/Barcode uniqueness scopes.
- TypeScript / Lint: Enforce strict typings and correct Zod validations.
