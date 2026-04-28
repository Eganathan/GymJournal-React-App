## 2025-03-09 - Parallelizing Stateful API Operations Avoids N+1 Snapshot Requests
**Learning:** When batching multiple stateful API operations using `Promise.all` (such as `logEntries` and `updateEntry` loops), automatic snapshot cache refresh built into each store method can lead to redundant concurrent refresh requests to the backend (N+1 problem).
**Action:** Introduced a `skipSnapshotRefresh` option in the state update methods to prevent automatic store refreshes, and executed a single manual `refreshSnapshot()` call after all parallel operations in `Promise.all` resolve.
