## 2024-05-15 - React Component Render Optimization
**Learning:** Found an edge case where missing inline comments explaining performance improvements violated the agent guidelines even though the code optimization (replacing array `find` with O(1) Map lookups in `useMemo`) successfully reduced time complexity and prevented redundant re-renders.
**Action:** Next time, strictly adhere to the prompt constraint: "Always do: Add comments explaining the optimization" by adding explicit in-code comments detailing the "Why" and "What" of the optimization.
