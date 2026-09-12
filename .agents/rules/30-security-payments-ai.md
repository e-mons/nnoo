# Always-On Rule: Security, Payments, and AI

## Security

- Validate every untrusted input.
- Authorize on the server and in RLS.
- Use least privilege.
- Redact secrets and sensitive information from logs.
- Protect uploads by type, size, ownership, and path.
- Rate-limit sensitive public and authentication routes.
- Record important admin actions in an audit log.

## Paystack

- Initialize and verify on the server.
- Validate webhook HMAC signature.
- Verify reference, status, amount, currency, and expected owner.
- Use unique references and idempotent processing.
- Never grant value from a client callback alone.

## Gemini

- Server-side only.
- Use structured output or function calling for machine-consumed results.
- Validate output before use.
- Never let the model calculate authoritative financial totals or scores.
- Require confirmation for uncertain bookkeeping suggestions.
- Keep the model name configurable.
- Fail safely without changing financial records.

## Inngest

Use only after an approved decision. Every function must be idempotent, observable, replay-safe, and tested.
