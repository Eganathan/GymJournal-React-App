# RoutineNew.js Improvements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-select exercise picker, per-set rows with auto-fill from Set 1, and automatic rest-block insertion to `RoutineNew.js`.

**Architecture:** All changes are isolated to `src/pages/RoutineNew.js`. The exercise item data model changes from flat `{sets, repsPerSet, weightKg}` to `{setRows: [{reps, weightKg}]}`. Flat fields are derived on save for API backward-compat. Rest blocks are auto-inserted between exercises; the manual "Add Rest" button and its BottomSheet are removed. Inline duration chips replace the BottomSheet for editing existing REST cards.

**Tech Stack:** React 18, Tailwind CSS, Zustand, lucide-react, Catalyst AppSail (`catalyst deploy --only client` to deploy)

**Spec:** `docs/superpowers/specs/2026-03-10-routine-new-improvements-design.md`

---

## Chunk 1: Per-Set Rows — Data Model + Display

### Task 1: Replace flat exercise fields with `setRows` array

**Files:**
- Modify: `src/pages/RoutineNew.js`

**Constants to add** (top of component, before state):
```js
const DEFAULT_REPS = 10;
const DEFAULT_WEIGHT = null;
const REST_DEFAULT_S = 120;
const DEFAULT_SET_ROWS = () => [
  { reps: DEFAULT_REPS, weightKg: DEFAULT_WEIGHT },
  { reps: DEFAULT_REPS, weightKg: DEFAULT_WEIGHT },
  { reps: DEFAULT_REPS, weightKg: DEFAULT_WEIGHT },
];
```

- [ ] **Step 1: Add the four constants** inside `RoutineNew()` just before the state declarations.

- [ ] **Step 2: Update `handleAddExercise`** — replace the flat fields with `setRows`:

```js
const handleAddExercise = (exercise) => {
  setAddingExId(exercise.id);
  setItems((prev) => [
    ...prev,
    {
      type: 'EXERCISE',
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      setRows: DEFAULT_SET_ROWS(),
      notes: '',
      order: prev.length + 1,
    },
  ]);
  setTimeout(() => {
    setAddingExId(null);
    setShowExSheet(false);
    setExSearch('');
  }, 200);
};
```

- [ ] **Step 3: Update `handleSave`** — derive the flat fields from `setRows` before passing to the API.

Find the `handleSave` function. The `createRoutine` call passes `items` directly. Map over items to normalize them before saving:

```js
const handleSave = async () => {
  setError('');
  if (!name.trim()) { setError('Routine name is required'); return; }
  if (items.length === 0) { setError('Add at least one exercise'); return; }

  // Derive flat fields from setRows for API backward-compat
  const normalizedItems = items.map((item) => {
    if (item.type !== 'EXERCISE') return item;
    const rows = item.setRows || [];
    return {
      ...item,
      sets: rows.length || 1,
      repsPerSet: rows[0]?.reps ?? DEFAULT_REPS,
      weightKg: rows[0]?.weightKg ?? DEFAULT_WEIGHT,
    };
  });

  setSaving(true);
  const id = await createRoutine({
    name: name.trim(),
    description: description.trim(),
    items: normalizedItems,
    isPublic,
  });
  if (id) {
    navigate(`/routines/${id}`, { replace: true });
  } else {
    setError('Failed to create routine');
  }
  setSaving(false);
};
```

- [ ] **Step 4: Add `handleSetRowChange` and `handleAddSetRow` and `handleRemoveSetRow`** — place these just after `handleUpdateExercise`:

