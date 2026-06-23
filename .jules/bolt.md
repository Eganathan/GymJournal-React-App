## 2024-05-24 - Batching API calls with explicit store invalidation
**Learning:** Parallelizing sequential array updates using `Promise.all` improves overall completion time (O(n) I/O vs O(1)). However, when underlying stores trigger fetches automatically on change, this risks massive "fetch storms".
**Action:** In addition to parallelizing requests, introduce mechanisms to bypass automatic downstream refetches on individual operations and manually perform single batch refetches. Also, removing unused store subscriptions ensures no unnecessary re-renders when states changes.
