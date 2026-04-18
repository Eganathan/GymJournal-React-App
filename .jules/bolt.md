
## 2023-10-24 - Batching Snapshot Refreshes When Parallelizing API Calls
**Learning:** When parallelizing API update calls (e.g., using `Promise.all`), side-effects like store state refreshes (e.g., fetching a snapshot from the server) should be bypassed during the individual parallel operations to prevent N simultaneous fetch requests.
**Action:** Always modify the store to accept an option (like `skipSnapshotRefresh: true`) to bypass automated refreshing, and add a mechanism to manually trigger the refresh once after the `Promise.all` completes.
