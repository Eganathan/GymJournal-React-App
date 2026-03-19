## 2024-03-19 - [O(n²) Render Loop Bottleneck in React Mappings]
**Learning:** Found an anti-pattern in `WorkoutActive.js` and `AddExercise.js` where `.find()` was called on large arrays (`categories` and `equipment`) inside a `.map()` function during every render, causing O(n²) time complexity for rendering lists.
**Action:** Always replace nested `.find()` loops inside `.map()` render paths with O(1) `Map` lookups created outside the loop, especially for potentially long lists of UI elements.
