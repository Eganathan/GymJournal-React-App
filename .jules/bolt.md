## 2025-03-23 - Render Loop Array Lookups (O(N*M))
**Learning:** Found O(N*M) lookup complexity in React render loops (e.g., `AddExercise.js`, `WorkoutActive.js`) where `Array.prototype.find()` was called repeatedly inside `.map()` loops to map foreign keys (muscle group IDs, equipment IDs) to category data.
**Action:** Replace `.find()` inside mapping loops by wrapping the related arrays in `useMemo` to create `Map` instances, reducing inner loop lookups to O(1) and overall complexity to O(N). Always use defensive optional chaining (`array?.forEach(...)`) when initializing Maps.
