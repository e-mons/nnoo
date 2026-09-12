# Environments and Secrets

Maintain separate local development, shared development, preview/staging, and production configuration.

Use a separate production Supabase project or another explicitly approved isolated environment. Never test destructive migrations on production.

## Rules

- Never commit real secrets.
- Provide `.env.example` files with names and descriptions only.
- Validate required variables at startup.
- Use Vercel environment separation.
- Use Expo public variables only for values safe to bundle.
- Rotate any exposed secret immediately.

Live integrations may depend on NNOO supplying approved Paystack, Meta/WhatsApp, domain, email, Vercel, Expo, Apple, and Google Play access.

## AI & Intelligence Environment Variables (Tranche 3)

The following server-only variables configure NNOO's AI foundation in `apps/web`:

| Variable | Scope | Description | Default |
|---|---|---|---|
| `GEMINI_API_KEY` | Server Only | Official Google Gemini API credential for server-side generation. Must never be exposed to clients. | *(Required for live AI)* |
| `GEMINI_MODEL_DEFAULT` | Server Only | Centralized default Gemini runtime model identifier. | `gemini-2.5-flash` |
| `AI_ENABLED` | Server Only | Global AI kill switch flag. When set to `false`, AI features fail safely with `AI_FEATURE_DISABLED`. | `true` |
| `AI_TIMEOUT_MS` | Server Only | Bounded request timeout for Gemini API calls in milliseconds. | `15000` |
| `AI_MAX_RETRIES` | Server Only | Maximum bounded retries with exponential backoff for transient provider failures (429/503). | `2` |

## Disaster Recovery & Secret Rotation Workflows (Tranche 4 Prompt 4)

- **Secret Recovery Model:** Lost secrets are rotated and re-issued directly from upstream provider dashboards (Supabase, Paystack, Google AI Studio, Meta, Inngest), never extracted from insecure plaintext archives.
- **Environment Isolation during Recovery:** Restored staging/DR instances use isolated test secrets (`sk_test_*` for Paystack, test Meta verify tokens) to prevent accidental real-world charges or communication delivery during verification rehearsals.
- **Zero Secrets in Documentation:** Runbooks and verification tools record environment variable names and rotation procedures only; actual secret values remain strictly within encrypted platform secret vaults.

## Production Environment & Secret Architecture (Tranche 4 Prompt 7)

For the authoritative production inventory, provider classifications, management locations, operational owners, and callback matrix, see:
- [PRODUCTION_ENVIRONMENT_CONFIGURATION.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/PRODUCTION_ENVIRONMENT_CONFIGURATION.md)
- [Operational Runbook 18: Secret Rotation & Credential Lifecycle](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/18-secret-rotation.md)
- Schema Validation Package: `@nnoo/config` (`packages/config/index.ts`)
- Server-Only Boundary Guard: `apps/web/src/server/config/index.ts`

