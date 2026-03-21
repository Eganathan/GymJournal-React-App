## 2023-10-27 - O(N) Nested Lookups in React Loops
**Learning:** Found a specific anti-pattern in list rendering (`WorkoutActive.js`, `AddExercise.js`) where O(N) `.find()` calls on category/equipment arrays were nested inside mapping iterations, leading to O(N * M) complexity.
**Action:** Always replace `.find()` lookups inside `.map()` render loops with `useMemo`-wrapped `Map` lookups. This transforms complexity to O(N + M) and prevents severe jank as lists grow.
