import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Search, Timer, Trash2, ChevronUp, ChevronDown, Globe, Lock } from 'lucide-react';
import { useRoutineStore } from '../stores/routineStore';
import { exercisesApi } from '../lib/api';
import BottomSheet from '../components/BottomSheet';

export default function RoutineNew() {
  const navigate = useNavigate();
  const createRoutine = useRoutineStore((s) => s.createRoutine);

  // Routine fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Exercise search sheet
  const [showExSheet, setShowExSheet] = useState(false);
  const [exSearch, setExSearch] = useState('');
  const [exResults, setExResults] = useState([]);
  const [exLoading, setExLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [catFilter, setCatFilter] = useState('');
  const [addingExId, setAddingExId] = useState(null);

  // Rest duration sheet
  const [showRestSheet, setShowRestSheet] = useState(false);
  const [restDuration, setRestDuration] = useState(90);

  // Load categories once
  useEffect(() => {
    exercisesApi.getCategories()
      .then((cats) => setCategories(Array.isArray(cats) ? cats : []))
      .catch(() => {});
  }, []);

  // Exercise search
  const fetchExercises = useCallback(async () => {
    setExLoading(true);
    try {
      const data = await exercisesApi.list({
        search: exSearch || undefined,
        categoryId: catFilter || undefined,
        pageSize: 20,
      });
      setExResults(Array.isArray(data) ? data : data?.exercises || []);
    } catch {
      setExResults([]);
    } finally {
      setExLoading(false);
    }
  }, [exSearch, catFilter]);

  useEffect(() => {
    if (!showExSheet) return;
    const timer = setTimeout(fetchExercises, 300);
    return () => clearTimeout(timer);
  }, [fetchExercises, showExSheet]);

  const handleAddExercise = (exercise) => {
    setAddingExId(exercise.id);
    setItems((prev) => [
      ...prev,
      {
        type: 'EXERCISE',
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets: 3,
        repsPerSet: 10,
        weightKg: null,
        restAfterSeconds: 90,
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

  const handleAddRest = () => {
    setItems((prev) => [
      ...prev,
      {
        type: 'REST',
        durationSeconds: restDuration,
        order: prev.length + 1,
      },
    ]);
    setShowRestSheet(false);
    setRestDuration(90);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((item, i) => ({ ...item, order: i + 1 }));
    });
  };

  const handleMoveItem = (index, direction) => {
    setItems((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((item, i) => ({ ...item, order: i + 1 }));
    });
  };

  const handleUpdateExercise = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSave = async () => {
    setError('');
    if (!name.trim()) { setError('Routine name is required'); return; }
    if (items.length === 0) { setError('Add at least one exercise'); return; }

    setSaving(true);
    const id = await createRoutine({
      name: name.trim(),
      description: description.trim(),
      items,
      isPublic,
    });
    if (id) {
      navigate(`/routines/${id}`, { replace: true });
    } else {
      setError('Failed to create routine');
    }
    setSaving(false);
  };

  const exerciseNames = new Set(items.filter((i) => i.type === 'EXERCISE').map((i) => i.exerciseName));

  return (
    <div className="page pb-28">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 mb-6 transition-all duration-200 text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="page-title animate-fade-in">New Routine</h1>

      {/* Name & Description */}
      <div className="space-y-4 mb-8 animate-fade-in" style={{ animationDelay: '50ms' }}>
        <div>
          <label className="label block mb-2">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Push Day, Upper Body..."
            autoFocus
            className="w-full"
          />
        </div>
        <div>
          <label className="label block mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            rows={2}
            className="w-full resize-none"
          />
        </div>
      </div>

      {/* Items List */}
      <div className="mb-6">
        <h2 className="section-title">Exercises & Blocks</h2>

        {items.length === 0 ? (
          <div className="card text-center py-8 mb-4" style={{ color: 'var(--text-dim)' }}>
            <p className="text-sm">No exercises added yet</p>
            <p className="text-xs mt-1">Use the buttons below to build your routine</p>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {items.map((item, i) => (
              <div key={i} className="card animate-fade-in">
                {item.type === 'REST' ? (
                  /* REST Block */
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Timer size={18} style={{ color: 'var(--text-dim)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Rest</p>
                        <p className="text-sm">
                          {Math.floor(item.durationSeconds / 60)}:{String(item.durationSeconds % 60).padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex flex-col gap-0.5 mr-1">
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
                ) : (
                  /* EXERCISE Block */
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button onClick={() => handleMoveItem(i, -1)} disabled={i === 0} className="p-0.5 disabled:opacity-10" style={{ color: 'var(--text-muted)' }}>
                            <ChevronUp size={12} />
                          </button>
                          <button onClick={() => handleMoveItem(i, 1)} disabled={i === items.length - 1} className="p-0.5 disabled:opacity-10" style={{ color: 'var(--text-muted)' }}>
                            <ChevronDown size={12} />
                          </button>
                        </div>
                        <p className="font-semibold truncate">{item.exerciseName}</p>
                      </div>
                      <button onClick={() => handleRemoveItem(i)} className="p-2 text-red-500/50 hover:text-red-400 transition-all duration-200 shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="label block mb-1 text-[10px]">Sets</label>
                        <input
                          type="number" min="1" value={item.sets}
                          onChange={(e) => handleUpdateExercise(i, 'sets', parseInt(e.target.value) || 1)}
                          className="w-full text-center !py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="label block mb-1 text-[10px]">Reps</label>
                        <input
                          type="number" min="1" value={item.repsPerSet}
                          onChange={(e) => handleUpdateExercise(i, 'repsPerSet', parseInt(e.target.value) || 1)}
                          className="w-full text-center !py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="label block mb-1 text-[10px]">Weight (kg)</label>
                        <input
                          type="number" min="0" step="0.5" value={item.weightKg || ''}
                          onChange={(e) => handleUpdateExercise(i, 'weightKg', e.target.value ? String(parseFloat(e.target.value)) : null)}
                          className="w-full text-center !py-2 text-sm" placeholder="--"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setShowExSheet(true); fetchExercises(); }}
            className="btn-secondary flex items-center justify-center gap-2 text-sm"
          >
            <Plus size={14} /> Add Exercise
          </button>
          <button
            onClick={() => setShowRestSheet(true)}
            className="btn-secondary flex items-center justify-center gap-2 text-sm"
          >
            <Timer size={14} /> Add Rest
          </button>
        </div>
      </div>

      {/* Visibility */}
      <div className="card mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isPublic ? <Globe size={18} className="text-blue-400" /> : <Lock size={18} style={{ color: 'var(--text-dim)' }} />}
            <div>
              <p className="text-sm font-medium">{isPublic ? 'Public' : 'Private'}</p>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                {isPublic ? 'Anyone can browse & clone this routine' : 'Only visible to you'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`w-11 h-6 rounded-full transition-all duration-200 relative ${isPublic ? 'bg-blue-500' : ''}`}
            style={!isPublic ? { backgroundColor: 'var(--bg-input)' } : {}}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${isPublic ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400 mb-4 text-center">{error}</p>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full flex items-center justify-center gap-2 !py-3.5"
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        Save Routine
      </button>

      {/* Add Exercise Bottom Sheet */}
      <BottomSheet open={showExSheet} onClose={() => { setShowExSheet(false); setExSearch(''); setCatFilter(''); }} title="Add Exercise">
        <div className="relative mb-3">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
          <input
            type="text" value={exSearch} onChange={(e) => setExSearch(e.target.value)}
            placeholder="Search exercises..." className="w-full !pl-11" autoFocus
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
          <button
            onClick={() => setCatFilter('')}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200"
            style={!catFilter
              ? { backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderColor: 'var(--btn-primary-bg)' }
              : { borderColor: 'var(--border-default)', color: 'var(--text-muted)' }
            }
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCatFilter(catFilter === cat.id ? '' : cat.id)}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200"
              style={catFilter === cat.id
                ? { backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderColor: 'var(--btn-primary-bg)' }
                : { borderColor: 'var(--border-default)', color: 'var(--text-muted)' }
              }
            >
              {cat.name}
            </button>
          ))}
        </div>

        {exLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-dim)' }} />
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {exResults.map((ex) => {
              const alreadyAdded = exerciseNames.has(ex.name);
              return (
                <button
                  key={ex.id}
                  onClick={() => !alreadyAdded && handleAddExercise(ex)}
                  disabled={alreadyAdded || addingExId === ex.id}
                  className="w-full card !py-3 flex items-center justify-between text-left"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{ex.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                      {ex.primaryMuscle || ex.muscleGroup || ''}
                      {ex.equipment && <> · {ex.equipment}</>}
                    </p>
                  </div>
                  {alreadyAdded ? (
                    <span className="text-xs shrink-0" style={{ color: 'var(--text-dim)' }}>Added</span>
                  ) : (
                    <Plus size={14} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
                  )}
                </button>
              );
            })}
            {!exLoading && exResults.length === 0 && exSearch && (
              <p className="text-center text-sm py-6" style={{ color: 'var(--text-dim)' }}>No exercises found</p>
            )}
          </div>
        )}
      </BottomSheet>

      {/* Add Rest Bottom Sheet */}
      <BottomSheet open={showRestSheet} onClose={() => setShowRestSheet(false)} title="Add Rest Block">
        <div className="text-center mb-6">
          <p className="text-4xl font-bold tabular-nums mb-2">
            {Math.floor(restDuration / 60)}:{String(restDuration % 60).padStart(2, '0')}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>minutes : seconds</p>
        </div>
        <div className="flex gap-2 justify-center mb-6">
          {[30, 60, 90, 120, 180].map((sec) => (
            <button
              key={sec}
              onClick={() => setRestDuration(sec)}
              className="px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200"
              style={restDuration === sec
                ? { backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderColor: 'var(--btn-primary-bg)' }
                : { borderColor: 'var(--border-default)', color: 'var(--text-muted)' }
              }
            >
              {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
            </button>
          ))}
        </div>
        <input
          type="range" min="15" max="300" step="15" value={restDuration}
          onChange={(e) => setRestDuration(parseInt(e.target.value))}
          className="w-full mb-6"
        />
        <button onClick={handleAddRest} className="btn-primary w-full">
          Add Rest Block
        </button>
      </BottomSheet>
    </div>
  );
}
