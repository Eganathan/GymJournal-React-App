## 2025-03-09 - Parallelized sequential updates to avoid N+1 state sync problems
**Learning:** Store update and log functions were performing separate, redundant `fetchSnapshot(true)` operations, causing network and UI stalls equivalent to O(N) when saving a large form.
**Action:** Implemented a `skipSnapshotRefresh` parameter in the store and a manual `refreshSnapshot()` action, enabling parallelization via `Promise.all()` and a single state sync in the view layer.