```js
const handleSetRowChange = (itemIdx, rowIdx, field, rawValue) => {
  const value = field === 'reps'
    ? (parseInt(rawValue) || DEFAULT_REPS)
    : (rawValue === '' ? DEFAULT_WEIGHT : rawValue);

  setItems((prev) =>
    prev.map((item, i) => {
      if (i !== itemIdx) return item;
      const rows = item.setRows.map((row, r) => {
        if (r === rowIdx) return { ...row, [field]: value };
        // Auto-fill: propagate Set 1 changes to rows still at their default
        if (rowIdx === 0 && r > 0) {
          const stillDefault =
            field === 'reps'
              ? row.reps === DEFAULT_REPS
              : row.weightKg === DEFAULT_WEIGHT;
          if (stillDefault) return { ...row, [field]: value };
        }
        return row;
      });
      return { ...item, setRows: rows };
    })
  );
};

const handleAddSetRow = (itemIdx) => {
  setItems((prev) =>
    prev.map((item, i) => {
      if (i !== itemIdx) return item;
      const last = item.setRows[item.setRows.length - 1] || { reps: DEFAULT_REPS, weightKg: DEFAULT_WEIGHT };
      return { ...item, setRows: [...item.setRows, { ...last }] };
    })
  );
};

const handleRemoveSetRow = (itemIdx, rowIdx) => {
  setItems((prev) =>
    prev.map((item, i) => {
      if (i !== itemIdx) return item;
      if (item.setRows.length <= 1) return item; // must keep at least 1
      return { ...item, setRows: item.setRows.filter((_, r) => r !== rowIdx) };
    })
  );
};
```

- [ ] **Step 5: Replace the exercise card's current 3-column grid** with per-set rows.

Find the `/* EXERCISE Block */` section in the JSX. Replace the `<div className="grid grid-cols-3 gap-3">` block (the sets/reps/weight inputs) with this per-set table:

```jsx
{/* Per-set rows */}
<div className="mt-3">
  {/* Column headers */}
  <div className="grid grid-cols-[28px_1fr_1fr_28px] gap-x-2 mb-1 px-0.5">
    <span className="text-[10px] uppercase tracking-wider font-medium text-center" style={{ color: 'var(--text-muted)' }}>SET</span>
    <span className="text-[10px] uppercase tracking-wider font-medium text-center" style={{ color: 'var(--text-muted)' }}>REPS</span>
    <span className="text-[10px] uppercase tracking-wider font-medium text-center" style={{ color: 'var(--text-muted)' }}>KG</span>
    <span />
  </div>

  {item.setRows.map((row, rowIdx) => (
    <div key={rowIdx} className="grid grid-cols-[28px_1fr_1fr_28px] gap-x-2 mb-1.5 items-center">
      <span className="text-xs text-center font-medium tabular-nums" style={{ color: 'var(--text-dim)' }}>
        {rowIdx + 1}
      </span>
      <input
        type="number"
        min="1"
        value={row.reps}
        onChange={(e) => handleSetRowChange(i, rowIdx, 'reps', e.target.value)}
        className="w-full text-center !py-1.5 text-sm"
      />
      <input
        type="number"
        min="0"
        step="0.5"
        value={row.weightKg ?? ''}
        onChange={(e) => handleSetRowChange(i, rowIdx, 'weightKg', e.target.value)}
        placeholder="--"
        className="w-full text-center !py-1.5 text-sm"
      />
      <button
        onClick={() => handleRemoveSetRow(i, rowIdx)}
        disabled={item.setRows.length <= 1}
        className="flex items-center justify-center disabled:opacity-20 transition-all duration-200"
        style={{ color: 'var(--text-dim)' }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  ))}

  {/* Add Set */}
  <button
    onClick={() => handleAddSetRow(i)}
    className="mt-1 flex items-center gap-1 text-xs transition-all duration-200"
    style={{ color: 'var(--text-muted)' }}
  >
    <Plus size={11} /> Add Set
  </button>
</div>
```

- [ ] **Step 6: Build and verify locally** (or deploy):

```bash
cd /Users/eganathan-14461/eknath/GymJournal
catalyst deploy --only client 2>&1
```

Expected: `✔ client: deploy successful`

- [ ] **Step 7: Manual browser check**
  - Navigate to `https://gym.eknath.dev/app/index.html#/routines/new`
  - Hard refresh (`⌘⇧R`)
  - Click **Add Exercise**, pick any exercise
  - Confirm the exercise card shows 3 rows with SET / REPS / KG columns
  - Verify "Add Set" appends a 4th row copying the last row's values
  - Verify deleting a row is disabled when only 1 row remains

- [ ] **Step 8: Commit**

```bash
cd /Users/eganathan-14461/eknath/GymJournal/react-app
git add src/pages/RoutineNew.js
git commit -m "feat(routine): per-set rows with add/remove set"
```

---

## Chunk 2: Auto-fill from Set 1

### Task 2: Propagate Set 1 edits to default rows below

`handleSetRowChange` already contains the auto-fill logic (added in Task 1, Step 4). This task just verifies it works correctly.

