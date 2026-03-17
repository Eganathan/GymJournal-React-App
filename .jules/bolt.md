## 2026-03-17 - [Optimized Mapping of Arrays to Objects to Maps]
**Learning:** Found O(M*N) nested looping overhead while using `.find()` inside a `.map` to fetch array items. This causes major performance issue when N > 100 on large data lists.
**Action:** Replaced the array `.find()` inside `.map` with a `useMemo` map lookup in React logic to guarantee O(1) fetch inside arrays iterations, ensuring fast renders. Optional chaining `?.forEach` on array must be used defensively to prevent crash when data defaults to `null` on first load.
