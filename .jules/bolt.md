
## 2026-05-28 - O(1) Map Lookups Over O(N^2) Array Finds
**Learning:** Inside a large `.map` or rendering loop, calling `.find()` on an array is highly inefficient, leading to an O(N^2) operation. When optimizing React components, rendering loops with nested array finds should be replaced.
**Action:** Pre-compute lookup maps using `useMemo` when working with categories, equipments, or reference items, turning O(N^2) time complexity into O(N) linear time and O(1) lookups during rendering. Always use defensive optional chaining like `array?.forEach(...)` when creating Maps to avoid crashes if variables are undefined.
