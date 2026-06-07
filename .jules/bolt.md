## 2024-05-18 - Batching Store Methods with Snapshot Refreshes
**Learning:** Parallelizing state actions like `updateEntry` via `Promise.all` can cause a "refresh storm" if each action independently triggers an expensive `fetchSnapshot` call.
**Action:** Add an `opts.skipSnapshotRefresh` parameter to store methods to suppress intermediate refreshes when batching, then manually trigger one refresh at the end.
