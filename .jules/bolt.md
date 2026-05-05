
## 2024-05-06 - Batch API operations in MetricsLog for O(1) I/O
**Learning:** Sequential await operations in UI batch forms like `MetricsLog` cause N+1 API calls relative to the number of updated fields. Converting them to `Promise.all` can drastically improve throughput but risks N+1 concurrent store refreshes (snapshot fetches) due to Zustand store side-effects.
**Action:** When parallelizing Zustand mutate actions (like `logEntries` and `updateEntry`), ensure to pass an option (`skipSnapshotRefresh: true`) to bypass the store's automatic post-update snapshot fetch, and manually trigger `refreshSnapshot()` exactly once after the `Promise.all` completes.
