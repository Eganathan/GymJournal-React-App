# GymJournal Web — Project Documentation

## Overview

React single-page app for GymJournal — a fitness/gym journaling platform. Serves as the primary web frontend, consuming the GymJournal Server API. Deployed on **Zoho Catalyst Serverless** (static hosting).

## URLs

| Environment | URL |
|---|---|
| Development | `https://gymjournal-778776887.development.catalystserverless.com` |
| Production | `https://app.gym.eknath.dev` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19.2.4 |
| Routing | react-router-dom 7.13.1 (HashRouter) |
| State Management | Zustand 5.0.11 |
| Styling | Tailwind CSS 3.4.17 + CSS custom properties |
| Icons | lucide-react 0.575.0 |
| IDs | uuid 13.0.0 |
| Build | react-scripts (Create React App) |
| Deployment | Zoho Catalyst Serverless (static) |

---

## Project Structure

```
react-app/
├── public/
├── src/
│   ├── index.js                    # Entry point
│   ├── index.css                   # Global styles + CSS variables + Tailwind
│   ├── App.js                      # HashRouter + routes
│   ├── components/
│   │   ├── AuthGuard.js            # Auth session check wrapper
│   │   ├── Layout.js               # Header + sidebar + bottom nav (5 tabs)
│   │   ├── BottomSheet.js          # Reusable slide-up modal
│   │   ├── ExerciseCard.js         # Exercise display/edit card (used in RoutineDetail)
│   │   ├── MetricCard.js           # Metric display component
│   │   ├── MiniChart.js            # Chart component
│   │   └── Sparkline.js            # Sparkline chart
│   ├── pages/
│   │   ├── Dashboard.js            # Home — greeting, quick actions, body snapshot, workouts, routines
│   │   ├── Water.js                # Water intake tracking
│   │   ├── Workouts.js             # Workout session history list
│   │   ├── WorkoutActive.js        # Active workout screen (log sets, finish, PBs)
│   │   ├── Routines.js             # Routine list (server-backed)
│   │   ├── RoutineNew.js           # Create new routine
│   │   ├── RoutineDetail.js        # View/edit routine + start workout
│   │   ├── AddExercise.js          # Add exercises to routine from library
│   │   ├── Metrics.js              # Body metrics overview
│   │   ├── MetricsLog.js           # Log new metrics
│   │   ├── MetricHistory.js        # View metric history chart
│   │   └── Login.js                # Auth page
│   ├── stores/
│   │   ├── authStore.js            # Auth state (Zustand)
│   │   ├── routineStore.js         # Routines — server-backed async CRUD
│   │   ├── workoutStore.js         # Workouts — server-backed sessions + sets
│   │   ├── metricsStore.js         # Metrics — snapshot, insights, history
│   │   └── waterStore.js           # Water intake state
│   └── lib/
│       ├── api.js                  # API client (all endpoint groups)
│       ├── bmi.js                  # BMI & health calculation utilities
│       ├── catalystLoader.js       # Catalyst SDK loader
│       └── constants.js            # Metric type definitions + groups
├── package.json
└── tailwind.config.js
```

---

## Routes

| Path | Page | Description |
|---|---|---|
| `/` | Dashboard | Home with overview, quick actions, recent data |
| `/water` | Water | Water intake tracking |
| `/workouts` | Workouts | Workout session history list |
| `/workouts/:id` | WorkoutActive | Active workout — log sets, finish, PBs |
| `/routines` | Routines | Routine list |
| `/routines/new` | RoutineNew | Create new routine |
| `/routines/:id` | RoutineDetail | View/edit routine + start workout |
| `/routines/:id/add-exercise` | AddExercise | Add exercises from library |
| `/metrics` | Metrics | Body metrics overview |
| `/metrics/log` | MetricsLog | Log new metrics |
| `/metrics/:metricType` | MetricHistory | Metric history chart |

---

## Navigation (5 Tabs)

```
Home | Workouts | Water | Routines | Body
```

- Desktop: sidebar (left, hidden < lg)
- Mobile: fixed bottom nav

---

## API Client (`api.js`)

Base URL: `https://appsail-10119736618.development.catalystappsail.com`

All requests use `credentials: 'include'` for Catalyst session cookie auth. Central `request()` function returns `json.data` on success or throws on error.

### Endpoint Groups

| Group | Export | Endpoints |
|---|---|---|
| Health | `healthApi` | check |
| Hydration | `waterApi` | log, getToday, getDaily, getHistory, update, delete |
| Exercises | `exercisesApi` | getCategories, getEquipment, list, getById, create, update, delete, seed |
| Metrics | `metricsApi` | logEntries, getEntries, updateEntry, deleteEntry, getHistory, getSnapshot, getInsights, getCustomDefs, createCustomDef, deleteCustomDef |
| Routines | `routinesApi` | list, getById, create, update, delete, clone |
| Workouts | `workoutsApi` | start, list, getById, update, complete, delete, addSet, updateSet, deleteSet, getExerciseHistory, getExercisePBs |

---

## Stores (Zustand)

### Convention
All stores follow the same pattern:
```js
create((set, get) => ({
  // State
  isLoading: false,
  error: null,
  // Async actions
  fetchData: async () => {
    set({ isLoading: true, error: null });
    try { ... set({ data }); }
    catch (err) { set({ error: err.message }); }
    finally { set({ isLoading: false }); }
  },
}))
```

### routineStore
- **Server-backed** — no localStorage persistence
- State: `routines[]`, `currentRoutine`, `isLoading`, `error`
- Server shape: items have `exerciseName`, `sets`, `repsPerSet`, `weightKg`, `order` (1-based)
- Local edit helpers for exercises (update/remove/reorder) + explicit `saveRoutineItems()` to persist

### workoutStore
- State: `sessions[]`, `activeSession`, `isLoading`, `error`
- `startWorkout(body)` — POST to create session
- `addSet/updateSet/deleteSet` — per-set CRUD, updates `activeSession.exercises[].sets[]` locally
- `completeWorkout(id)` — triggers server PB detection

### metricsStore
- State: `snapshot`, `insights[]`, `customDefs[]`, `history`, `dayEntries`, `isLoading`, `error`
- Insights wired to Dashboard (non-OK items shown)

### waterStore
- Hydration tracking with daily summary

---

## Key Patterns

- **Auth**: Catalyst `zcauthtoken` cookie, session checked by `AuthGuard` on mount
- **Styling**: Tailwind + CSS custom properties (`--bg-base`, `--text-primary`, etc.) for dark/light mode
- **Animations**: `animate-fade-in` class with staggered delays, `stagger` container class
- **Components**: BottomSheet for modals, ExerciseCard for routine exercises
- **Field mapping**: Routine items use server field names (`sets`, `repsPerSet`, `weightKg`, `order`); ExerciseCard still expects old names (`defaultSets`, `defaultReps`, `defaultWeightKg`) — RoutineDetail maps between them

---

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Build for production
npm run build

# Deploy to Catalyst
catalyst deploy
```
