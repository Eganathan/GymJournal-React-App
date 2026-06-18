## 2024-06-18 - Batching API Updates and Store Refreshes
**Learning:** Sequential `await` loops combined with implicit store refreshes cause O(N) wait times and redundant API requests.
**Action:** When updating multiple entities, parallelize with `Promise.all()`, disable automatic store refreshes per item, and trigger a single manual refresh at the end.
