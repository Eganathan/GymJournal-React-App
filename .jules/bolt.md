## 2025-04-14 - Batch Zustand store actions to prevent redundant API fetches
**Learning:** Sequential calls to Zustand store actions that individually refresh server state can result in massive, redundant API calls (e.g., O(n) snapshot refreshes instead of 1).
**Action:** When executing batch updates, accept an option (e.g. `skipSnapshotRefresh: true`) to suppress automatic invalidation. Execute operations concurrently via `Promise.all` and run a single, explicit manual refresh (`refreshSnapshot`) afterwards.
