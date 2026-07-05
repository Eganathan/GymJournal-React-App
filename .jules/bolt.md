## 2024-07-24 - Unnecessary Re-computation in Render Loop
**Learning:** Inline computations like `reduce` to calculate 1RM inside JSX expressions, especially inside components like `WorkoutActive` that update frequently on an interval, cause unnecessary and expensive recalculations on every single render.
**Action:** Always extract and memoize derived computations using `useMemo` at the top level of the component when the inputs to that computation change infrequently compared to the component's render frequency.
