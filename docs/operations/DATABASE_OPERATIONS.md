# NNOO — Database Operations & Migration Guide

Document ID: `DB-OPS-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Database Guide**

---

## 1. Database Topology & Environments

NNOO utilizes a unified PostgreSQL 15 database hosted on Supabase:
- **Development Database:** Used for local engineering, feature branch development, and MCP schema inspection.
- **Production Database:** Dedicated high-availability instance (`hoorlxgtnamwdxszsbwt`) powering `https://nnoo.app`.

---

## 2. The Golden Rules of Database Operations

> [!CAUTION]
> 1. **MIGRATIONS ARE IMMUTABLE:** Never edit, rename, or delete an already-applied SQL migration file in `supabase/migrations/`. Database changes must **ALWAYS** be implemented as new, additive forward migrations.
> 2. **NO DESTRUCTIVE DROPS IN PRODUCTION:** Dropping tables, dropping columns with active data, or truncating operational tables in production without an explicit written rollback and recovery plan is strictly prohibited.
> 3. **RLS ON EVERY TABLE:** Every exposed business table must have Row-Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`) active with explicit tenant-isolation policies.

---

## 3. The 8-Step Database Change & Supabase MCP Workflow

Whenever a schema change, table creation, column addition, or RLS policy update is required, engineers must follow this rigorous 8-step process:

```text
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  1. Inspect  │ ──► │  2. Author   │ ──► │   3. Apply   │ ──► │ 4. Regenerate│
│ Current Schema│    │  Migration   │     │  to Dev DB   │     │  TS Types    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                       │
┌──────────────┐     ┌──────────────┐     ┌──────────────┐             │
│  8. Deploy   │ ◄── │  7. Verify   │ ◄── │   6. Run     │ ◄───────────┘
│  to Prod DB  │     │   Parity     │     │ Test Suite   │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Step 1: Inspect Current Schema
Use the Supabase MCP Server (`list_tables`, `execute_sql`) or Supabase CLI to inspect the live development database tables and constraints.

### Step 2: Author a Versioned Migration File
Create a new timestamped file in `supabase/migrations/`:
```bash
# Format: YYYYMMDDHHMMSS_brief_description.sql
# Example: 20260915120000_add_invoice_custom_notes.sql
```

### Step 3: Apply Migration to Development Database
Apply the migration script using Supabase MCP or the CLI:
```bash
npx supabase db push
```

### Step 4: Regenerate Shared TypeScript Types
Regenerate database types into `@nnoo/supabase`:
```bash
npx supabase gen types typescript --linked > packages/supabase/src/types/database.types.ts
```

### Step 5: Update Domain & Validation Schemas
Update corresponding DTO interfaces in `packages/contracts/` and Zod schemas in `packages/validation/`.

### Step 6: Execute Multi-Tenant & RLS Tests
Run the automated test suite to ensure RLS policies prevent cross-tenant data leaks:
```bash
pnpm test
```

### Step 7: Verify Zero Schema Drift
Confirm that:
$$\text{Live Dev Database} \equiv \text{Repository Migrations} \equiv \text{Generated TypeScript Types}$$

### Step 8: Deploy Migration to Production
During the production deployment window, apply the migration to the production instance before deploying updated application code.

---

## 4. Multi-Tenant Row-Level Security (RLS) Architecture

### Tenancy Hierarchy
Tenancy is strictly relational and resolved dynamically on every query:
```text
auth.users (UUID) ──► profiles (id = auth.uid()) ──► business_memberships (role, status) ──► businesses (id, slug)
```

### Standard Tenant Isolation Policy Pattern
All 60 operational tables (sales, expenses, inventory, invoices, etc.) enforce tenant isolation using this canonical pattern:
```sql
-- Read Access Policy
CREATE POLICY "tenant_isolation_select" ON public.sales
FOR SELECT USING (
  business_id IN (
    SELECT business_id FROM public.business_memberships
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Mutation Access Policy (Owner, Admin, Manager, Sales Staff)
CREATE POLICY "tenant_isolation_insert" ON public.sales
FOR INSERT WITH CHECK (
  business_id IN (
    SELECT business_id FROM public.business_memberships
    WHERE user_id = auth.uid() 
      AND status = 'active' 
      AND role IN ('owner', 'business_admin', 'manager', 'sales_staff')
  )
);
```

---

## 5. Platform Admin Database Boundary

- **Platform Admin Route Protection:** Platform admin users access system-wide metrics via dedicated `/admin` server routes using server-side elevated credentials.
- **Client Service-Role Prohibition:** The `SUPABASE_SERVICE_ROLE_KEY` must **NEVER** be shipped to client-side bundles or used for standard tenant operations. Normal user queries always execute under the authenticated user's JWT context.
