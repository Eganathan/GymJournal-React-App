
## 2024-05-18 - [Optimization] O(1) hash map lookup for categories and equipment
**Learning:** In lists mapped from components with frequent updates (like `WorkoutActive.js` adding sets/re-rendering timers, and search sheets like `AddExercise.js`), `.find()` over arrays can cause O(n*m) complexity on every render, wasting CPU cycles on relatively static data like categories and equipment.
**Action:** Always memoize arrays using `useMemo` into `Map` structures when doing lookups inside `.map()` render loops to ensure O(1) complexity.
