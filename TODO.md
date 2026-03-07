# Theme Enhancement TODOs

## Functional

- [ ] **Flash-of-wrong-theme on Login page** — Login renders before `Layout.js` mounts, so `.dark` class isn't applied early enough. Add a blocking script in `public/index.html` (or `src/index.js`) that reads `localStorage.getItem('theme')` and applies `.dark` to `<html>` before React hydrates.

- [ ] **`bmi.js` status colors** — `text-neutral-600` is used as the "N/A" fallback accent color. Looks washed out in light mode. Refactor status objects in `src/lib/bmi.js` to use CSS variables instead of hardcoded Tailwind classes.

- [ ] **Water ring track visibility** — Background circle uses `var(--border-default)` at 50% opacity, too subtle in light mode. Consider using `var(--text-faint)` or increasing opacity for better contrast.

## Polish

- [ ] **Restore hover backgrounds** — Some buttons lost hover bg when migrated (reorder buttons in `ExerciseCard`, Edit/Cancel buttons in `Water`, `MetricHistory`). Add `hover:bg-[var(--bg-raised)]` where appropriate.

- [ ] **Smooth theme transition** — Add `transition: background-color 0.2s, color 0.2s` to `body` in `index.css` so toggle feels smooth instead of instant flash.

- [ ] **System preference detection** — When no `localStorage` theme exists, check `window.matchMedia('(prefers-color-scheme: dark)')` to default to the user's OS preference instead of always defaulting to dark.

---

# API Audit — Detailed Endpoint & Field Analysis

> Audited against server API docs in `GymJournal-Server/apiDocs/`. Each endpoint checked for:
> usage in frontend, correct field mapping, missing parameters, and missing features.

---

## 1. Health (1 endpoint)

| # | Endpoint | Status | Why Skipped |
|---|---|---|---|
| 1 | `GET /api/v1/health` | **UNUSED** | Meant for container warm-up on app launch. `healthApi.check` exists in api.js but is never imported or called. Should be called in `AuthGuard.js` or `index.js` to pre-warm the AppSail cold start. |

---

## 2. Hydration (6 endpoints)

| # | Endpoint | Status | Frontend Location | Why Skipped |
|---|---|---|---|---|
| 2 | `POST /api/v1/water` | ✅ Used | `waterStore.addEntry` → Water.js | — |
| 3 | `GET /api/v1/water/today` | ✅ Used | `waterStore.fetchToday` → Water.js | — |
| 4 | `GET /api/v1/water/daily?date=` | **UNUSED** | `waterApi.getDaily` defined, never called | No date picker or past-day view exists. Water.js is today-only. |
| 5 | `GET /api/v1/water/history?startDate=&endDate=` | **UNUSED** | `waterApi.getHistory` defined, never called | No trend chart / weekly view for water. Returns `{ date, totalMl, goalMl, progressPercent }[]` — perfect for a bar chart but no UI consumes it. |
| 6 | `PUT /api/v1/water/{id}` | ✅ Used | `waterStore.updateEntry` → Water.js edit sheet | — |
| 7 | `DELETE /api/v1/water/{id}` | ✅ Used | `waterStore.deleteEntry` → Water.js | — |

**Missing feature:** Dashboard.js has zero water data. Should show today's ring/bar using `waterStore.fetchToday`.

---

## 3. Exercises (10 endpoints)

| # | Endpoint | Status | Frontend Location | Why Skipped |
|---|---|---|---|---|
| 8 | `GET /exercises/categories` | ✅ Used | AddExercise.js (filter chips + custom form) | — |
| 9 | `POST /exercises/categories` | **UNUSED** | Not in api.js at all | No "add muscle group" UI. Admin feature — low priority. |
| 10 | `GET /exercises/equipment` | ✅ Used | AddExercise.js (custom exercise form) | — |
| 11 | `POST /exercises/equipment` | **UNUSED** | Not in api.js at all | No "add equipment" UI. Admin feature — low priority. |
| 12 | `GET /exercises` | ✅ Used | AddExercise.js + WorkoutActive.js search sheet | — |
| 13 | `GET /exercises/{id}` | **UNUSED** | `exercisesApi.getById` defined, never called | No exercise detail page exists. Can't view instructions, tips, secondary muscles, or video. |
| 14 | `POST /exercises` | ✅ Used | AddExercise.js "Create Custom Exercise" | — |
| 15 | `PUT /exercises/{id}` | **UNUSED** | `exercisesApi.update` defined, never called | No exercise edit UI. User can create but never edit their own exercises. |
| 16 | `DELETE /exercises/{id}` | **UNUSED** | `exercisesApi.delete` defined, never called | No exercise delete UI. |
| 17 | `POST /admin/seed` | **UNUSED** | `exercisesApi.seed` defined, never called | Admin/dev tool. Should not be in the user-facing app. Consider removing from api.js or gating behind admin check. |

