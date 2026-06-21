## 2024-06-21 - [Parallelizing State-Refreshing API Calls]
**Learning:** Sequential `await` calls in loops that each trigger a store refresh (e.g., `fetchSnapshot(true)`) cause O(N) redundant network requests and I/O time.
**Action:** Parallelize the API calls using `Promise.all`, pass a flag to skip individual auto-refreshes, and perform a single manual store state invalidation and refresh at the end.
