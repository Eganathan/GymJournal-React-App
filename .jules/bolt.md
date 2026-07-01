## 2024-07-01 - Parallelizing Batch API Operations with Zustand Stores
**Learning:** Sequential `await` calls in a loop that also trigger Zustand store re-fetches (e.g., `updateEntry` calling `fetchSnapshot`) result in severe O(N) network cascades and unnecessary global state updates.
**Action:** Parallelize the API requests with `Promise.all` and introduce an options object (e.g., `{ skipSnapshotRefresh: true }`) to bypass the per-item store refresh, performing a single global refresh afterward.
