## 2025-07-06 - [Memoization of timer-driven derived data]
**Learning:** In components with frequent, timer-driven re-renders (e.g. `WorkoutActive` updating every second), unmemoized derived computations like the PB reduction calculation inside an IIFE run on every render, wasting CPU resources.
**Action:** Always move such inline reductions out of IIFEs and wrap them in `useMemo`, placing the hook at the top level of the component to adhere to the Rules of Hooks.
