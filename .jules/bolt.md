## 2024-05-24 - Batching concurrent updates
**Learning:** Sequential await inside loops for API calls (e.g., PUT updates in MetricsLog) can cause significant N+1 I/O delays, and store triggers like fetchSnapshot can compound the problem by refreshing state on every individual update.
**Action:** Replace for...of loops with Promise.all for independent network requests and pass configuration (like skipSnapshotRefresh) to the store to delay the state refresh until all requests are completed. Move the state refresh to a finally block to avoid out-of-sync state if partial failures occur.
