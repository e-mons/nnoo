---
name: supabase-mcp-change
description: Safely changes NNOO Supabase schema, authentication, storage, policies, functions, or generated types through the connected MCP Server.
---

# Supabase MCP Change

## Preflight

- Read data and security rules.
- Inspect current development state through MCP.
- Confirm target environment.
- Identify affected web, mobile, admin, API, and background consumers.

## Workflow

1. Write a migration file first.
2. Prefer additive backward-compatible changes.
3. Add constraints and indexes deliberately.
4. Add or update RLS policies.
5. Apply through MCP to development.
6. Test owner, permitted staff, wrong-business user, unauthenticated user, and admin behaviour.
7. Regenerate shared types.
8. Update contracts and validation.
9. Run integration and regression tests.
10. Document the migration.

Stop for approval before dropping, renaming, narrowing, rewriting, or bulk-changing data. Provide backup, compatibility, backfill, release-order, and rollback plans.

Completion requires repository migration, generated types, tests, and live development state to agree.
