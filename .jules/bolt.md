## 2025-04-03 - Optimizing Bulk Metrics Logging

**Learning:** When users log multiple metrics at once, executing individual `updateEntry` API calls in a loop with embedded side effects (like fetching a state snapshot) results in `O(N)` API roundtrips and massive frontend stuttering due to repeated invalidations.

**Action:** Extracted the side-effect (snapshot refresh) into a parameterized flag (`skipSnapshotRefresh: true`). Grouped all asynchronous `updateEntry` API calls using `Promise.all` for parallel execution (`O(1)` runtime overhead), followed by a single manual snapshot refresh at the end. Always inspect state stores (`zustand`) for hidden network side effects when optimizing loops.
