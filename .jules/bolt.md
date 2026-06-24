## 2025-02-20 - [Memoize Derived Computations]
**Learning:** Derived computations such as personal best (PB) reductions must be memoized with useMemo in components with frequent timer-driven re-renders (e.g. WorkoutActive.js). Unmemoized calculations degrade UI performance.
**Action:** Always extract complex derivations like reduce into useMemo at the component root level, especially if they are defined inside an IIFE in the render block.
