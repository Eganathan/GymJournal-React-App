
## 2024-03-09 - Memoizing in JSX vs Top Level
**Learning:** In React components with frequent state updates (like timer-driven elapsed time), placing heavy computations like array reductions inside Immediately Invoked Function Expressions (IIFEs) within JSX causes the computation to run on *every* single render.
**Action:** Always extract such calculations to the top level of the component and wrap them in `useMemo` with proper dependencies to ensure they are only recalculated when their specific inputs change.

## 2024-03-09 - Optimizing Array Lookups in Render Loops
**Learning:** Using `array.find()` inside a `.map` render loop results in O(N*M) time complexity, which can visibly stutter the UI on large lists.
**Action:** Pre-compute lookup tables as `Map`s using `useMemo` for O(1) lookups during render. When generating these Maps, always use defensive optional chaining (e.g., `data?.forEach(...)`) to prevent crashes during the initial render if the data is fetched asynchronously and starts as undefined/null.
