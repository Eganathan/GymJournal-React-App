## 2025-02-23 - Parallelize Sequential Updates to Prevent Redundant Cache Refresh
**Learning:** In components making batch API operations, sequential awaits inside loops cause O(N) I/O wait times and multiple redundant downstream data refreshes (e.g., snapshot fetches).
**Action:** Use `Promise.all` with a flag to bypass automatic downstream refreshes in individual store calls, then trigger a single manual data refresh after the batch completes. Always log caught errors using `console.error` even if UI errors are handled silently.