**Missing features:**
- No standalone exercise library browse page (exercises only appear as a picker inside routines/workouts)
- No exercise detail view (instructions, tips, video, secondary muscles all invisible)
- No edit/delete for user's own exercises

**Field gaps in exercise list:** API returns `primaryMuscleId` (number) but frontend shows `ex.primaryMuscle || ex.muscleGroup` (name string). This works because the server enriches list responses with `primaryMuscle` as a display name. No issue, but worth noting the list response differs from the detail response.

---

## 4. Exercise History & PBs (2 endpoints — under exercises path, powered by workout data)

| # | Endpoint | Status | Frontend Location | Why Skipped |
|---|---|---|---|---|
| 18 | `GET /exercises/{id}/history` | **UNUSED** | `workoutsApi.getExerciseHistory` defined, never called | **Critical gap.** Returns completed sets for an exercise (most recent first) with `actualReps`, `actualWeightKg`, `rpe`, `isPersonalBest`, `completedAt`. Should show "Last time: 8 × 82.5kg" in WorkoutActive.js during active workout. Also needed for exercise progress charts. |
| 19 | `GET /exercises/{id}/pbs` | **UNUSED** | `workoutsApi.getExercisePBs` defined, never called | Returns one record per distinct rep count showing highest weight. e.g. "8 reps: 82.5kg, 5 reps: 92.5kg". Should show PB badges in WorkoutActive.js and a PB table in an exercise detail view. |

**Impact:** Without these, users cannot see their progress or previous performance — the #1 feature for progressive overload training.

---

## 5. Metrics (10 endpoints)

| # | Endpoint | Status | Frontend Location | Notes |
|---|---|---|---|---|
| 20 | `POST /metrics/entries` | ✅ Used | `metricsStore.logEntries` → MetricsLog.js | Sends `{ entries: [{ metricType, value, unit, logDate }] }`. Correctly avoids submitting `bmi`/`smiComputed`. |
| 21 | `GET /metrics/entries?date=` | ✅ Used | `metricsStore.fetchDayEntries` → MetricsLog.js | Used to pre-fill form for editing existing entries on a date. |
| 22 | `PUT /metrics/entries/{id}` | ✅ Used | `metricsStore.updateEntry` → MetricsLog.js | Smart-diff: only PUTs changed entries, POSTs new ones. |
| 23 | `DELETE /metrics/entries/{id}` | ✅ Used | `metricsStore.deleteEntry` → MetricHistory.js | Per-entry delete with confirmation. |
| 24 | `GET /metrics/{type}/history` | ✅ Used | `metricsStore.fetchHistory` → Metrics.js (sparklines) + MetricHistory.js (full chart) | Supports `startDate`/`endDate`. Default last 90 days. |
| 25 | `GET /metrics/snapshot` | ✅ Used | `metricsStore.fetchSnapshot` → Dashboard.js, Metrics.js | Returns latest value per type + computed `bmi`/`smiComputed`. |
| 26 | `GET /metrics/insights?gender=` | ✅ Used | `metricsStore.fetchInsights` → Dashboard.js, Metrics.js | **Field gap:** `gender` param is supported but never sent. Frontend calls `getInsights()` without gender, so body fat and SMI insights use gender-neutral (conservative) ranges. Should let user set gender in profile/settings. |
| 27 | `GET /metrics/custom` | ✅ Used | `metricsStore.fetchCustomDefs` → Metrics.js, MetricsLog.js, MetricHistory.js | — |
| 28 | `POST /metrics/custom` | ✅ Used | `metricsStore.createCustomDef` → MetricsLog.js "Add Custom Metric" sheet | — |
| 29 | `DELETE /metrics/custom/{key}` | **PARTIAL** | `metricsStore.deleteCustomDef` exists | Store action is wired and calls API. **No UI button** to trigger it. User can create custom metrics but never delete them. Needs a delete button in Metrics.js advanced section. |

