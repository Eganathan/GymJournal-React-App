
## 2024-03-09 - [Reduce Redundant Calculations in Timer-Driven Components]
**Learning:** In components with frequent, timer-driven re-renders (like `WorkoutActive.js` updating elapsed time every second), inline computations such as array `reduce` for derived state (like estimated 1RM `bestOrm`) can cause redundant calculations on every render, wasting CPU cycles and potentially degrading UI performance.
**Action:** Always extract derived computations from the JSX and wrap them in `useMemo` at the top level of the component, ensuring they only re-calculate when their dependencies change.
