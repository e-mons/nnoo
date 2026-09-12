# Always-On Rule: Supabase MCP and Data Safety

Use the connected Supabase MCP Server for live development schema, authentication, storage, RLS, function, and database inspection work.

Canonical Project Reference: `hoorlxgtnamwdxszsbwt` (NNOO Bus Project)
Canonical Organization ID: `ggxbxqtzlevaceudwnri`
Under no circumstances should any other Supabase project, organization, or alternative instance be used for this repository. All MCP operations must strictly target this project reference.

Every live change must have a matching migration under `supabase/migrations`.

Required sequence:

1. Inspect.
2. Plan.
3. Write migration.
4. Review data impact.
5. Apply through MCP to development.
6. Apply RLS.
7. Test tenant isolation.
8. Regenerate types.
9. Run application tests.
10. Update project records.

Rules:

- Enable RLS on exposed business tables.
- Use `business_id` as the normal tenant boundary.
- Never trust a client business ID without membership validation.
- Never place secret/service credentials in web or mobile clients.
- Never delete old migrations.
- Prefer additive, backward-compatible changes.
- Destructive changes require staged migration, backup, backfill, compatibility, and rollback plans.
- Audit important financial and administrative actions.
- Never claim MCP work is complete until repository and live development state match.