**Metrics is the most complete module** — 9/10 endpoints fully used.

---

## 6. Routines (6 endpoints)

| # | Endpoint | Status | Frontend Location | Notes |
|---|---|---|---|---|
| 30 | `GET /routines?mine=true` | ✅ Used | `routineStore.fetchRoutines` → Routines.js, Dashboard.js | Always passes `?mine=true`. Cannot browse public/community routines. |
| 31 | `GET /routines/{id}` | ✅ Used | `routineStore.fetchRoutine` → RoutineDetail.js | — |
| 32 | `POST /routines` | ✅ Used | `routineStore.createRoutine` → RoutineNew.js | — |
| 33 | `PUT /routines/{id}` | ✅ Used | `routineStore.saveRoutineItems` + `addExercise` → RoutineDetail.js | — |
| 34 | `DELETE /routines/{id}` | ✅ Used | `routineStore.deleteRoutine` → Routines.js | — |
| 35 | `POST /routines/{id}/clone` | **PARTIAL** | `routineStore.cloneRoutine` exists | Store action wired. **No UI.** No "Browse Public Routines" page. No "Clone" button on any routine card. |

### Routine item types — field-level audit

The API supports 3 item types per routine. Here's what the frontend handles:

| Item Type | API Fields | Frontend Support | Gap |
|---|---|---|---|
| `EXERCISE` | `order`, `type`, `exerciseId`, `exerciseName`, `sets`, `repsPerSet`, `weightKg`, `restAfterSeconds`, `notes` | ✅ Renders + edits `sets`, `repsPerSet`, `weightKg`, `notes`, `order` | **`restAfterSeconds` ignored** — API field exists on EXERCISE items for "rest 90s after this exercise" but frontend never reads or sets it. Also `type` field not sent when creating items (may cause server issues). `exerciseId` mapped from `exercise.id`. |
| `REST` | `order`, `type`, `durationSeconds` | **NOT RENDERED** | Frontend completely ignores REST items. They are invisible in RoutineDetail.js. Can't add, view, edit, or delete REST blocks. If a routine has REST items from the API, they silently disappear. |
| `CARDIO` | `order`, `type`, `cardioName`, `durationMinutes`, `targetSpeedKmh` | **NOT RENDERED** | Same as REST — completely invisible. No UI to add/view/edit CARDIO blocks. |

**Also missing from routine create/edit:**
- `estimatedMinutes` — API supports it, frontend never sends it
- `tags[]` — API supports it, frontend never sends it
- `isPublic` — Frontend hardcodes `false`, no toggle to make a routine public

---

## 7. Workouts (9 endpoints)

