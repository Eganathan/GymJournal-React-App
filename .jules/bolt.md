
## 2024-05-18 - Promise.all and Redundant Cache Invalidation Side Effects
**Learning:** Parallelizing multiple API operations using `Promise.all` can cause a "stampeding herd" of redundant requests if the underlying store functions automatically trigger cache invalidation and data re-fetching upon completion (e.g., calling `fetchSnapshot(true)`). This creates O(N) full-data refreshes relative to the batch size, negating the performance benefits of parallel I/O.
**Action:** When parallelizing functions that have data-refresh side effects, parameterize those side effects (e.g., using an `{ skipSnapshotRefresh: true }` option) to disable them during parallel execution. Then, manually dispatch a single refresh operation after the `Promise.all` resolves to ensure only one fetch occurs.
