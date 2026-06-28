## 2025-06-28 - [Batch Updates Performance]
**Learning:** Sequential `await` calls in loops for batch operations (like `updateEntry` in `MetricsLog.js`) cause O(N) I/O time. This is a common performance bottleneck on the frontend when multiple items are updated.
**Action:** Replace sequential `await` calls in loops with `Promise.all` for batch operations to reduce I/O time to O(1). Be careful about the store methods triggering snapshot updates concurrently - they should either be batched or have snapshot refresh skipped.
