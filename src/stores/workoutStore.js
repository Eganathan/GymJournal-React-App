import { create } from 'zustand';
import { workoutsApi } from '../lib/api';

// IDs from the server may be numbers or strings (server serializes Long as JSON string);
// URL params from useParams() are always strings. Use sameId() for all comparisons.
const sameId = (a, b) => String(a) === String(b);

export const useWorkoutStore = create((set, get) => ({
  sessions: [],
  activeSession: null,
  isLoading: false,
  error: null,

  /** Fetch workout sessions list */
  fetchSessions: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await workoutsApi.list(params);
      const list = Array.isArray(data) ? data : data?.sessions || data?.workouts || [];
      set({ sessions: list });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  /** Fetch a single session with full details */
  fetchSession: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const session = await workoutsApi.getById(id);
      set({ activeSession: session });
      return session;
    } catch (err) {
      set({ error: err.message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  /** Start a new workout session */
  startWorkout: async (body = {}) => {
    set({ isLoading: true, error: null });
    try {
      const session = await workoutsApi.start(body);
      set({ activeSession: session });
      return session;
    } catch (err) {
      set({ error: err.message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  /** Update session name/notes */
  updateSession: async (id, updates) => {
    set({ error: null });
    try {
      const updated = await workoutsApi.update(id, updates);
      set((s) => ({
        activeSession: sameId(s.activeSession?.id, id) ? { ...s.activeSession, ...updated } : s.activeSession,
      }));
      return updated;
    } catch (err) {
      set({ error: err.message });
      return null;
    }
  },

  /** Complete a workout */
  completeWorkout: async (id) => {
    set({ error: null });
    try {
      const result = await workoutsApi.complete(id);
      set((s) => ({
        activeSession: sameId(s.activeSession?.id, id)
          ? { ...s.activeSession, status: 'COMPLETED', ...result }
          : s.activeSession,
      }));
      return result;
    } catch (err) {
      set({ error: err.message });
      return null;
    }
  },

  /** Delete a workout */
  deleteWorkout: async (id) => {
    set({ error: null });
    try {
      await workoutsApi.delete(id);
      set((s) => ({
        sessions: s.sessions.filter((w) => !sameId(w.id, id)),
        activeSession: sameId(s.activeSession?.id, id) ? null : s.activeSession,
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  /** Add a set to the active session */
  addSet: async (sessionId, setData) => {
    set({ error: null });
    try {
      const newSet = await workoutsApi.addSet(sessionId, setData);
      set((s) => {
        if (!sameId(s.activeSession?.id, sessionId)) return s;
        const exercises = [...(s.activeSession.exercises || [])];
        const exIdx = exercises.findIndex((e) => sameId(e.exerciseId, setData.exerciseId));
        if (exIdx >= 0) {
          exercises[exIdx] = {
            ...exercises[exIdx],
            sets: [...(exercises[exIdx].sets || []), newSet],
          };
        } else {
          exercises.push({
            exerciseId: setData.exerciseId,
            exerciseName: setData.exerciseName || '',
            sets: [newSet],
          });
        }
        return { activeSession: { ...s.activeSession, exercises } };
      });
      return newSet;
    } catch (err) {
      set({ error: err.message });
      return null;
    }
  },

  /** Update a set */
  updateSet: async (sessionId, setId, updates) => {
    set({ error: null });
    try {
      const updated = await workoutsApi.updateSet(sessionId, setId, updates);
      set((s) => {
        if (!sameId(s.activeSession?.id, sessionId)) return s;
        const exercises = (s.activeSession.exercises || []).map((ex) => ({
          ...ex,
          sets: (ex.sets || []).map((st) => (sameId(st.id, setId) ? { ...st, ...updated } : st)),
        }));
        return { activeSession: { ...s.activeSession, exercises } };
      });
      return updated;
    } catch (err) {
      set({ error: err.message });
      return null;
    }
  },

  /** Delete a set */
  deleteSet: async (sessionId, setId) => {
    set({ error: null });
    try {
      await workoutsApi.deleteSet(sessionId, setId);
      set((s) => {
        if (!sameId(s.activeSession?.id, sessionId)) return s;
        const exercises = (s.activeSession.exercises || []).map((ex) => ({
          ...ex,
          sets: (ex.sets || []).filter((st) => !sameId(st.id, setId)),
        }));
        return { activeSession: { ...s.activeSession, exercises } };
      });
    } catch (err) {
      set({ error: err.message });
    }
  },

  clearError: () => set({ error: null }),
}));
