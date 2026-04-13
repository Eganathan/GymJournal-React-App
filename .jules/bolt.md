## 2026-04-12 - Replacing Array.find() with Map lookups in Render Loops
**Learning:** In components with long lists and nested `Array.find()` operations (e.g. mapping over exercise results and finding matching categories/equipment for each), it results in O(N*M) complexity.
**Action:** Always extract the array into a `Map` using `useMemo` for O(1) lookups during the render loop. Ensure optional chaining is used when constructing the Map to prevent crashes on initial render when data might be null/undefined.