- [ ] **Step 1: Manual browser check — reps auto-fill**
  - Open New Routine, add an exercise
  - Change Set 1 REPS from `10` to `12`
  - Confirm Sets 2 and 3 automatically change to `12`
  - Manually change Set 2 REPS to `8`
  - Change Set 1 REPS to `15` — confirm only Set 3 updates (Set 2 stays at `8`)

- [ ] **Step 2: Manual browser check — weight auto-fill**
  - Change Set 1 KG to `20`
  - Confirm Sets 2 and 3 automatically fill `20`
  - Change Set 2 KG to `30`
  - Change Set 1 KG to `25` — confirm only Set 3 updates (Set 2 stays at `30`)

- [ ] **Step 3: Commit** (only if any logic fix was needed from testing)

```bash
cd /Users/eganathan-14461/eknath/GymJournal/react-app
git add src/pages/RoutineNew.js
git commit -m "fix(routine): verify auto-fill from set 1"
```

---

## Chunk 3: Multi-select Exercise Picker

### Task 3: Replace single-add with multi-select + batch confirm

**Files:**
- Modify: `src/pages/RoutineNew.js`

- [ ] **Step 1: Add `selectedExIds` state** — add alongside the other exercise sheet state:

```js
const [selectedExIds, setSelectedExIds] = useState(new Set());
```

- [ ] **Step 2: Replace `handleAddExercise` with `handleBatchAdd`** (the single-add version added in Task 1 is now replaced):

```js
const handleBatchAdd = () => {
  if (selectedExIds.size === 0) return;
  const toAdd = exResults.filter((ex) => selectedExIds.has(ex.id));

  setItems((prev) => {
    const newBlocks = [];
    const lastItem = prev[prev.length - 1];

    toAdd.forEach((ex, idx) => {
      const needsLeadingRest = idx === 0
        ? lastItem?.type === 'EXERCISE'
        : true;
      if (needsLeadingRest) {
        newBlocks.push({ type: 'REST', durationSeconds: REST_DEFAULT_S });
      }
      newBlocks.push({
        type: 'EXERCISE',
        exerciseId: ex.id,
        exerciseName: ex.name,
        setRows: DEFAULT_SET_ROWS(),
        notes: '',
      });
    });

    return [...prev, ...newBlocks].map((item, i) => ({ ...item, order: i + 1 }));
  });

  setSelectedExIds(new Set());
  setShowExSheet(false);
  setExSearch('');
  setCatFilter('');
  setExResults([]);
};
```

