# Always-On Rule: Architecture Boundaries

## Applications

Only two applications are allowed:

- `apps/web`: one Next.js app for marketing, auth, business users, NNOO admins, and APIs.
- `apps/mobile`: one Expo app.

## Shared packages

Use shared packages for contracts, domain rules, validation, Supabase types/helpers, configuration, design tokens, and tests.

Do not place Next.js-only, browser-only, or native-only code in a package consumed everywhere.

## Trusted server boundary

Sensitive operations belong in trusted server code:

- Paystack initialization and verification.
- Gemini calls.
- Supabase administrative operations.
- Cross-business administration.
- Privileged reports.
- Background-job registration.

## API boundary

Use versioned routes under `/api/v1` for server operations consumed by web or mobile. Keep request and response contracts in `packages/contracts`.

Routine user-scoped Supabase access may be direct only when RLS fully protects it and the same rule is documented for both clients.

## Compatibility

Schema or API changes must remain compatible with released web and mobile clients or include a written migration and release order. Never duplicate formulas across clients.
