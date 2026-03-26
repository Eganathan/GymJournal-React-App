## 2026-03-26 - O(n) array `.find()` in React Render Loops
**Learning:** In React components that render long lists (like search results), using `.find()` inside the `.map()` loop (O(n) per item, O(n*m) total) on arrays causes severe re-render performance bottlenecks, especially when typing into a search input.
**Action:** Always map secondary data arrays (like categories, equipment) into a `Map` wrapped in `useMemo` at the top level of the component, and use `.get()` (O(1) per item, O(n) total) inside the render loop.

## 2026-03-26 - Timer-driven Re-renders & Derived State
**Learning:** Components containing elapsed time counters (like active workouts updating every 1000ms) will aggressively re-render all child logic. Inline array reductions or heavy computations will run every second.
**Action:** Extract expensive inline computations (like calculating estimated 1RM from history) to the top level of the component and wrap them in `useMemo` with minimal dependencies to prevent them from firing on every timer tick.