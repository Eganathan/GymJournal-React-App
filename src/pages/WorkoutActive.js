import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Check, Plus, Trophy, Clock, Search, Timer, Pause, Play, Trash2 } from 'lucide-react';
import { useWorkoutStore } from '../stores/workoutStore';
import { exercisesApi, workoutsApi } from '../lib/api';
import BottomSheet from '../components/BottomSheet';

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function SetRow({ set, index, sessionId, exerciseId, onUpdate, onDelete, isCompleted: sessionCompleted, isPB }) {
  const [reps, setReps] = useState(set.actualReps ?? set.plannedReps ?? '');
  const [weight, setWeight] = useState(set.actualWeightKg ?? set.plannedWeightKg ?? '');
  const [rpe, setRpe] = useState(set.rpe ?? '');
  const [completed, setCompleted] = useState(!!set.completedAt);
  const [saving, setSaving] = useState(false);
  const updateSet = useWorkoutStore((s) => s.updateSet);

  const handleComplete = async () => {
    if (saving) return;
    setSaving(true);
    const updates = {
      actualReps: parseInt(reps) || set.plannedReps || 0,
      actualWeightKg: String(parseFloat(weight) || set.plannedWeightKg || 0),
      rpe: rpe ? parseInt(rpe) : null,
      completedAt: new Date().toISOString(),
    };
    const result = await updateSet(sessionId, set.id, updates);
    if (result) {
      setCompleted(true);
      onUpdate?.();
    }
    setSaving(false);
  };

  return (
    <tr className={`transition-colors duration-200 ${completed ? 'opacity-70' : ''}`}
        style={completed ? { backgroundColor: 'rgba(34, 197, 94, 0.05)' } : {}}>
      <td className="py-2 pr-2 text-center text-sm" style={{ color: 'var(--text-dim)' }}>{index + 1}</td>
      <td className="py-2 pr-1">
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder={String(set.plannedReps || '')}
          disabled={completed}
          className="w-full text-center !py-1.5 text-sm"
          min="0"
        />
      </td>
      <td className="py-2 pr-1">
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder={String(set.plannedWeightKg || '')}
          disabled={completed}
          className="w-full text-center !py-1.5 text-sm"
          min="0"
          step="0.5"
        />
      </td>
      <td className="py-2 pr-1">
        <input
          type="number"
          value={rpe}
          onChange={(e) => setRpe(e.target.value)}
          disabled={completed}
          className="w-full text-center !py-1.5 text-sm"
          min="1"
          max="10"
          placeholder="1–10"
          title="Rate of Perceived Exertion: 1 (very easy) – 10 (max effort)"
        />
      </td>
      <td className="py-2 text-center">
        {completed ? (
          isPB || set.isPersonalBest ? (
            <Trophy size={16} className="text-amber-400 mx-auto" />
          ) : (
            <Check size={16} className="text-green-500 mx-auto" />
          )
        ) : (
          <button
            onClick={handleComplete}
            disabled={saving}
            className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all duration-200 border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} />}
          </button>
        )}
      </td>
      {!sessionCompleted && (
        <td className="py-2 text-center w-8">
          <button
            onClick={() => onDelete?.(set.id)}
            className="p-1 rounded transition-all duration-200 text-red-500/40 hover:text-red-400"
          >
            <Trash2 size={12} />
          </button>
        </td>
      )}
    </tr>
  );
}

