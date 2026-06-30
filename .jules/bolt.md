## 2024-05-24 - Batching API Updates with Promise.all
**Learning:** Sequential API requests in loops (like `updateEntry`) cause O(N) network latency and redundant store refreshes (`fetchSnapshot`).
**Action:** Use `Promise.all` for parallel execution and add an `options = { skipSnapshotRefresh: true }` parameter to store methods to prevent redundant re-renders/fetches. Invalidate and fetch state once manually after `Promise.all` completes.
