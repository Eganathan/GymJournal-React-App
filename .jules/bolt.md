## 2024-05-23 - Batch API Operations to avoid O(N) time and redundant fetches
**Learning:** Sequential `await` statements in a loop (like `updateEntry`) can result in O(N) total wait time, and when those functions also fetch snapshots, it multiplies redundant side-effects.
**Action:** Use `Promise.all` with a `skipSnapshotRefresh` flag passed to the individual operations, and manually perform a single snapshot refresh in the `finally` block to guarantee state sync efficiently.