function ExerciseGroup({ exercise, sessionId, isCompleted: sessionCompleted }) {
  const addSet = useWorkoutStore((s) => s.addSet);
  const deleteSet = useWorkoutStore((s) => s.deleteSet);
  const [addingSet, setAddingSet] = useState(false);
  const [, forceUpdate] = useState(0);
  const [showRest, setShowRest] = useState(false);
  const [pb, setPb] = useState(null);
  const [lastSession, setLastSession] = useState(null);

  const sets = exercise.sets || [];
  const restSeconds = exercise.restAfterSeconds || exercise.durationSeconds || 0;

  useEffect(() => {
    if (!exercise.exerciseId) return;
    workoutsApi.getExercisePBs(exercise.exerciseId)
      .then((data) => {
        const best = Array.isArray(data) ? data[0] : data?.maxWeight || data;
        if (best) setPb(best);
      })
      .catch(() => {});
    workoutsApi.getExerciseHistory(exercise.exerciseId)
      .then((data) => {
        const entries = Array.isArray(data) ? data : data?.entries || [];
        if (entries.length > 0) setLastSession(entries[0]);
      })
      .catch(() => {});
  }, [exercise.exerciseId]);

  const handleAddSet = async () => {
    setAddingSet(true);
    const lastSet = sets[sets.length - 1];
    await addSet(sessionId, {
      itemType: 'EXERCISE',
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      orderInSession: exercise.orderInSession || 1,
      setNumber: sets.length + 1,
      plannedReps: lastSet?.plannedReps || 10,
      plannedWeightKg: String(lastSet?.plannedWeightKg || 0),
    });
    setAddingSet(false);
  };

  const handleSetComplete = () => {
    forceUpdate((n) => n + 1);
    if (restSeconds > 0) setShowRest(true);
  };

  const handleDeleteSet = async (setId) => {
    if (!setId) return;
    await deleteSet(sessionId, setId);
  };

  return (
    <div className="card mb-4 animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold">{exercise.exerciseName}</h3>
          {lastSession && (
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
              Last: {lastSession.actualReps ?? lastSession.reps ?? '?'} × {lastSession.actualWeightKg ?? lastSession.weightKg ?? '?'}kg
              {lastSession.completedAt && (
                <span className="ml-1">· {new Date(lastSession.completedAt).toLocaleDateString()}</span>
              )}
            </p>
          )}
        </div>
        {pb && (() => {
          const w = parseFloat(pb.actualWeightKg ?? pb.value) || 0;
          const r = parseInt(pb.actualReps) || 0;
          const orm = r === 1 ? w : Math.round(w * (1 + r / 30) * 10) / 10;
          return (
            <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 flex items-center gap-1">
                <Trophy size={10} /> PB: {w}kg × {r}r
              </span>
              {orm > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-dim)' }}>
                  ~{orm}kg 1RM
                </span>
              )}
            </div>
          );
        })()}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ color: 'var(--text-dim)' }}>
              <th className="text-[10px] uppercase font-medium pb-2 pr-2 text-center w-8">Set</th>
              <th className="text-[10px] uppercase font-medium pb-2 pr-1 text-center">Reps</th>
              <th className="text-[10px] uppercase font-medium pb-2 pr-1 text-center">Kg</th>
              <th className="text-[10px] uppercase font-medium pb-2 pr-1 text-center w-14" title="Rate of Perceived Exertion (1–10)">RPE</th>
              <th className="text-[10px] uppercase font-medium pb-2 text-center w-10"></th>
            </tr>
          </thead>
          <tbody>
            {sets.map((s, i) => (
              <SetRow
                key={s.id || i}
                set={s}
                index={i}
                sessionId={sessionId}
                exerciseId={exercise.exerciseId}
                onUpdate={handleSetComplete}
                onDelete={handleDeleteSet}
                isCompleted={sessionCompleted}
                isPB={!!s.isPersonalBest}
              />
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={handleAddSet}
        disabled={addingSet}
        className="mt-3 text-sm flex items-center gap-1.5 transition-all duration-200"
        style={{ color: 'var(--text-muted)' }}
      >
        {addingSet ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
        Add Set
      </button>
      {showRest && restSeconds > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <RestBlock durationSeconds={restSeconds} />
        </div>
      )}
    </div>
  );
}

function RestBlock({ durationSeconds = 90 }) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  const toggle = () => {
    if (running) {
      clearInterval(intervalRef.current);
      setRunning(false);
    } else {
      if (remaining <= 0) setRemaining(durationSeconds);
      setRunning(true);
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="card mb-4 animate-fade-in flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Timer size={18} style={{ color: 'var(--text-dim)' }} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Rest</p>
          <p className="text-2xl font-bold tabular-nums">
            {mins}:{String(secs).padStart(2, '0')}
          </p>
        </div>
      </div>
      <button
        onClick={toggle}
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 border"
        style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
      >
        {running ? <Pause size={16} /> : <Play size={16} />}
      </button>
    </div>
  );
}

function CardioBlock({ exercise }) {
  const sets = exercise.sets || [];
  const item = sets[0] || {};
  return (
    <div className="card mb-4 animate-fade-in">
      <h3 className="font-semibold mb-2">{exercise.exerciseName}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="label mb-1">Duration (min)</p>
          <p className="text-lg font-bold">{item.durationMinutes ?? exercise.durationMinutes ?? '--'}</p>
        </div>
        <div>
          <p className="label mb-1">Distance</p>
          <p className="text-lg font-bold">{item.distanceKm ?? '--'} km</p>
        </div>
      </div>
    </div>
  );
}

function WorkoutNotes({ sessionId, initialNotes, disabled }) {
  const [notes, setNotes] = useState(initialNotes);
  const updateSession = useWorkoutStore((s) => s.updateSession);

  const handleBlur = () => {
    if (notes !== initialNotes) {
      updateSession(sessionId, { notes });
    }
  };

  return (
    <div className="card mb-4">
      <label className="label block mb-1.5">Notes</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder="Add workout notes..."
        className="w-full !py-2.5 text-sm"
        rows={2}
        style={{ resize: 'vertical' }}
      />
    </div>
  );
}

function CompletionCard({ result, onDone }) {
  const allSets = (result?.exercises || []).flatMap((e) => e.sets || []);
  const completedSets = allSets.filter((s) => s.completedAt);

  const pbs = (result?.exercises || []).flatMap((ex) =>
    (ex.sets || [])
      .filter((s) => s.isPersonalBest)
      .map((s) => ({ exerciseName: ex.exerciseName, value: s.actualWeightKg, reps: s.actualReps }))
  );

  const exerciseCount = (result?.exercises || []).filter((e) => e.itemType === 'EXERCISE').length;
  const setCount = completedSets.length;
  const totalVolume = completedSets.reduce((sum, s) => {
    const w = parseFloat(s.actualWeightKg) || 0;
    const r = parseInt(s.actualReps) || 0;
    return sum + w * r;
  }, 0);

  const durationMs = result?.startedAt && result?.completedAt
    ? new Date(result.completedAt).getTime() - new Date(result.startedAt).getTime()
    : null;
  const durationStr = durationMs
    ? (() => {
        const mins = Math.floor(durationMs / 60000);
        if (mins < 60) return `${mins}m`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m`;
      })()
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="card max-w-sm w-full text-center py-10 px-6 animate-fade-in">
        <Trophy size={48} className="mx-auto mb-4 text-amber-400" />
        <h2 className="text-2xl font-bold mb-2">Workout Complete!</h2>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl py-3" style={{ backgroundColor: 'var(--bg-raised)' }}>
            <p className="text-lg font-bold">{exerciseCount}</p>
            <p className="text-[10px] uppercase mt-0.5" style={{ color: 'var(--text-dim)' }}>Exercises</p>
          </div>
          <div className="rounded-xl py-3" style={{ backgroundColor: 'var(--bg-raised)' }}>
            <p className="text-lg font-bold">{setCount}</p>
            <p className="text-[10px] uppercase mt-0.5" style={{ color: 'var(--text-dim)' }}>Sets</p>
          </div>
          <div className="rounded-xl py-3" style={{ backgroundColor: 'var(--bg-raised)' }}>
            <p className="text-lg font-bold">{durationStr || '--'}</p>
            <p className="text-[10px] uppercase mt-0.5" style={{ color: 'var(--text-dim)' }}>Duration</p>
          </div>
        </div>

        {totalVolume > 0 && (
          <div className="rounded-xl py-3 px-4 mb-6" style={{ backgroundColor: 'var(--bg-raised)' }}>
            <p className="text-2xl font-bold">{totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${Math.round(totalVolume)}kg`}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>Total Volume Lifted</p>
          </div>
        )}

        {pbs.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-semibold mb-2 text-amber-400">Personal Bests</p>
            {pbs.map((pb, i) => (
              <div key={i} className="flex items-center gap-2 justify-center text-sm mb-1">
                <Trophy size={14} className="text-amber-400" />
                <span>{pb.exerciseName}: {pb.value}kg × {pb.reps}r</span>
              </div>
            ))}
          </div>
        )}
        <button onClick={onDone} className="btn-primary w-full">Done</button>
      </div>
    </div>
  );
}

