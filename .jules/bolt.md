## 2025-03-09 - Avoid O(N) array finds in render loops
**Learning:** Found multiple instances where `categories.find()` and `equipment.find()` were called inside `.map()` render loops (e.g., in `WorkoutActive.js` and `AddExercise.js`), resulting in O(N^2) complexity during list rendering.
**Action:** Always pre-compute a `Map` wrapped in `useMemo` for reference data (like categories and equipment) and use `.get()` inside render loops to achieve O(1) lookups, ensuring arrays are checked safely using optional chaining.