- [ ] **Step 3: Remove `addingExId` state** — find `const [addingExId, setAddingExId] = useState(null)` and delete it (it's no longer needed).

- [ ] **Step 4: Update the exercise picker JSX** — replace the current `exResults.map` block with multi-select cards:

```jsx
{exResults.map((ex) => {
  const alreadyAdded = exerciseNames.has(ex.name);
  const isSelected = selectedExIds.has(ex.id);
  return (
    <button
      key={ex.id}
      onClick={() => {
        if (alreadyAdded) return;
        setSelectedExIds((prev) => {
          const next = new Set(prev);
          if (next.has(ex.id)) next.delete(ex.id);
          else next.add(ex.id);
          return next;
        });
      }}
      disabled={alreadyAdded}
      className="w-full card !py-3 flex items-center justify-between text-left transition-all duration-150"
      style={{
        opacity: alreadyAdded ? 0.45 : 1,
        borderColor: isSelected ? 'var(--btn-primary-bg)' : undefined,
      }}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate">{ex.name}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
          {ex.primaryMuscle || ex.muscleGroup || ''}
          {ex.equipment && <> · {ex.equipment}</>}
        </p>
      </div>
      {alreadyAdded ? (
        <Check size={14} className="shrink-0 ml-3 text-green-500" />
      ) : isSelected ? (
        <div
          className="w-5 h-5 rounded-md shrink-0 ml-3 flex items-center justify-center"
          style={{ backgroundColor: 'var(--btn-primary-bg)' }}
        >
          <Check size={11} style={{ color: 'var(--btn-primary-text)' }} />
        </div>
      ) : (
        <div
          className="w-5 h-5 rounded-md shrink-0 ml-3 border"
          style={{ borderColor: 'var(--border-default)' }}
        />
      )}
    </button>
  );
})}
```

- [ ] **Step 5: Add sticky confirm button** — place it inside the full-screen panel div, just before the `{/* Exercise list */}` div:

```jsx
{/* Sticky confirm bar — shown when items selected */}
{selectedExIds.size > 0 && (
  <div
    className="sticky bottom-0 px-5 py-4 z-10"
    style={{ backgroundColor: 'var(--bg-base)', borderTop: '1px solid var(--border-subtle)' }}
  >
    <button onClick={handleBatchAdd} className="btn-primary w-full !py-3">
      Add {selectedExIds.size} Exercise{selectedExIds.size > 1 ? 's' : ''}
    </button>
  </div>
)}
```

- [ ] **Step 6: Clear `selectedExIds` when the panel is closed via back button** — update the `onClick` for the back `<ArrowLeft>` button:

```jsx
onClick={() => {
  setShowExSheet(false);
  setExSearch('');
  setCatFilter('');
  setExResults([]);
  setSelectedExIds(new Set());
}}
```

- [ ] **Step 7: Update `exerciseNames` to include selected** — ensure already-in-list exercises are still correctly dimmed:

The existing `const exerciseNames = new Set(items.filter(...).map(...))` is already correct — it computes from `items`, which only contains confirmed added exercises. No change needed.

- [ ] **Step 8: Build and deploy**

```bash
cd /Users/eganathan-14461/eknath/GymJournal
catalyst deploy --only client 2>&1
```

Expected: `✔ client: deploy successful`

- [ ] **Step 9: Manual browser check**
  - Open New Routine → Add Exercise
  - Tap 3 exercises — confirm checkboxes appear and "Add 3 Exercises" button shows at the bottom
  - Tap a selected one again — confirm it deselects
  - Tap the back arrow — confirm panel closes and selection is cleared
  - Re-open, select 2 exercises, tap "Add 2 Exercises"
  - Confirm 2 exercise cards appear in the routine with REST block between them

- [ ] **Step 10: Commit**

```bash
cd /Users/eganathan-14461/eknath/GymJournal/react-app
git add src/pages/RoutineNew.js
git commit -m "feat(routine): multi-select exercise picker with batch add"
```

---

## Chunk 4: Auto-rest + Inline REST Editing + Cleanup

### Task 4: Auto-rest insertion is already in `handleBatchAdd` (Task 3). This task covers the inline REST card editing and cleanup of removed code.

**Files:**
- Modify: `src/pages/RoutineNew.js`

- [ ] **Step 1: Add `handleUpdateRestDuration` helper** — just after `handleRemoveSetRow`:

```js
const handleUpdateRestDuration = (index, seconds) => {
  setItems((prev) =>
    prev.map((item, i) => i === index ? { ...item, durationSeconds: seconds } : item)
  );
};
```

- [ ] **Step 2: Replace the REST card JSX** with inline duration chips.

Find the `{/* REST Block */}` section and replace its entire content:

```jsx
{/* REST Block */}
<div className="flex items-center justify-between">
  <div className="flex items-center gap-3 flex-1 min-w-0">
    <Timer size={16} style={{ color: 'var(--text-dim)' }} />
    <div className="flex flex-wrap gap-1.5">
      {[30, 60, 90, 120, 180].map((sec) => (
        <button
          key={sec}
          onClick={() => handleUpdateRestDuration(i, sec)}
          className="px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-150"
          style={item.durationSeconds === sec
            ? { backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderColor: 'var(--btn-primary-bg)' }
            : { backgroundColor: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-default)' }
          }
        >
          {sec < 60 ? `${sec}s` : sec % 60 === 0 ? `${sec / 60}m` : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`}
        </button>
      ))}
    </div>
  </div>
  <div className="flex items-center gap-1 ml-2 shrink-0">
    <div className="flex flex-col gap-0.5">
      <button onClick={() => handleMoveItem(i, -1)} disabled={i === 0} className="p-0.5 disabled:opacity-10" style={{ color: 'var(--text-muted)' }}>
        <ChevronUp size={12} />
      </button>
      <button onClick={() => handleMoveItem(i, 1)} disabled={i === items.length - 1} className="p-0.5 disabled:opacity-10" style={{ color: 'var(--text-muted)' }}>
        <ChevronDown size={12} />
      </button>
    </div>
    <button onClick={() => handleRemoveItem(i)} className="p-2 text-red-500/50 hover:text-red-400 transition-all duration-200">
      <Trash2 size={14} />
    </button>
  </div>
