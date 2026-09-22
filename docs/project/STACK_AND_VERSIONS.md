# NNOO — Actual Stack and Versions Reference

Document ID: `STACK-VERSIONS-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Workspace Reference**

---

## 1. Runtime & Monorepo Infrastructure

| Component | Version Constraint | Actual Resolved Version | Notes |
|---|---|---|---|
| **Node.js** | `>=24.0.0` | `v24.x` (LTS baseline) | Configured in root `package.json` engines |
| **Package Manager** | `pnpm@11.0.0` | `pnpm 11.0.0` | Corepack / packageManager pinned |
| **Monorepo Engine** | `turbo@^2.0.12` | `2.0.12` | Turbo pipelines for build/lint/typecheck/test |
| **TypeScript** | `typescript@~5.9.3` / `^5` | `5.9.3` | Strict TypeScript configured across monorepo |
| **Code Formatter** | `prettier@^3.3.3` | `3.3.3` | Prettier workspace config |
| **Test Runner** | `tsx@^4.23.12` + Node Test Runner | `4.23.12` | Native `node:test` + ESM preload runner |

---

## 2. Web Application Stack (`apps/web`)

| Component | Version | Purpose |
|---|---|---|
| **Framework** | Next.js `16.3.0` | Turbopack app router, Server Actions, API v1 routes |
| **UI Library** | React `19.2.8` / React DOM `^19.0.0` | Core web rendering |
| **CSS / Styling** | Tailwind CSS `^4` (`@tailwindcss/postcss: ^4`) | Modern utility styling |
| **Animation** | Framer Motion `^13.0.0` | UI transitions and micro-interactions |
| **Icons** | Lucide React `^1.29.0` | Iconography across web application |
| **Data Visualization** | Recharts `^3.10.1` | Financial analytics and chart visualizations |
| **Forms** | React Hook Form `^7.85.0` + `@hookform/resolvers: ^5.7.1` | Client/Server form validation |
| **PDF Rendering** | `@react-pdf/renderer: ^4.5.1` | Deterministic Credit Passport and Invoice PDF generation |
| **Server AI SDK** | `@google/genai: 2.17.1` | Server-only Google Gemini AI client (`gemini-2.5-flash`) |
| **Background Jobs** | `inngest: 4.18.1` | Serverless durable background job orchestration |
| **Supabase SSR** | `@supabase/ssr: ^0.12.4` | Cookie-based server-side session management |
| **Supabase Client** | `@supabase/supabase-js: ^2.112.2` | Database, auth, storage, and RLS queries |
| **Schema Validation** | `zod: ^3.25.76` | Shared runtime schema validation |

---

## 3. Mobile Application Stack (`apps/mobile`)

| Component | Version | Purpose |
|---|---|---|
| **Framework / SDK** | Expo SDK `~57.0.24` | React Native universal mobile toolchain |
| **Routing** | Expo Router `~57.0.22` | File-based navigation (`app/(auth)`, `app/(app)`) |
| **UI Library** | React `19.2.3` / React Native `0.86.3` | Native mobile rendering engine |
| **Storage** | `@react-native-async-storage/async-storage: 2.2.0` | Non-sensitive local preferences cache |
| **Secure Storage** | `expo-secure-store: ~57.0.4` | Encrypted session tokens and credentials |
| **Notifications** | `expo-notifications: ~57.0.20` | Device registration and push reception |
| **Deep Linking** | `expo-linking: ~57.0.10` | Universal links & Android App Links (`https://nnoo.app`) |
| **Crypto** | `expo-crypto: ~57.0.3` | Native cryptographic helpers |
| **Splash Screen** | `expo-splash-screen: ~57.0.4` | Config plugin splash management |
| **Media / Video** | `expo-video: ~57.0.4` | Native video background playback |
| **Supabase Client** | `@supabase/supabase-js: ^2.112.2` | Direct mobile client using URL polyfill |
| **Polyfills** | `react-native-url-polyfill: ^2.0.0` | URL standardization for React Native |

---

## 4. Shared Monorepo Packages (`packages/*`)

| Package | Purpose | Dependencies |
|---|---|---|
| `@nnoo/config` | Strict runtime environment variable parsing and validation | `zod` |
| `@nnoo/contracts` | TypeScript interfaces, API DTOs, domain contracts | None |
| `@nnoo/domain` | Pure financial calculations, health score, accounting logic | `@nnoo/contracts` |
| `@nnoo/validation` | Shared Zod schemas for forms, API payloads, provider inputs | `zod`, `@nnoo/contracts` |
| `@nnoo/supabase` | Database migration types, RLS helpers, client factories | `@supabase/supabase-js` |
| `@nnoo/design-tokens` | Unified color palette, typography scales, spacing tokens | None |
| `@nnoo/test-utils` | Test mocks, assertions, synthetic data factories | Node test runner |

---

## 5. External Provider Platforms

| Provider | Production Identifier / Version | Purpose |
|---|---|---|
| **Supabase** | `https://hoorlxgtnamwdxszsbwt.supabase.co` | PostgreSQL 15, Auth, Storage, Row-Level Security |
| **Paystack** | Live Mode API (Card / Bank / USSD) | NNOO SaaS subscription billing & checkout |
| **Google Gemini AI** | Model: `gemini-2.5-flash` | Classification, Smart Insights, Ask NNOO Q&A |
| **Inngest Cloud** | Inngest Cloud Serverless Event Bus | Durable background jobs, attention scans, notifications |
| **Meta WhatsApp** | WhatsApp Cloud API `v20.0` | Automated notifications & Ask NNOO conversational queries |
| **Expo Push** | Expo Push Gateway (APNs / FCM) | Secure mobile push notification dispatch |
| **Vercel** | Edge Network / Serverless Functions | Web deployment & apex domain `https://nnoo.app` |
