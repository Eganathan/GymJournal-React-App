## 2026-04-05 - [O(1) Map Lookups for Derived Data in Render Loops]
**Learning:** Found an O(N*M) bottleneck in components mapping over search results (e.g. `WorkoutActive.js` and `AddExercise.js`). Performing `array.find()` for related records (categories/equipment) inside map loops causes unnecessary lag, especially during user search typing.
**Action:** Replaced nested `.find()` calls with `useMemo`-wrapped `Map` instantiations for O(1) `.get()` lookups. Always use defensive optional chaining when building maps to prevent crashes if reference arrays are initially empty or null.
