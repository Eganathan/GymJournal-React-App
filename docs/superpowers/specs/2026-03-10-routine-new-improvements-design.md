# RoutineNew.js — Improvements Design
_Date: 2026-03-10_

## Overview

Three UX improvements to the New Routine screen in `src/pages/RoutineNew.js`:

1. Multi-select exercise picker
2. Per-set rows with auto-fill from Set 1
3. Auto-rest insertion (remove manual "Add Rest" button)

---

## 1. Multi-select Exercise Picker

**Current behaviour:** Tapping an exercise immediately adds it and closes the panel.

**New behaviour:**
- Tapping an exercise toggles a checkmark (selected / deselected).
- Already-added exercises remain dimmed with a green check (non-toggleable).
- A sticky "Add X Exercise(s)" button appears at the bottom of the panel when `selectedCount > 0`.
- Pressing the button closes the panel and inserts all selected exercises (with auto-rest, see §3).

**State changes:**
- Add `selectedExIds: Set` — `useState(new Set())`
- Remove `addingExId` (no longer needed for single-add spinner)
- Rename `handleAddExercise` → `handleBatchAdd(selectedExIds)`

---

## 2. Per-Set Rows with Auto-fill

### Data structure change

Replace flat fields:
```js
{ sets: 3, repsPerSet: 10, weightKg: null }
```
with a `setRows` array:
```js
{
  setRows: [
    { reps: 10, weightKg: null },
    { reps: 10, weightKg: null },
    { reps: 10, weightKg: null },
  ]
}
```

For API backward-compat, derive and keep flat fields on save:
```js
sets: item.setRows.length,
repsPerSet: item.setRows[0]?.reps ?? 10,
weightKg: item.setRows[0]?.weightKg ?? null,
```

### UI rendering

Each exercise card shows a compact table:

```
SET   REPS   WEIGHT (kg)
 1     [10]    [--]        🗑
 2     [10]    [--]        🗑
 3     [10]    [--]        🗑
                  [+ Add Set]
```

- "Add Set" appends a copy of the last row.
- Row delete (🗑) is disabled if only 1 row remains.
- Column headers shown once above the rows.

### Auto-fill from Set 1

Constants for "default / untouched" values:
- `DEFAULT_REPS = 10`
- `DEFAULT_WEIGHT = null`

When the user edits **Set 1**:
- `reps` changed → update all lower rows where `row.reps === DEFAULT_REPS`
- `weightKg` changed → update all lower rows where `row.weightKg === DEFAULT_WEIGHT`

Rows where the user has already entered a custom value are left alone.

Handler:
```js
const handleSetRowChange = (itemIdx, rowIdx, field, value) => {
  setItems(prev => prev.map((item, i) => {
    if (i !== itemIdx) return item;
    const rows = item.setRows.map((row, r) => {
      if (r === rowIdx) return { ...row, [field]: value };
      // auto-fill: only propagate from row 0 to rows still at default
      if (rowIdx === 0 && r > 0) {
        const isDefault = field === 'reps'
          ? row.reps === DEFAULT_REPS
          : row.weightKg === DEFAULT_WEIGHT;
        if (isDefault) return { ...row, [field]: value };
      }
      return row;
    });
    return { ...item, setRows: rows };
  }));
};
```

---

## 3. Auto-rest Between Exercises

### Removed
- "Add Rest" button from the toolbar
- `showRestSheet` / `restDuration` state
- `<BottomSheet>` for rest (entire block removed)
- `handleAddRest` function
- `Timer` import from lucide (if no longer used elsewhere)

### Added
Auto-insert 120 s REST blocks when exercises are added:

```
Existing list ends with EXERCISE?  →  prepend REST before first new exercise
Between each new exercise in batch  →  insert REST
Never append REST after the last exercise
```

Logic (called from `handleBatchAdd`):
```js
const REST_DEFAULT_S = 120;
const newBlocks = [];
const lastItem = items[items.length - 1];

toAdd.forEach((ex, idx) => {
  const needsLeadingRest = idx === 0
    ? lastItem?.type === 'EXERCISE'
    : true; // always between exercises in batch
  if (needsLeadingRest) {
    newBlocks.push({ type: 'REST', durationSeconds: REST_DEFAULT_S });
  }
  newBlocks.push({
    type: 'EXERCISE',
    exerciseId: ex.id,
    exerciseName: ex.name,
    setRows: [
      { reps: DEFAULT_REPS, weightKg: DEFAULT_WEIGHT },
      { reps: DEFAULT_REPS, weightKg: DEFAULT_WEIGHT },
      { reps: DEFAULT_REPS, weightKg: DEFAULT_WEIGHT },
    ],
    notes: '',
  });
});

setItems(prev =>
  [...prev, ...newBlocks].map((item, i) => ({ ...item, order: i + 1 }))
);
```

### Inline REST card editing

REST cards remain in the list and are still editable. Replace the full BottomSheet with inline quick-select chips directly on the card:

```
⏱ Rest    [30s] [1m] [1:30] [2m] [3m]    🗑  ↑ ↓
```

Active chip is highlighted. No modal needed.

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/RoutineNew.js` | All changes above — single file |

No store or API changes needed. The `items` array shape sent to `routinesApi.create` gains `setRows`; flat fields are derived on save for backward-compat.

---

## Non-goals

- No changes to WorkoutActive.js, routineStore, or the API schema
- No drag-to-reorder (existing chevron buttons remain)
- No per-set rest configuration
