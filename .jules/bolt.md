## 2026-04-24 - Parallelizing batch API operations
**Learning:** Sequential await calls in loops for batch API operations create an O(N) bottleneck relative to request count. By parallelizing requests using Promise.all, we reduce the total I/O time to roughly O(1) in terms of latency, drastically improving UI responsiveness for multi-record operations.
**Action:** Replace sequential 'await' calls inside loops with 'Promise.all' for independent API operations, and ensure redundant state invalidation calls are prevented during the batch.
