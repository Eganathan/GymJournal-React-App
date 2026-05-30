## 2024-05-18 - Parallelizing batched API calls with Zustand cache

**Learning:** When using Zustand stores that automatically invalidate and refresh cache/snapshots after mutating API calls (e.g., `logEntries` or `updateEntry`), using `Promise.all` to parallelize multiple mutations will result in redundant, overlapping fetch calls that degrade performance and cause race conditions.

**Action:** Add an `opts = { skipSnapshotRefresh?: boolean }` parameter to store methods to conditionally bypass the auto-refresh. When using `Promise.all` on these methods in components, pass `skipSnapshotRefresh: true`, and manually invalidate and trigger a single refresh from the component after all promises resolve.
