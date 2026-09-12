---
name: safe-dependency-upgrade
description: Upgrades NNOO framework or package dependencies in a dedicated change with official compatibility research, tests, and rollback.
---

# Safe Dependency Upgrade

1. Keep the upgrade separate from feature work.
2. Read official release notes and migration guides.
3. Check compatibility across Next.js, React, TypeScript, Tailwind, shadcn, Expo, React Native, Supabase, Vercel, and native libraries.
4. Create an upgrade plan and rollback point.
5. Upgrade the smallest compatible group.
6. Pin resolved versions in the lockfile.
7. Run install integrity and security checks.
8. Run all web, mobile, database, API, and end-to-end gates.
9. Update stack records and decision log.
10. Do not mix product features into the upgrade.

Never use beta, canary, or RC packages in production paths without approval.
