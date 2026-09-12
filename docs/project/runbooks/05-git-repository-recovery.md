# Runbook 05: Git Repository & Source Code Recovery

**Owner:** NNOO Engineering  
**Audience:** Lead Developer / DevOps  
**Severity:** HIGH (Source Control Loss)  

---

## 1. Overview & Scope

Covers the restoration of the primary codebase, version control history, lockfiles, database migration assets, and governance documents in the event of local machine failure or GitHub remote repository loss.

---

## 2. Source Recovery Assets

The complete NNOO system is reconstructed exclusively from the authoritative repository assets:
1. **Source Code & Routes:** `apps/web/`, `apps/mobile/`, `packages/`.
2. **Deterministic Dependency Tree:** `pnpm-lock.yaml` (strict version pinning).
3. **Database Migration Ledger:** `supabase/migrations/*.sql`.
4. **Governance & Specifications:** `docs/project/`, `docs/features/`, `AGENTS.md`.

---

## 3. Step-by-Step Restoration Sequence

### Step 1: Clone Authorized Remote / Mirror
```bash
git clone https://github.com/nnoo-org/nnoo.git
cd nnoo
```

### Step 2: Restore Dependencies via Deterministic Lockfile
```bash
# Strictly frozen installation using pinned pnpm lockfile
pnpm install --frozen-lockfile
```

### Step 3: Verify Environment Configuration Template
Copy `.env.example` to appropriate local target (`.env.local`) and configure verified secrets from the production password/secret vault.

### Step 4: Verify Monorepo Integrity
```bash
# Run turbo check across all packages and apps
pnpm run check
pnpm run build
```
