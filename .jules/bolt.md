## 2025-01-20 - [Promise.all Batching for Form Submissions]
**Learning:** Sequential await calls in form loops (e.g., updating multiple entries) can cause O(N) I/O wait times and redundantly refresh global snapshot state.
**Action:** Use Promise.all to parallelize batch API operations and pass flags (e.g., `skipSnapshotRefresh: true`) to bypass redundant snapshot refreshes, then manually invalidate/refresh the snapshot once after all promises resolve.
