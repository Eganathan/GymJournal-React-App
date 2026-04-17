1. **Analyze `src/pages/WorkoutActive.js` and `src/pages/AddExercise.js` for O(n^2) nested loops:**
   - Both files have `.map()` calls over an `exercises` array (in `AddExercise`) or `exResults` array (in `WorkoutActive`).
   - Inside the map callback, there are two `.find()` calls:
     - `exCategories.find((c) => String(c.id) === String(ex.primaryMuscleId))`
     - `exEquipment.find((e) => String(e.id) === String(ex.equipmentId))`
   - These nested `.find()` calls on `categories` and `equipment` arrays result in O(N*M) complexity.

2. **Refactor using `useMemo` for O(1) hash map lookups:**
   - Instead of repeatedly iterating through `exCategories` and `exEquipment` for every exercise, I will convert them into Maps indexed by stringified IDs.
   - Example (for `WorkoutActive.js`):
     ```javascript
     const categoryMap = useMemo(() => {
       const map = new Map();
       exCategories?.forEach(c => map.set(String(c.id), c));
       return map;
     }, [exCategories]);
     ```
   - Then, replace the `.find()` calls in the rendering map with O(1) `.get()` lookups.

3. **Verify and measure impact:**
   - This optimization follows Bolt's favorite optimizations ("Replace O(n²) nested loop with O(n) hash map lookup" and "Memoize expensive calculation with useMemo/computed").
   - Expected impact: Reduced render time during searches or filtering when viewing exercises, particularly for long lists of search results (like 8+ items).

4. **Complete Pre-commit steps:**
   - Ensure proper testing, verification, review, and reflection are done (by calling `pre_commit_instructions`).
