## 2024-06-11 - Parallelize Store Operations without Redundant Refreshes
**Learning:** When changing O(n) sequential API calls to O(1) concurrent calls (Promise.all) that interact with a shared store, it is critical to prevent each concurrent call from redundantly triggering store refresh operations (like `fetchSnapshot(true)`).
**Action:** Pass an options object (e.g., `{ skipSnapshotRefresh: true }`) to the store actions to bypass automatic refreshes during batch operations, then explicitly trigger a single manual refresh at the end.
