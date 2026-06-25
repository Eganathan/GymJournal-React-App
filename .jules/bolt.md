## 2025-02-18 - Batching Zustand Store Actions to Prevent Redundant I/O and Renders
**Learning:** Sequential await calls for store actions like `updateEntry` inside a loop can trigger multiple redundant API fetches (like `fetchSnapshot`) and re-renders, increasing total I/O time to O(N).
**Action:** Expose an option (e.g. `skipSnapshotRefresh: true`) to bypass automatic cache invalidation in store methods, execute the modifications concurrently with `Promise.all`, and then manually invalidate and refresh the store snapshot exactly once.
