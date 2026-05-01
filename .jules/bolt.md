## 2024-05-01 - Batch API requests in MetricsLog
**Learning:** Found a performance bottleneck where multiple API update calls triggered redundant sequential `fetchSnapshot` calls.
**Action:** Used `Promise.all` to batch the API requests and introduced a `skipSnapshotRefresh` option to ensure the snapshot is only fetched once after all operations complete.
