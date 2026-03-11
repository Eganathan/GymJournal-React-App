import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Search, Timer, Trash2, ChevronUp, ChevronDown, Globe, Lock, Check } from 'lucide-react';
import { useRoutineStore } from '../stores/routineStore';
import { exercisesApi } from '../lib/api';
import { getCachedCategories, setCache } from '../lib/cache';

function ExerciseItemShimmer() {
  return (
    <div className="card !py-3 flex items-center justify-between animate-pulse">
      <div className="min-w-0 flex-1">
        <div className="h-3.5 rounded-full mb-2" style={{ backgroundColor: 'var(--bg-raised)', width: '58%' }} />
        <div className="h-2.5 rounded-full" style={{ backgroundColor: 'var(--bg-raised)', width: '32%' }} />
      </div>
      <div className="w-6 h-6 rounded-lg shrink-0 ml-3" style={{ backgroundColor: 'var(--bg-raised)' }} />
    </div>
  );
}

const DEFAULT_REPS = 10;
const DEFAULT_WEIGHT = null;
const DEFAULT_SET_ROWS = () => [
  { _id: crypto.randomUUID(), reps: DEFAULT_REPS, weightKg: DEFAULT_WEIGHT },
  { _id: crypto.randomUUID(), reps: DEFAULT_REPS, weightKg: DEFAULT_WEIGHT },
  { _id: crypto.randomUUID(), reps: DEFAULT_REPS, weightKg: DEFAULT_WEIGHT },
];
const REST_DEFAULT_S = 120;

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
  const [exLoadingMore, setExLoadingMore] = useState(false);
  const [exPage, setExPage] = useState(1);
  const [exHasMore, setExHasMore] = useState(false);
  const [categories, setCategories] = useState([]);
  const [catFilter, setCatFilter] = useState('');
  const [selectedExIds, setSelectedExIds] = useState(new Set());
  const exSentinelRef = useRef(null);

  // Load categories (with cache)
  useEffect(() => {
    const cached = getCachedCategories();
    if (cached) { setCategories(cached); return; }
    exercisesApi.getCategories()
      .then((cats) => {
        const c = Array.isArray(cats) ? cats : [];
        setCategories(c);
        setCache('exercise-categories', c, 30 * 60 * 1000);
      })
      .catch(() => {});
  }, []);

  // Exercise search with pagination
  const fetchExercises = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setExLoading(true);
    else setExLoadingMore(true);
    try {
      const { items, meta } = await exercisesApi.list({
        search: exSearch || undefined,
        categoryId: catFilter || undefined,
        page: pageNum,
        pageSize: 20,
      });
      const total = parseInt(meta.total, 10);
      const more = !isNaN(total)
        ? meta.page * meta.pageSize < total
        : items.length >= 20;
      if (append) setExResults((prev) => [...prev, ...items]);
      else setExResults(items);
      setExHasMore(more);
      setExPage(pageNum);
    } catch {
      if (!append) setExResults([]);
    } finally {
      setExLoading(false);
      setExLoadingMore(false);
    }
  }, [exSearch, catFilter]);

  useEffect(() => {
    if (!showExSheet) return;
    const timer = setTimeout(() => fetchExercises(1), 300);
    return () => clearTimeout(timer);
  }, [fetchExercises, showExSheet]);

  // Infinite scroll sentinel — full-screen panel uses viewport as root
  useEffect(() => {
    const el = exSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && exHasMore && !exLoadingMore) {
          fetchExercises(exPage + 1, true);
        }
      },
      { rootMargin: '100px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [exHasMore, exLoadingMore, exPage, fetchExercises]);

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

  // Per-set row handlers
  const handleSetRowChange = (itemIdx, rowIdx, field, rawValue) => {
    const value = field === 'reps'
      ? (parseInt(rawValue) || DEFAULT_REPS)
      : (rawValue === '' ? DEFAULT_WEIGHT : parseFloat(rawValue));

    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== itemIdx) return item;
        const rows = item.setRows.map((row, r) => {
          if (r === rowIdx) return { ...row, [field]: value };
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
        return { ...item, setRows: [...item.setRows, { ...last, _id: crypto.randomUUID() }] };
      })
    );
  };

  const handleRemoveSetRow = (itemIdx, rowIdx) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== itemIdx) return item;
        if (item.setRows.length <= 1) return item;
        return { ...item, setRows: item.setRows.filter((_, r) => r !== rowIdx) };
      })
    );
  };

  const handleUpdateRestDuration = (index, seconds) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, durationSeconds: seconds } : item))
    );
  };

  // handleSave deriving flat fields from setRows
  const handleSave = async () => {
    setError('');
    if (!name.trim()) { setError('Routine name is required'); return; }
    if (items.length === 0) { setError('Add at least one exercise'); return; }

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
            <p className="text-xs mt-1">Tap Add Exercise to build your routine</p>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {items.map((item, i) => (
              <div key={i} className="card animate-fade-in">
                {item.type === 'REST' ? (
                  /* REST Block */
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
                        <div key={row._id} className="grid grid-cols-[28px_1fr_1fr_28px] gap-x-2 mb-1.5 items-center">
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
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Exercise */}
        <button
          onClick={() => setShowExSheet(true)}
          className="btn-secondary flex items-center justify-center gap-2 text-sm w-full"
        >
          <Plus size={14} /> Add Exercise
        </button>
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

      {/* Add Exercise — full-screen panel so IntersectionObserver works with root: null */}
      {showExSheet && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto animate-fade-in-fast"
          style={{ backgroundColor: 'var(--bg-base)' }}
        >
          {/* Sticky header + search + chips */}
          <div
            className="sticky top-0 z-10 px-5 pt-5 pb-4"
            style={{ backgroundColor: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => {
                  setShowExSheet(false);
                  setExSearch('');
                  setCatFilter('');
                  setExResults([]);
                  setSelectedExIds(new Set());
                }}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
                style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-default)' }}
              >
                <ArrowLeft size={16} />
              </button>
              <h2 className="text-xl font-bold">Add Exercise</h2>
            </div>

            <div className="relative mb-3">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
              <input
                type="text" value={exSearch} onChange={(e) => setExSearch(e.target.value)}
                placeholder="Search exercises..." className="w-full !pl-11" autoFocus
              />
            </div>

            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setCatFilter('')}
                  className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200"
                  style={!catFilter
                    ? { backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderColor: 'var(--btn-primary-bg)' }
                    : { backgroundColor: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-default)' }
                  }
                >All</button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCatFilter(catFilter === cat.id ? '' : cat.id)}
                    className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200"
                    style={catFilter === cat.id
                      ? { backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderColor: 'var(--btn-primary-bg)' }
                      : { backgroundColor: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-default)' }
                    }
                  >
                    {cat.shortName || cat.displayName || cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sticky confirm bar */}
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

          {/* Exercise list */}
          <div className="px-5 pt-3 pb-10">
            {exLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }, (_, i) => <ExerciseItemShimmer key={i} />)}
              </div>
            ) : (
              <div className="space-y-2">
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
                {exResults.length === 0 && (
                  <p className="text-center text-sm py-10" style={{ color: 'var(--text-dim)' }}>
                    {exSearch || catFilter ? 'No exercises found' : 'Select a category or search'}
                  </p>
                )}
                {/* Infinite scroll sentinel */}
                <div ref={exSentinelRef} className="flex items-center justify-center py-4">
                  {exLoadingMore && (
                    <div className="space-y-2 w-full">
                      {Array.from({ length: 3 }, (_, i) => <ExerciseItemShimmer key={i} />)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
