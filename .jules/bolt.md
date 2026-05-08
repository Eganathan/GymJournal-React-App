## 2024-05-08 - Array Find inside Render Loop
**Learning:** In React components with frequent re-renders (like `WorkoutActive.js` updating every second for elapsed time), using `.find()` inside a `.map()` block for rendering large lists creates an O(N*M) bottleneck that significantly impacts UI performance.
**Action:** Always memoize arrays into Maps using `useMemo` (e.g. `const map = new Map(); arr?.forEach(i => map.set(i.id, i));`) to convert these lookups to O(1), ensuring defensive optional chaining to prevent crashes on initial render when data might be null.

## 2024-05-08 - Expensive Calculations in Render Loop
**Learning:** Calculating derived state, such as estimated 1RM `bestOrm` from a history array, inline within a component that is driven by a `setInterval` hook causes the calculation to re-run unnecessarily every second.
**Action:** Extract expensive or O(N) derived calculations into a `useMemo` hook with proper dependency arrays (e.g. `[pbs]`) so they only compute when the underlying data actually changes, regardless of how often the component re-renders.
