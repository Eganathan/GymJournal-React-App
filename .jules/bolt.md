## 2024-05-15 - Batched API requests in Loops
**Learning:** Sequential await operations inside loops cause N+1 network requests and trigger redundant UI/State updates which drastically degrades performance.
**Action:** Use Promise.all to parallelize updates. Also ensure the underlying store implementation is modified to allow `{ skipSnapshotRefresh: true }` options so redundant data fetching loops are prevented.
