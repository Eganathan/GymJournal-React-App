## 2026-03-11 - Replace O(N*M) list lookups with O(N+M) Map indexing
**Learning:** Found a common anti-pattern in React list rendering where `categories.find(c => c.id === ex.categoryId)` is called inside an `exercises.map` loop, causing O(N*M) time complexity during every render.
**Action:** Extract list lookups into a `useMemo`-backed `Map` (e.g., `new Map(categories.map(c => [String(c.id), c]))`) to achieve O(1) retrieval time and O(N+M) overall complexity.