| # | Endpoint | Status | Frontend Location | Notes |
|---|---|---|---|---|
| 36 | `POST /workouts` | ✅ Used | Dashboard.js, Workouts.js, RoutineDetail.js | Sends `{ routineId }` or `{}`. **`startedAt` never sent** — always uses server time. Backdating (logging yesterday's workout) not supported in UI. **`name` never sent** — always uses server auto-name. |
| 37 | `GET /workouts` | ✅ Used | Dashboard.js (pageSize=5), Workouts.js | **`status` filter never used** — always fetches all. Could filter `?status=IN_PROGRESS` to find active sessions more efficiently. |
| 38 | `GET /workouts/{id}` | ✅ Used | WorkoutActive.js on mount | — |
| 39 | `PATCH /workouts/{id}` | ✅ Used | WorkoutActive.js inline name edit | **`notes` field never sent** — API supports session-level notes but frontend only sends `{ name }`. No notes UI. |
| 40 | `POST /workouts/{id}/complete` | ✅ Used | WorkoutActive.js "Finish" button | — |
| 41 | `DELETE /workouts/{id}` | ✅ Used | Workouts.js delete button | — |
| 42 | `POST /workouts/{sessionId}/sets` | ✅ Used | WorkoutActive.js (add set + add exercise) | — |
| 43 | `PUT /workouts/{sessionId}/sets/{setId}` | ✅ Used | WorkoutActive.js SetRow complete ✓ | **Field mapping issue:** Frontend sends `actualWeight` but API expects `actualWeightKg`. Also sends `completed: true` but API expects `completedAt` (ISO-8601 datetime string). Need to verify server handles these gracefully. |
| 44 | `DELETE /workouts/{sessionId}/sets/{setId}` | **PARTIAL** | `workoutStore.deleteSet` exists | **No UI** — can't remove a set or exercise from active workout. User stuck if they add a set by mistake. |

### Workout set types — field-level audit

The API returns sets grouped by `orderInSession` with 3 item types. Here's what the frontend handles:

| Item Type | API Response Fields | Frontend Rendering | Gap |
|---|---|---|---|
| `EXERCISE` | `id`, `exerciseId`, `exerciseName`, `setNumber`, `plannedReps`, `plannedWeightKg`, `actualReps`, `actualWeightKg`, `rpe`, `isPersonalBest`, `completedAt`, `notes` | ✅ Renders set table with target, actual reps/weight/RPE, and ✓ button | **`isPersonalBest` not displayed** per-set — only shown in completion summary. Should show 🏆 badge inline on PB sets. **`plannedReps`/`plannedWeightKg`** correctly shown as target column. **`notes`** per-set ignored — no input field. **`completedAt`** — frontend sends `completed: true` instead of ISO datetime string. |
| `REST` | `id`, `durationSeconds`, `itemType: "REST"` | **NOT RENDERED** | REST blocks from routine pre-population are completely invisible. Should show "Rest — 2:00" with countdown timer. Server sends these when starting from a routine with REST items. |
| `CARDIO` | `id`, `exerciseName` (activity), `durationSeconds`, `distanceKm`, `itemType: "CARDIO"` | **NOT RENDERED** | CARDIO blocks invisible. Should show duration + distance inputs. |

### SetRow field mapping issues

```
Frontend sends → API expects
─────────────────────────────────────────
actualWeight   → actualWeightKg     ⚠️ WRONG FIELD NAME
completed: true → completedAt: "ISO" ⚠️ WRONG TYPE (boolean vs datetime)
reps (target)  → plannedReps         OK (only in display)
weightKg       → plannedWeightKg     OK (only in display)
```

---

## 8. Admin (1 endpoint)

| # | Endpoint | Status | Notes |
|---|---|---|---|
| 45 | `POST /admin/seed` | **UNUSED** | `exercisesApi.seed` defined in api.js. Admin-only — seeds MuscleGroups + Equipment lookup tables. Should not be in user-facing UI. Consider removing from api.js or adding an admin panel. |

---

## Summary Table

| Category | Total | ✅ Used | **UNUSED** | ⚠️ Partial | Coverage |
|---|---|---|---|---|---|
| Health | 1 | 0 | 1 | 0 | 0% |
| Hydration | 6 | 4 | 2 | 0 | 67% |
| Exercises | 6 | 3 | 3 | 0 | 50% |
| Exercise Lookups | 4 | 2 | 2 | 0 | 50% |
| Exercise History/PBs | 2 | 0 | 2 | 0 | 0% |
| Metrics | 10 | 9 | 0 | 1 | 95% |
| Routines | 6 | 5 | 0 | 1 | 92% |
| Workouts | 9 | 7 | 0 | 2 | 78% |
| Admin | 1 | 0 | 1 | 0 | 0% |
| **Total** | **45** | **30** | **11** | **4** | **67%** |

---

## Critical Field-Level Bugs

1. **WorkoutActive.js SetRow sends `actualWeight` instead of `actualWeightKg`** — API field name mismatch. Server may silently ignore the field, meaning completed sets record 0 weight.
2. **WorkoutActive.js SetRow sends `completed: true` instead of `completedAt: "ISO-8601"`** — API expects a datetime string. Server may not mark the set as completed.
3. **Routine items created without `type` field** — `routineStore.addExercise` builds items without `type: "EXERCISE"`. Server may reject or default incorrectly.

---

# Unreachable Code

- `Login.js` — exists in `src/pages/` but has no route in `App.js`. Auth handled by `AuthGuard.js` → Catalyst login.
- `routineStore.updateRoutine()` — defined but never called directly from any page component.
- `healthApi.check()` — defined, never imported.
- `exercisesApi.seed()` — admin endpoint exposed in user-facing api.js.

---

# Feature Gaps — What to Build Next

## Priority 0 — Bug Fixes (field mapping errors)

- [ ] **Fix `actualWeight` → `actualWeightKg`** in WorkoutActive.js SetRow — wrong field name sent to PUT /sets/{id}
- [ ] **Fix `completed: true` → `completedAt: new Date().toISOString()`** in SetRow — API expects datetime not boolean
- [ ] **Add `type: "EXERCISE"` to routine items** in routineStore.addExercise — missing required field

## Priority 1 — Low Effort, High Impact (backend ready, frontend-only work)

- [ ] **REST blocks in routines + workouts** — Server fully supports `type: "REST"` items with `durationSeconds`. RoutineDetail.js doesn't render them, can't add them, and WorkoutActive.js ignores REST sets. Need: REST item rendering, add REST block button, countdown timer in active workout.
- [ ] **CARDIO blocks in routines + workouts** — Same as REST. Server supports `type: "CARDIO"` with `cardioName`, `durationMinutes`, `targetSpeedKmh`. Frontend completely ignores them.
- [ ] **`restAfterSeconds` on EXERCISE items** — API supports per-exercise rest periods. RoutineDetail/ExerciseCard don't show or edit this field. Should show "Rest: 90s" and auto-start countdown after completing an exercise's last set.
- [ ] **Previous performance display** — Fetch `GET /exercises/{id}/history` in WorkoutActive.js and show "Last: 8 × 82.5kg" below each exercise name. The endpoint is ready and paginated.
- [ ] **Exercise PB display** — Fetch `GET /exercises/{id}/pbs` and show PB badges per exercise. Also show 🏆 inline on sets where `isPersonalBest === true` in active workout (server already flags these after completion).
- [ ] **Water on Dashboard** — Dashboard shows zero water data. Add today's progress using existing `waterStore`.
- [ ] **Water history chart** — Wire `waterApi.getHistory(startDate, endDate)` into a new trend view (bar chart of daily totals). Date picker using `waterApi.getDaily(date)`.
- [ ] **Delete set in active workout** — Trash icon on SetRow. `workoutStore.deleteSet` already wired to API.
- [ ] **Delete custom metric definitions** — Delete button in Metrics.js. `metricsStore.deleteCustomDef` already wired.
- [ ] **Workout session notes** — Add notes textarea to finish flow. `PATCH /workouts/{id}` already supports `{ notes }`.
- [ ] **`isPersonalBest` badge on completed sets** — Server returns this flag. Show 🏆 on PB sets during and after workout.
- [ ] **Gender for insights** — Let user set gender (profile/settings). Pass to `GET /metrics/insights?gender=MALE|FEMALE` for accurate body fat and SMI thresholds.

## Priority 2 — Medium Effort

- [ ] **Clone routine / browse public routines** — `routineStore.cloneRoutine` exists. Need: remove `?mine=true` filter option, show public routines with "Clone" button. API supports `GET /routines` (public by default).
- [ ] **Exercise progress charts** — Per-exercise weight-over-time line chart using `/exercises/{id}/history`.
- [ ] **Standalone exercise library page** — Browse, search, view detail (`/exercises/{id}` shows instructions, tips, video), edit/delete own.
- [ ] **Workout backdating** — `POST /workouts` supports `startedAt` for logging past workouts. Add date picker to "start workout" flow.
- [ ] **Routine tags + estimated time** — API supports `tags[]` and `estimatedMinutes`. Add to RoutineNew and RoutineDetail.
- [ ] **Routine public toggle** — API supports `isPublic`. Add toggle in RoutineDetail for sharing routines.
- [ ] **Workout streak / consistency** — Calculate from session list.
- [ ] **1RM calculator** — Epley/Brzycki formula from PB data. Pure frontend math.
- [ ] **Health check warm-up** — Call `healthApi.check()` on app load to pre-warm the AppSail container.

## Priority 3 — New Backend + Frontend

- [ ] **Goal setting** — Target weight, target lifts, water goal customization.
- [ ] **Sleep tracking** — Manual logging (hours + quality rating).
- [ ] **Nutrition / calorie logging** — At minimum daily calories + protein.
- [ ] **Progress photos** — Image upload with timeline gallery.
- [ ] **Supplement / medication reminders** — Daily checklist with streak tracking.
- [ ] **Workout programs** — Multi-week templates (5/3/1, PPL) with auto-progression.
- [ ] **PDF / share reports** — Monthly summary export for doctor/coach.
- [ ] **AI coach** — Analyze data, suggest deload weeks, flag plateaus.
