## 2024-05-24 - O(n) rendering map lookups
**Learning:** In React components with lists that need to reference dictionary data (like categories or equipment metadata), using `array.find()` inside the render loop for each item creates an O(N*M) performance bottleneck.
**Action:** Always pre-compute a `Map` of the lookup data wrapped in `useMemo` at the top of the component, and use `map.get(id)` for O(1) lookups during rendering.
