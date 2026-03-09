import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Dumbbell, Loader2, Save, Play, Timer, Trash2 } from 'lucide-react';
import { useRoutineStore } from '../stores/routineStore';
import { useWorkoutStore } from '../stores/workoutStore';
import ExerciseCard from '../components/ExerciseCard';
import ConfirmDialog from '../components/ConfirmDialog';

export default function RoutineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const routine = useRoutineStore((s) => s.currentRoutine);
  const isLoading = useRoutineStore((s) => s.isLoading);
  const error = useRoutineStore((s) => s.error);
  const fetchRoutine = useRoutineStore((s) => s.fetchRoutine);
  const updateExerciseLocal = useRoutineStore((s) => s.updateExerciseLocal);
  const removeExerciseLocal = useRoutineStore((s) => s.removeExerciseLocal);
  const reorderExercisesLocal = useRoutineStore((s) => s.reorderExercisesLocal);
  const saveRoutineItems = useRoutineStore((s) => s.saveRoutineItems);
  const addRestBlock = useRoutineStore((s) => s.addRestBlock);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null); // { index, label }

  useEffect(() => {
    fetchRoutine(id);
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveRoutineItems(id);
    if (ok) setDirty(false);
    setSaving(false);
  };

  const handleStartWorkout = async () => {
    setStarting(true);
    const session = await startWorkout({ routineId: id });
    if (session) {
      navigate(`/workouts/${session.id}`);
    }
    setStarting(false);
  };

  if (isLoading) {
    return (
      <div className="page flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-dim)' }} />
      </div>
    );
  }

  if (!routine || String(routine.id) !== String(id)) {
    if (error) {
      return (
        <div className="page text-center py-20">
          <p style={{ color: 'var(--text-muted)' }}>Failed to load routine</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>{error}</p>
          <Link to="/routines" className="text-sm transition-colors duration-200 mt-3 inline-block" style={{ color: 'var(--text-secondary)' }}>
            Go to Routines &rarr;
          </Link>
        </div>
      );
    }
    return (
      <div className="page text-center py-20">
        <p style={{ color: 'var(--text-muted)' }}>Routine not found</p>
        <Link to="/routines" className="text-sm transition-colors duration-200 mt-2 inline-block" style={{ color: 'var(--text-secondary)' }}>
          Go to Routines &rarr;
        </Link>
      </div>
    );
  }

  const items = routine.items || [];

  return (
    <div className="page">
      <button
        onClick={() => navigate('/routines')}
        className="flex items-center gap-1.5 mb-6 transition-all duration-200 text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={16} /> Routines
      </button>

      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold">{routine.name}</h1>
        {routine.description && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{routine.description}</p>}
        <p className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
          {items.filter((it) => it.type !== 'REST').length} exercise{items.filter((it) => it.type !== 'REST').length !== 1 ? 's' : ''}
          {items.some((it) => it.type === 'REST') && ` · ${items.filter((it) => it.type === 'REST').length} rest`}
        </p>
      </div>

      {/* Start Workout CTA */}
      {items.length > 0 && (
        <button
          onClick={handleStartWorkout}
          disabled={starting}
          className="btn-primary w-full flex items-center justify-center gap-2 mb-6 !py-3.5"
        >
          {starting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          Start Workout
        </button>
      )}

      {items.length === 0 ? (
        <div className="card text-center py-12 mb-6 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <Dumbbell size={36} className="mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
          <p className="mb-1" style={{ color: 'var(--text-muted)' }}>No exercises yet</p>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Add exercises from the library below</p>
        </div>
      ) : (
        <div className="mb-6 stagger">
          {items
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((item, i) => {
              if (item.type === 'REST') {
                return (
                  <div key={item.id || `rest-${i}`} className="card mb-3 animate-fade-in flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Timer size={18} style={{ color: 'var(--text-dim)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Rest</p>
                        <p className="text-sm">{Math.floor((item.durationSeconds || 90) / 60)}:{String((item.durationSeconds || 90) % 60).padStart(2, '0')}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setRemoveTarget({ index: i, label: 'Rest block' })}
                      className="text-xs text-red-500/70 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/5 transition-all duration-200"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              }
              if (item.type === 'CARDIO') {
                return (
                  <div key={item.id || `cardio-${i}`} className="card mb-3 animate-fade-in flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{item.exerciseName}</p>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {item.durationMinutes || '--'} min{item.targetSpeedKmh ? ` · ${item.targetSpeedKmh} km/h` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => setRemoveTarget({ index: i, label: item.exerciseName })}
                      className="text-xs text-red-500/70 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/5 transition-all duration-200"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              }
              return (
                <ExerciseCard
                  key={item.id || i}
                  exercise={{
                    exerciseName: item.exerciseName,
                    defaultSets: item.sets,
                    defaultReps: item.repsPerSet,
                    defaultWeightKg: item.weightKg,
                    notes: item.notes,
                    id: item.id,
                    position: item.order,
                  }}
                  isFirst={i === 0}
                  isLast={i === items.length - 1}
                  onUpdate={(updates) => {
                    const mapped = {};
                    if (updates.defaultSets !== undefined) mapped.sets = updates.defaultSets;
                    if (updates.defaultReps !== undefined) mapped.repsPerSet = updates.defaultReps;
                    if (updates.defaultWeightKg !== undefined) mapped.weightKg = updates.defaultWeightKg;
                    if (updates.notes !== undefined) mapped.notes = updates.notes;
                    updateExerciseLocal(id, i, mapped);
                    setDirty(true);
                  }}
                  onRemove={() => setRemoveTarget({ index: i, label: item.exerciseName })}
                  onMoveUp={() => {
                    if (i > 0) {
                      reorderExercisesLocal(id, i, i - 1);
                      setDirty(true);
                    }
                  }}
                  onMoveDown={() => {
                    if (i < items.length - 1) {
                      reorderExercisesLocal(id, i, i + 1);
                      setDirty(true);
                    }
                  }}
                />
              );
            })}
        </div>
      )}

      {/* Save button (visible when dirty) */}
      {dirty && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2 mb-4"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Changes
        </button>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link
          to={`/routines/${id}/add-exercise`}
          className="btn-secondary flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Add Exercise
        </Link>
        <button
          onClick={async () => { const ok = await addRestBlock(id); if (ok) setDirty(false); }}
          className="btn-secondary flex items-center justify-center gap-2"
        >
          <Timer size={16} /> Add Rest
        </button>
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        title={`Remove "${removeTarget?.label}"?`}
        message="It will be removed from this routine."
        confirmLabel="Remove"
        danger
        onConfirm={() => {
          removeExerciseLocal(id, removeTarget.index);
          setDirty(true);
          setRemoveTarget(null);
        }}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
