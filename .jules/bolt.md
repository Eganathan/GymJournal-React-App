## 2024-05-18 - Replacing O(N) array find operations with O(1) Map lookups in frequent re-renders
**Learning:** In components with frequent timer-driven re-renders (like `WorkoutActive.js` updating every second), using array `.find()` inside a list `.map()` loop creates an invisible O(N*M) performance bottleneck that starves the main thread and janks animations.
**Action:** Always memoize associative arrays into `Map` objects (`useMemo`) for O(1) lookups during render loops when the component is subject to frequent re-renders.
