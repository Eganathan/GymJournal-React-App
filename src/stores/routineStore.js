import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export const useRoutineStore = create(
  persist(
    (set, get) => ({
      routines: [],

      createRoutine: (name, description = '') => {
        const routine = {
          id: uuid(),
          name,
          description,
          exercises: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ routines: [routine, ...s.routines] }));
        return routine.id;
      },

      updateRoutine: (id, updates) => {
        set((s) => ({
          routines: s.routines.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      deleteRoutine: (id) => {
        set((s) => ({ routines: s.routines.filter((r) => r.id !== id) }));
      },

      getRoutine: (id) => get().routines.find((r) => r.id === id),

      addExercise: (routineId, exercise) => {
        set((s) => ({
          routines: s.routines.map((r) => {
            if (r.id !== routineId) return r;
            const newEx = {
              id: uuid(),
              exerciseName: exercise.name,
              remoteExerciseId: exercise.id || null,
              defaultSets: exercise.defaultSets || 3,
              defaultReps: exercise.defaultReps || 10,
              defaultWeightKg: exercise.defaultWeightKg || null,
              notes: '',
              position: r.exercises.length,
            };
            return { ...r, exercises: [...r.exercises, newEx], updatedAt: new Date().toISOString() };
          }),
        }));
      },

      updateExercise: (routineId, exerciseId, updates) => {
        set((s) => ({
          routines: s.routines.map((r) => {
            if (r.id !== routineId) return r;
            return {
              ...r,
              exercises: r.exercises.map((e) => (e.id === exerciseId ? { ...e, ...updates } : e)),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      removeExercise: (routineId, exerciseId) => {
        set((s) => ({
          routines: s.routines.map((r) => {
            if (r.id !== routineId) return r;
            const filtered = r.exercises
              .filter((e) => e.id !== exerciseId)
              .map((e, i) => ({ ...e, position: i }));
            return { ...r, exercises: filtered, updatedAt: new Date().toISOString() };
          }),
        }));
      },

      reorderExercises: (routineId, fromIndex, toIndex) => {
        set((s) => ({
          routines: s.routines.map((r) => {
            if (r.id !== routineId) return r;
            const exercises = [...r.exercises];
            const [moved] = exercises.splice(fromIndex, 1);
            exercises.splice(toIndex, 0, moved);
            return {
              ...r,
              exercises: exercises.map((e, i) => ({ ...e, position: i })),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },
    }),
    { name: 'gymjournal-routines' }
  )
);
