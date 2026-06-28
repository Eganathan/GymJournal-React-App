## 2025-02-27 - Batching and parallelizing API calls and state refresh
**Learning:** Using sequential `await` in loops for state-updating API operations results in O(N) network latency and redundant store updates (e.g. repeated snapshot refreshes).
**Action:** Replace sequential API calls with `Promise.all` for O(1) latency, pass configuration options to skip internal state refresh side-effects, and perform a single manual state refresh at the end of the batch.