</div>
```

- [ ] **Step 3: Remove the "Add Rest" button** from the toolbar. Find the `{/* Add buttons */}` grid and replace it:

```jsx
{/* Add Exercise button */}
<button
  onClick={() => setShowExSheet(true)}
  className="btn-secondary flex items-center justify-center gap-2 text-sm w-full"
>
  <Plus size={14} /> Add Exercise
</button>
```

- [ ] **Step 4: Remove the Rest BottomSheet** — delete the entire `{/* Add Rest Bottom Sheet */}` block at the bottom of the JSX (the `<BottomSheet open={showRestSheet} ...>` section).

- [ ] **Step 5: Remove unused state and handlers** — delete these now-unused declarations:
  - `const [showRestSheet, setShowRestSheet] = useState(false);`
  - `const [restDuration, setRestDuration] = useState(90);`
  - `const handleAddRest = () => { ... };`

- [ ] **Step 6: Remove unused imports**
  - Remove `BottomSheet` from the imports at the top of the file (if no longer used):
    ```js
    // Remove this line:
    import BottomSheet from '../components/BottomSheet';
    ```
  - Check if `Timer` is still used. It is — it's used in the REST card JSX. Keep it.
  - `addingExId` and `setAddingExId` were removed in Task 3. Verify no reference remains.

- [ ] **Step 7: Update the empty-state message** to no longer mention "Use the buttons below":

```jsx
<div className="card text-center py-8 mb-4" style={{ color: 'var(--text-dim)' }}>
  <p className="text-sm">No exercises added yet</p>
  <p className="text-xs mt-1">Tap Add Exercise to build your routine</p>
</div>
```

- [ ] **Step 8: Build and deploy**

```bash
cd /Users/eganathan-14461/eknath/GymJournal
catalyst deploy --only client 2>&1
```

Expected: `✔ client: deploy successful`

- [ ] **Step 9: Full manual verification**

Hard refresh `https://gym.eknath.dev/app/index.html#/routines/new`

Test the full flow:
1. Add 3 exercises via multi-select → confirm pattern `ex1 → rest(2m) → ex2 → rest(2m) → ex3`
2. REST cards show `30s / 1m / 1:30 / 2m / 3m` chips, with `2m` highlighted by default
3. Tap `1:30` on first REST → confirms it changes duration
4. Exercise card Set 1: change reps to `12` → Sets 2 and 3 auto-update to `12`
5. Exercise card Set 1: change kg to `50` → Sets 2 and 3 auto-update to `50`
6. Change Set 2 kg to `60`, then change Set 1 to `55` → Set 2 stays at `60`, Set 3 updates to `55`
7. Add a 4th set via "Add Set" → copies last row values
8. Delete a middle set row → remaining rows renumber
9. Add another exercise → REST auto-inserted before it
10. Fill in routine name → "Save Routine" — confirm save works and navigates to routine detail

- [ ] **Step 10: Final commit**

```bash
cd /Users/eganathan-14461/eknath/GymJournal/react-app
git add src/pages/RoutineNew.js
git commit -m "feat(routine): auto-rest insertion, inline rest editing, cleanup"
```

---

## Summary of All Changes to `src/pages/RoutineNew.js`

| Change | Detail |
|--------|--------|
| Constants added | `DEFAULT_REPS`, `DEFAULT_WEIGHT`, `REST_DEFAULT_S`, `DEFAULT_SET_ROWS` |
| State added | `selectedExIds` (`Set`) |
| State removed | `addingExId`, `showRestSheet`, `restDuration` |
| Handlers added | `handleBatchAdd`, `handleSetRowChange`, `handleAddSetRow`, `handleRemoveSetRow`, `handleUpdateRestDuration` |
| Handlers removed | `handleAddExercise`, `handleAddRest` |
| `handleSave` updated | Derives flat `sets/repsPerSet/weightKg` from `setRows` before API call |
| Exercise card UI | Replaced 3-column flat grid with per-set row table |
| Exercise picker UI | Replaced single-tap-add with checkbox multi-select + sticky confirm button |
| REST card UI | Replaced BottomSheet with inline duration chips |
| Toolbar | Removed "Add Rest" button, "Add Exercise" now full-width |
| Imports removed | `BottomSheet` |
