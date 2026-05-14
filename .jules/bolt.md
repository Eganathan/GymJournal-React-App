## 2024-05-24 - [Parallelizing Store Cache Invalidation]
**Learning:** In a Zustand store with auto-refreshing snapshot methods, executing sequential API updates loops triggers N+1 cache refreshes.
**Action:** When converting sequential `await` loops to `Promise.all` in components, update the store actions to optionally accept a `skipSnapshotRefresh` parameter to prevent redundant fetch requests, and manually execute a single `refreshSnapshot` after the `Promise.all` completes.