export default function WorkoutActive() {
  const { id } = useParams();
  const navigate = useNavigate();
  const activeSession = useWorkoutStore((s) => s.activeSession);
  const isLoading = useWorkoutStore((s) => s.isLoading);
  const fetchSession = useWorkoutStore((s) => s.fetchSession);
  const completeWorkout = useWorkoutStore((s) => s.completeWorkout);
  const addSet = useWorkoutStore((s) => s.addSet);
  const updateSession = useWorkoutStore((s) => s.updateSession);

  const [elapsed, setElapsed] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState(null);
  const [completionResult, setCompletionResult] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const nameInputRef = useRef(null);

  // Add exercise sheet
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exSearch, setExSearch] = useState('');
  const [exResults, setExResults] = useState([]);
  const [exLoading, setExLoading] = useState(false);
  const [addingExId, setAddingExId] = useState(null);
  const [exCategories, setExCategories] = useState([]);
  const [exCategoryFilter, setExCategoryFilter] = useState('');
  const [exPage, setExPage] = useState(1);
  const [exHasMore, setExHasMore] = useState(false);
  const [exLoadingMore, setExLoadingMore] = useState(false);

  useEffect(() => {
    fetchSession(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Elapsed timer
  useEffect(() => {
    if (!activeSession?.startedAt || activeSession?.status === 'COMPLETED') return;
    const start = new Date(activeSession.startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.startedAt, activeSession?.status]);

  useEffect(() => {
    if (activeSession?.name && !editingName) {
      setSessionName(activeSession.name);
    }
  }, [activeSession?.name, editingName]);

  // Fetch categories once when add-exercise sheet opens
  useEffect(() => {
    if (!showAddExercise || exCategories.length > 0) return;
    exercisesApi.getCategories()
      .then((data) => setExCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [showAddExercise, exCategories.length]);

  // Exercise search (with category filter + pagination)
  const searchExercises = useCallback(async (q, categoryId, pageNum = 1, append = false) => {
    if (pageNum === 1) setExLoading(true);
    else setExLoadingMore(true);
    try {
      const data = await exercisesApi.list({
        search: q || undefined,
        categoryId: categoryId || undefined,
        page: pageNum,
        pageSize: 15,
      });
      const list = Array.isArray(data) ? data : data?.exercises || [];
      const more = Array.isArray(data) ? list.length === 15 : !!data?.pagination?.hasMore;
      if (append) setExResults((prev) => [...prev, ...list]);
      else setExResults(list);
      setExHasMore(more);
      setExPage(pageNum);
    } catch {
      if (!append) setExResults([]);
    } finally {
      setExLoading(false);
      setExLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (!showAddExercise) return;
    const timer = setTimeout(() => searchExercises(exSearch, exCategoryFilter, 1), 300);
    return () => clearTimeout(timer);
  }, [exSearch, exCategoryFilter, showAddExercise, searchExercises]);

  const handleAddExerciseToWorkout = async (exercise) => {
    setAddingExId(exercise.id);
    const maxOrder = exercises.reduce((max, ex) => Math.max(max, ex.orderInSession || 0), 0);
    await addSet(id, {
      itemType: 'EXERCISE',
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      orderInSession: maxOrder + 1,
      setNumber: 1,
      plannedReps: 10,
      plannedWeightKg: '0',
    });
    // Auto-add a 90s rest block after the exercise
    await addSet(id, {
      itemType: 'REST',
      orderInSession: maxOrder + 2,
      durationSeconds: 90,
    });
    await fetchSession(id);
    setAddingExId(null);
    setShowAddExercise(false);
    setExSearch('');
  };

  const handleFinish = async () => {
    if (!window.confirm('Finish this workout?')) return;
    setFinishing(true);
    setFinishError(null);
    const result = await completeWorkout(id);
    if (result) {
      setCompletionResult(result);
    } else {
      setFinishError(useWorkoutStore.getState().error || 'Failed to complete workout');
    }
    setFinishing(false);
  };

  const handleNameSave = async () => {
    if (sessionName.trim() && sessionName !== activeSession?.name) {
      await updateSession(id, { name: sessionName.trim() });
    }
    setEditingName(false);
  };

  if (isLoading && !activeSession) {
    return (
      <div className="page flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-dim)' }} />
      </div>
    );
  }

  if (!activeSession || String(activeSession.id) !== String(id)) {
    return (
      <div className="page text-center py-20">
        <p style={{ color: 'var(--text-muted)' }}>Workout not found</p>
        <button onClick={() => navigate('/workouts')} className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
          Go to Workouts &rarr;
        </button>
      </div>
    );
  }

  const isCompleted = activeSession.status === 'COMPLETED';
  const exercises = activeSession.exercises || [];

  return (
    <div className="page pb-28">
      {completionResult && (
        <CompletionCard result={completionResult} onDone={() => navigate('/workouts')} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div className="min-w-0 flex-1 mr-3">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                ref={nameInputRef}
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                className="text-lg font-bold !py-1.5 flex-1"
                autoFocus
              />
            </div>
          ) : (
            <button onClick={() => !isCompleted && setEditingName(true)} className="text-left">
              <h1 className="text-xl font-bold truncate">{activeSession.name || 'Workout'}</h1>
            </button>
          )}
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              <Clock size={14} /> {formatElapsed(elapsed)}
            </span>
            {isCompleted && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                Completed
              </span>
            )}
          </div>
        </div>
        {!isCompleted && (
          <button
            onClick={handleFinish}
            disabled={finishing}
            className="btn-primary !py-2.5 !px-5 text-sm flex items-center gap-2 shrink-0"
          >
            {finishing ? <Loader2 size={14} className="animate-spin" /> : null}
            Finish
          </button>
        )}
      </div>

      {/* Finish error */}
      {finishError && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400 border border-red-500/20 bg-red-500/5">
          {finishError}
        </div>
      )}

      {/* Exercise groups */}
      {exercises.length === 0 && (
        <div className="card text-center py-12 mb-6 animate-fade-in">
          <p style={{ color: 'var(--text-muted)' }}>No exercises yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>Add exercises to start logging sets</p>
        </div>
      )}

      <div className="stagger">
        {exercises.map((ex, i) => {
          if (ex.itemType === 'REST') {
            return <RestBlock key={`rest-${i}`} durationSeconds={ex.sets?.[0]?.durationSeconds || 90} />;
          }
          if (ex.itemType === 'CARDIO') {
            return <CardioBlock key={ex.exerciseId || `cardio-${i}`} exercise={ex} />;
          }
          return (
            <ExerciseGroup
              key={ex.exerciseId || i}
              exercise={ex}
              sessionId={id}
              isCompleted={isCompleted}
            />
          );
        })}
      </div>

      {/* Workout Notes */}
      <WorkoutNotes sessionId={id} initialNotes={activeSession.notes || ''} disabled={isCompleted} />

      {/* Add Exercise */}
      {!isCompleted && (
        <button
          onClick={() => setShowAddExercise(true)}
          className="btn-secondary w-full flex items-center justify-center gap-2 mt-2"
        >
          <Plus size={16} /> Add Exercise
        </button>
      )}

      {/* Add Exercise Bottom Sheet */}
      <BottomSheet
        open={showAddExercise}
        onClose={() => { setShowAddExercise(false); setExSearch(''); setExCategoryFilter(''); setExResults([]); }}
        title="Add Exercise"
      >
        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
          <input
            type="text"
            value={exSearch}
            onChange={(e) => setExSearch(e.target.value)}
            placeholder="Search exercises..."
            className="w-full !pl-11"
            autoFocus
          />
        </div>

        {/* Category chips */}
        {exCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
            <button
              onClick={() => setExCategoryFilter('')}
              className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border"
              style={!exCategoryFilter
                ? { backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderColor: 'var(--btn-primary-bg)' }
                : { backgroundColor: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-default)' }
              }
            >
              All
            </button>
            {exCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setExCategoryFilter(exCategoryFilter === cat.id ? '' : cat.id)}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border"
                style={exCategoryFilter === cat.id
                  ? { backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderColor: 'var(--btn-primary-bg)' }
                  : { backgroundColor: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-default)' }
                }
              >
                {cat.shortName || cat.displayName}
              </button>
            ))}
          </div>
        )}

        {/* Exercise list */}
        {exLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-dim)' }} />
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {exResults.map((ex) => (
              <button
                key={ex.id}
                onClick={() => handleAddExerciseToWorkout(ex)}
                disabled={addingExId === ex.id}
                className="w-full card !py-3 flex items-center justify-between text-left"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm">{ex.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                    {ex.primaryMuscle || ex.muscleGroup || ''}
                    {(ex.equipment || ex.equipmentName) && (
                      <span className="ml-1.5 before:content-['·'] before:mr-1.5">{ex.equipment || ex.equipmentName}</span>
                    )}
                  </p>
                </div>
                {addingExId === ex.id ? (
                  <Loader2 size={14} className="animate-spin shrink-0" style={{ color: 'var(--text-dim)' }} />
                ) : (
                  <Plus size={14} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
                )}
              </button>
            ))}
            {!exLoading && exResults.length === 0 && (
              <p className="text-center text-sm py-6" style={{ color: 'var(--text-dim)' }}>
                {exSearch || exCategoryFilter ? 'No exercises found' : 'Select a category or search'}
              </p>
            )}
            {exHasMore && (
              <button
                onClick={() => searchExercises(exSearch, exCategoryFilter, exPage + 1, true)}
                disabled={exLoadingMore}
                className="w-full py-2.5 text-sm transition-all duration-200 flex items-center justify-center gap-2"
                style={{ color: 'var(--text-muted)' }}
              >
                {exLoadingMore ? <Loader2 size={12} className="animate-spin" /> : null}
                Load more
              </button>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
