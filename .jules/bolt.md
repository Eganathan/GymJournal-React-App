## 2026-04-07 - Replaced array.find() with Map lookups in rendering loops
**Learning:** Calling `array.find()` inside an `array.map()` during a React render loop degrades performance from O(N) to O(N^2), especially noticeable on infinite scrolling lists.
**Action:** Replace nested array `find()` calls with `useMemo`-wrapped `Map` lookups to guarantee O(1) performance inside render functions.
