## 2025-02-19 - Batching API Calls & Optimizing Snapshot Refreshes
**Learning:** In `MetricsLog.js`, sequential `await` updates in loops cause O(N) I/O total time and inadvertently trigger repeated snapshot refreshes because stores automatically invalidate caching on every write.
**Action:** Replace sequential updates with `Promise.all` to batch requests and use `skipSnapshotRefresh` patterns in Zustand stores to prevent N+1 store invalidations, following up with a single manual cache refresh.
