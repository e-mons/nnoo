---
name: shared-contract-change
description: Changes shared NNOO API, validation, database, or domain contracts without breaking current web and mobile clients.
---

# Shared Contract Change

1. Identify every producer and consumer.
2. Classify the change as additive, compatible, deprecated, or breaking.
3. Prefer an additive field or versioned endpoint.
4. Update contracts, validation, and domain types.
5. Update server implementation before clients depend on it.
6. Keep old clients working during the compatibility window.
7. Update web and mobile consumers.
8. Add contract tests.
9. Record the change and release order.
10. Remove deprecated fields only in a later approved change after usage is gone.

Never change a shared response shape in only one client.
