# Always-On Rule: Quality Gates

Do not report a feature as finished without evidence.

Minimum applicable gates:

- Format check.
- Lint.
- Strict TypeScript check.
- Unit tests.
- Database and RLS tests.
- API integration tests.
- Web production build.
- Mobile tests.
- Expo Doctor.
- Relevant end-to-end journey.
- Cross-platform data consistency.
- Cross-tenant denial test.
- Regression tests for completed features.
- Documentation update.

A failing required gate blocks completion.

Do not weaken tests, types, lint rules, RLS, validation, or security controls merely to make a check pass. Every acceptance report must name the commands run and their real result.
