## 2025-06-05 - Batching store operations and Promises to avoid redundant fetches
**Learning:** Using `Promise.all` inside React components without updating store methods can cause redundant, concurrent store fetches (e.g. multiple `fetchSnapshot` calls at once).
**Action:** When parallelizing operations that have side-effects like cache invalidation in a Zustand store, always provide an `opts = { skipSnapshotRefresh: true }` parameter so that cache invalidation and re-fetching can happen exactly once after the batch finishes.
