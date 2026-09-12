# Definition of Done

A feature is Done only when all applicable items are true.

## Scope

- Approved specification exists.
- In-scope behaviour is complete.
- Out-of-scope behaviour was not silently added.
- Acceptance criteria are met.

## Code

- Architecture and strict TypeScript rules are followed.
- No production mock data, placeholders, fake success, or silent errors remain.
- Shared logic is not duplicated.
- Existing contracts remain compatible or have an approved migration.

## Data

- Migration exists for every schema change.
- MCP development state matches migrations.
- RLS and tenant tests pass.
- Generated types are current.
- Important actions are auditable.

## Security

- Authorization is server-side and database-enforced where applicable.
- Secrets remain server-only.
- Inputs, uploads, payment events, and AI output are validated.
- Sensitive logs are redacted.

## Quality

- Format, lint, typecheck, and applicable tests pass.
- Web build passes.
- Mobile checks pass.
- Relevant end-to-end and regression tests pass.
- Cross-platform values agree.

## Documentation

- Feature specification and acceptance report are current.
- State, ledger, test matrix, changelog, and prompt log are updated.
- Decisions, versions, security, contracts, and skills records are updated when affected.

## Approval

David Bako has the evidence needed to review the result, and the agent stops without starting another feature.
