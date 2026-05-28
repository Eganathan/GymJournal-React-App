
## 2024-05-24 - Batching Concurrent Updates and Preventing Redundant Store Re-renders
**Learning:** Sequential `await` calls in loops can create a performance bottleneck for I/O operations. Using `Promise.all` can parallelize these calls, reducing I/O time from O(N) to O(1). However, when batching operations that trigger full state invalidations/refreshes (like Zustand stores doing `fetchSnapshot(true)` on every mutation), executing them concurrently causes multiple redundant API calls and state updates.
**Action:** When parallelizing API calls that automatically refresh store state, add an option (e.g. `opts = { skipSnapshotRefresh: true }`) to the individual operations. Then, manually trigger a single state invalidation/refresh after the `Promise.all` batch completes.
