## 2026-03-10 - Unused Variables from Zustand Stores
**Learning:** Selecting unused variables from a Zustand store (like \`const isLoading = useMetricsStore(s => s.isLoading)\` when \`isLoading\` isn't used) causes the component to unnecessarily subscribe to that state. This triggers redundant re-renders whenever the unused state changes, harming performance.
**Action:** Always verify that every variable selected from a Zustand store is actively used in the component. Remove unused selectors rather than relying on ESLint disable comments.

## 2026-03-10 - Memoizing Expensive Derived State in Timer-Driven Components
**Learning:** Components with frequent re-renders (like \`WorkoutActive\` with its 1-second interval timer) will repeatedly execute any unmemoized derived calculations (e.g., array \`.reduce\` operations for \`bestOrm\`) directly in the render loop.
**Action:** Extract expensive derived calculations into a \`useMemo\` hook, especially in components with active timers or high-frequency state updates, to prevent O(N) recalculation on every render. Ensure the dependency array correctly captures the underlying data.
