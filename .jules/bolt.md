## 2024-03-09 - Memoize Maps for O(1) Lookups in Render Loops
**Learning:** Using nested array `.find()` inside a `.map()` (such as `categories.find(c => c.id === id)`) within a React render function leads to O(N * M) time complexity. For lists that grow over time, this creates unnecessary CPU overhead and can cause significant UI lag.
**Action:** Replace `.find()` with a `useMemo`-wrapped `Map` lookup (`categoryMap.get(id)`) to achieve O(1) lookup time, resulting in an O(N) overall render time complexity.
