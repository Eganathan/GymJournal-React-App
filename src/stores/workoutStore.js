import { create } from 'zustand';
import { workoutsApi } from '../lib/api';

const sameId = (a, b) => String(a) === String(b);

const SESSIONS_TTL = 60 * 1000;   // 1 minute for sessions list
const SESSION_TTL  = 30 * 1000;   // 30 seconds for active session detail

export const useWorkoutStore = create((set, get) => ({
  sessions: [],
  activeSession: null,
  isLoading: false,
  error: null,
  hasMore: false,
  _lastFetchedList: 0,
  _lastFetchedSession: {}, // { [id]: timestamp }
  _currentFilters: {},     // params used for the current sessions list

  fetchSessions: async (params = {}, force = false) => {
    const { _lastFetchedList, sessions, _currentFilters } = get();
    const filtersChanged = JSON.stringify(params) !== JSON.stringify(_currentFilters);
    if (!force && !filtersChanged && sessions.length > 0 && Date.now() - _lastFetchedList < SESSIONS_TTL) return;

    set({ isLoading: true, error: null });
    try {
      const data = await workoutsApi.list({ ...params, page: 1 });
      const list = Array.isArray(data) ? data : data?.sessions || data?.workouts || [];
      const meta = Array.isArray(data) ? {} : (data?.meta || data?.pagination || {});
      const pageSize = params.pageSize || 20;
      const hasMore = meta.hasMore !== undefined
        ? meta.hasMore
        : (meta.total != null ? list.length < meta.total : list.length >= pageSize);
      set({ sessions: list, _lastFetchedList: Date.now(), _currentFilters: params, hasMore });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadMoreSessions: async () => {
    const { sessions, _currentFilters, hasMore, isLoading } = get();
    if (!hasMore || isLoading) return;

    const pageSize = _currentFilters.pageSize || 20;
    const nextPage = Math.floor(sessions.length / pageSize) + 1;

    set({ isLoading: true, error: null });
    try {
      const data = await workoutsApi.list({ ..._currentFilters, page: nextPage });
      const list = Array.isArray(data) ? data : data?.sessions || data?.workouts || [];
      const meta = Array.isArray(data) ? {} : (data?.meta || data?.pagination || {});
      const newTotal = sessions.length + list.length;
      const hasMore = meta.hasMore !== undefined
        ? meta.hasMore
        : (meta.total != null ? newTotal < meta.total : list.length >= pageSize);
      set((s) => ({ sessions: [...s.sessions, ...list], hasMore }));
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSession: async (id, force = false) => {
    const { _lastFetchedSession, activeSession } = get();
    const lastFetched = _lastFetchedSession[id] || 0;
    // Don't cache IN_PROGRESS sessions — they change every set
    const isActive = activeSession?.status === 'IN_PROGRESS' && sameId(activeSession?.id, id);
    if (
      !force &&
      !isActive &&
      activeSession &&
      sameId(activeSession.id, id) &&
      Date.now() - lastFetched < SESSION_TTL
    ) return activeSession;

    set({ isLoading: true, error: null });
    try {
      const session = await workoutsApi.getById(id);
      set({
        activeSession: session,
        _lastFetchedSession: { ...get()._lastFetchedSession, [id]: Date.now() },
      });
      return session;
    } catch (err) {
      set({ error: err.message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  startWorkout: async (body = {}) => {
    set({ isLoading: true, error: null });
    try {
      const session = await workoutsApi.start(body);
      set((s) => ({
        activeSession: session,
        sessions: [session, ...s.sessions],
        _lastFetchedList: 0, // invalidate list
      }));
      return session;
    } catch (err) {
      set({ error: err.message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

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

  completeWorkout: async (id) => {
    set({ error: null });
    try {
      const result = await workoutsApi.complete(id);
      set((s) => ({
        activeSession: sameId(s.activeSession?.id, id)
          ? { ...s.activeSession, status: 'COMPLETED', ...result }
          : s.activeSession,
        _lastFetchedList: 0, // invalidate list so dashboard shows updated status
      }));
      return result;
    } catch (err) {
      set({ error: err.message });
      return null;
    }
  },

  deleteWorkout: async (id) => {
    set({ error: null });
    try {
      await workoutsApi.delete(id);
      set((s) => ({
        sessions: s.sessions.filter((w) => !sameId(w.id, id)),
        activeSession: sameId(s.activeSession?.id, id) ? null : s.activeSession,
        _lastFetchedList: 0, // invalidate
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },

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
