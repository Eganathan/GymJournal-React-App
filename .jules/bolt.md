## 2024-06-18 - Batching API Calls with Store Invalidation
**Learning:** Parallelizing store methods that internally refresh remote data can cause race conditions or redundant sequential requests if they all try to invalidate the same snapshot concurrently.
**Action:** When parallelizing operations via `Promise.all`, add an options flag (e.g. `{ skipSnapshotRefresh: true }`) to bypass internal refreshes, execute the batch, then manually invalidate and refresh the store snapshot exactly once afterwards.
