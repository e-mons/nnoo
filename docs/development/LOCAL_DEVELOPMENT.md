# NNOO — Local Engineering & Development Guide

Document ID: `LOCAL-DEV-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Local Development Guide**

---

## 1. Prerequisites & Toolchain Setup

Ensure the following tools are installed on your workstation:

| Tool | Version Requirement | Purpose | Verification Command |
|---|---|---|---|
| **Node.js** | `>=24.0.0` (LTS baseline) | JavaScript runtime environment | `node --version` |
| **pnpm** | `11.0.0` (Pinned in `package.json`) | Monorepo package manager | `pnpm --version` |
| **Git** | `>=2.40.0` | Version control | `git --version` |
| **Supabase CLI** | `^2.111.0` (Installed in devDependencies) | Local/dev database & MCP | `npx supabase --version` |
| **Expo CLI** | Bundled with Expo SDK 54 | Mobile development server | `npx expo --version` |

To enable pnpm 11 globally via Corepack:
```bash
corepack enable
corepack prepare pnpm@11.0.0 --activate
```

---

## 2. Initial Repository Setup

### Step 1: Clone Repository
```bash
git clone https://github.com/davidbako/nnoo.git
cd nnoo
```

### Step 2: Install Workspace Dependencies
```bash
pnpm install
```

### Step 3: Configure Environment Variables
Copy the example environment files for Web and Mobile:
```bash
# In apps/web
cp apps/web/.env.example apps/web/.env.local

# In apps/mobile
cp apps/mobile/.env.example apps/mobile/.env.local
```
*(Fill in development Supabase keys; never paste production secrets into local files).*

---

## 3. Standard Workspace Commands

The monorepo uses Turborepo for task orchestration. The following scripts exist in root `package.json`:

| Command | Purpose | Target |
|---|---|---|
| `pnpm run dev` | Start both Web and Mobile development servers concurrently | Entire monorepo |
| `pnpm run dev:web` | Start Next.js development server at `http://localhost:3000` | `apps/web` |
| `pnpm run dev:mobile` | Start Expo Metro bundler for iOS/Android simulators | `apps/mobile` |
| `pnpm run build` | Compile optimized production bundles across all apps and packages | Entire monorepo |
| `pnpm run lint` | Execute ESLint code quality checks across workspace | Entire monorepo |
| `pnpm run typecheck` | Run strict TypeScript compiler typechecks | Entire monorepo |
| `pnpm test` | Execute the full automated test suite (375 tests across 115 suites) | Entire monorepo |
| `pnpm run check` | Run both `typecheck` and `lint` quality gates | Entire monorepo |
| `pnpm run format` | Auto-format TypeScript, Markdown, and JSON files with Prettier | Entire monorepo |

---

## 4. Application-Specific Commands

### 4.1 Web Application (`apps/web`)
Navigate to `apps/web` or run directly:
```bash
# Start Next.js Turbopack dev server (http://localhost:3000)
pnpm --filter=web run dev

# Run Next.js production build
pnpm --filter=web run build

# Run unit and integration tests
pnpm --filter=web run test
```

### 4.2 Mobile Application (`apps/mobile`)
Navigate to `apps/mobile` or run directly:
```bash
# Start Expo Metro bundler
pnpm --filter=mobile run start

# Start directly for Android emulator
pnpm --filter=mobile run android

# Start directly for iOS simulator
pnpm --filter=mobile run ios

# Verify public Expo configuration (ensures zero secrets leak into bundle)
npx expo config --type public

# Check TypeScript in mobile app
npx tsc --noEmit
```

---

## 5. Database & Supabase Workflow

### 5.1 Inspecting Development Database Schema
```bash
npx supabase db dump -f schema.sql --linked
```

### 5.2 Generating Shared TypeScript Types
Whenever the database schema changes, regenerate types into `@nnoo/supabase`:
```bash
npx supabase gen types typescript --linked > packages/supabase/src/types/database.types.ts
```

### 5.3 Executing Database & RLS Tests
```bash
pnpm --filter=web run test
```
*(The automated test suite runs multi-tenant RLS assertions across all 60 business tables).*

---

## 6. Pre-Commit / Pre-Push Quality Gate

Before submitting any pull request or pushing to the main branch, verify that all quality gates pass:
```bash
# 1. Typecheck and lint
pnpm run check

# 2. Run all 375 tests
pnpm test

# 3. Verify Next.js production build
pnpm run build
```
*(All 3 commands must return exit code 0).*
