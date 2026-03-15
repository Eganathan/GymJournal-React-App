import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Check, Loader2 } from 'lucide-react';
import { useRoutineStore } from '../stores/routineStore';
import { exercisesApi } from '../lib/api';
import { getCachedCategories, getCache, setCache } from '../lib/cache';
import BottomSheet from '../components/BottomSheet';

export default function AddExercise() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addExercise = useRoutineStore((s) => s.addExercise);
  const routine = useRoutineStore((s) => s.currentRoutine);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [addingId, setAddingId] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategoryId, setCustomCategoryId] = useState('');
  const [customEquipmentId, setCustomEquipmentId] = useState('');
  const [customDifficulty, setCustomDifficulty] = useState('Beginner');
  const [customInstructions, setCustomInstructions] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const sentinelRef = useRef(null);

  const existingNames = new Set(
    (routine?.items || []).map((e) => e.exerciseName)
  );

  // Optimize lookups: O(n²) to O(1)
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories?.forEach((c) => map.set(String(c.id), c));
    return map;
  }, [categories]);

  const equipmentMap = useMemo(() => {
    const map = new Map();
    equipment?.forEach((e) => map.set(String(e.id), e));
    return map;
  }, [equipment]);

  useEffect(() => {
    const cachedCats = getCachedCategories();
    const cachedEquip = getCache('exercise-equipment');
    if (cachedCats && cachedEquip) {
      setCategories(cachedCats);
      setEquipment(cachedEquip);
      return;
    }
    Promise.all([exercisesApi.getCategories(), exercisesApi.getEquipment()])
      .then(([cats, equip]) => {
        const c = Array.isArray(cats) ? cats : [];
        const e = Array.isArray(equip) ? equip : [];
        setCategories(c);
        setEquipment(e);
        setCache('exercise-categories', c, 30 * 60 * 1000);
        setCache('exercise-equipment', e, 30 * 60 * 1000);
      })
      .catch(() => {});
  }, []);

  const fetchExercises = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const { items, meta } = await exercisesApi.list({
        search: search || undefined,
        categoryId: categoryFilter || undefined,
        page: pageNum,
        pageSize: 20,
      });
      const total = parseInt(meta.total, 10);
      const more = !isNaN(total)
        ? meta.page * meta.pageSize < total
        : items.length >= 20;

      if (append) setExercises((prev) => [...prev, ...items]);
      else setExercises(items);
      setHasMore(more);
      setPage(pageNum);
    } catch (err) {
      console.error('[AddExercise] fetch error:', err);
      if (!append) setExercises([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, categoryFilter]);

  // Debounced fetch on search/filter change
  useEffect(() => {
    const timer = setTimeout(() => fetchExercises(1), 300);
    return () => clearTimeout(timer);
  }, [fetchExercises]);

  // Infinite scroll — sentinel in page flow, root = viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore) {
          fetchExercises(page + 1, true);
        }
      },
      { rootMargin: '100px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, fetchExercises]);

  const handleAdd = async (exercise) => {
    setAddingId(exercise.id);
    await addExercise(id, {
      name: exercise.name,
      id: exercise.id,
      defaultSets: 3,
      defaultReps: 10,
    });
    setAddingId(null);
  };

  const handleCreateCustom = async () => {
    if (!customName.trim()) return;
    if (!customCategoryId) { setCreateError('Muscle group is required'); return; }
    if (!customEquipmentId) { setCreateError('Equipment is required'); return; }
    setCreateError('');
    setCreating(true);
    try {
      const instructions = customInstructions.trim()
        ? [customInstructions.trim()]
        : ['Perform with proper form and controlled movement.'];
      const created = await exercisesApi.create({
        name: customName.trim(),
        primaryMuscleId: Number(customCategoryId),
        equipmentId: Number(customEquipmentId),
        difficulty: customDifficulty,
        instructions,
      });
      if (created) {
        await addExercise(id, {
          name: created.name || customName.trim(),
          id: created.id,
          defaultSets: 3,
          defaultReps: 10,
        });
      }
      setShowCreate(false);
      setCustomName('');
      setCustomCategoryId('');
      setCustomEquipmentId('');
      setCustomDifficulty('Beginner');
      setCustomInstructions('');
      fetchExercises(1);
    } catch (err) {
      setCreateError(err.message || 'Failed to create exercise');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page">
      {/* Back */}
      <button
        onClick={() => navigate(`/routines/${id}`)}
        className="flex items-center gap-1.5 mb-5 text-sm transition-all duration-200"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={16} /> Back to Routine
      </button>

      <h1 className="text-2xl font-bold mb-4 animate-fade-in">Add Exercise</h1>

      {/* Search */}
      <div className="relative mb-3 animate-fade-in" style={{ animationDelay: '50ms' }}>
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises..."
          className="w-full !pl-11"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide animate-fade-in" style={{ animationDelay: '100ms' }}>
        <button
          onClick={() => setCategoryFilter('')}
          className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 border"
          style={!categoryFilter
            ? { backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderColor: 'var(--btn-primary-bg)' }
            : { backgroundColor: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-default)' }
          }
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id === categoryFilter ? '' : cat.id)}
            className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 border"
            style={categoryFilter === cat.id
              ? { backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderColor: 'var(--btn-primary-bg)' }
              : { backgroundColor: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-default)' }
            }
          >
            {cat.shortName || cat.displayName || cat.name}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-dim)' }} />
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-dim)' }}>
          <p className="text-sm">No exercises found</p>
        </div>
      ) : (
        <div className="space-y-3 mb-4 stagger">
          {exercises.map((ex) => {
            const added = existingNames.has(ex.name);
            const isAdding = addingId === ex.id;
            const muscle = categoryMap.get(String(ex.primaryMuscleId));
            const equip  = equipmentMap.get(String(ex.equipmentId));
            const muscleName = muscle?.shortName || muscle?.displayName || '';
            const equipName  = equip?.displayName  || equip?.name        || '';
            const diff = ex.difficulty
              ? ex.difficulty.charAt(0) + ex.difficulty.slice(1).toLowerCase()
              : '';
            return (
              <div key={ex.id} className="card flex items-center justify-between gap-3 animate-fade-in">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{ex.name}</p>
                  {(muscleName || equipName || diff) && (
                    <p className="text-xs mt-0.5 flex items-center gap-1 flex-wrap" style={{ color: 'var(--text-dim)' }}>
                      {muscleName && <span>{muscleName}</span>}
                      {muscleName && (equipName || diff) && <span style={{ color: 'var(--text-faint)' }}>&middot;</span>}
                      {equipName && <span>{equipName}</span>}
                      {equipName && diff && <span style={{ color: 'var(--text-faint)' }}>&middot;</span>}
                      {diff && <span>{diff}</span>}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => !added && !isAdding && handleAdd(ex)}
                  disabled={added || isAdding}
                  className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 border ${
                    added ? 'border-green-500/20 text-green-500/60' : ''
                  }`}
                  style={!added ? { borderColor: 'var(--border-default)', color: 'var(--text-secondary)' } : undefined}
                >
                  {added
                    ? <Check size={14} />
                    : isAdding
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Plus size={14} />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Infinite scroll sentinel — in page flow, triggers when scrolled into view */}
      <div ref={sentinelRef} className="flex items-center justify-center py-4">
        {loadingMore && (
          <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-dim)' }} />
        )}
      </div>

      {/* Create custom */}
      <button
        onClick={() => setShowCreate(true)}
        className="btn-secondary w-full flex items-center justify-center gap-2 mb-6"
      >
        <Plus size={14} /> Create Custom Exercise
      </button>

      <BottomSheet open={showCreate} onClose={() => setShowCreate(false)} title="Custom Exercise">
        <div className="space-y-5">
          <div>
            <label className="label block mb-2">Exercise Name *</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Cable Face Pull"
              className="w-full"
              autoFocus
            />
          </div>
          <div>
            <label className="label block mb-2">Muscle Group</label>
            <select value={customCategoryId} onChange={(e) => setCustomCategoryId(e.target.value)} className="w-full">
              <option value="">Select...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.displayName || cat.shortName || cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label block mb-2">Equipment</label>
            <select value={customEquipmentId} onChange={(e) => setCustomEquipmentId(e.target.value)} className="w-full">
              <option value="">Select...</option>
              {equipment.map((eq) => (
                <option key={eq.id} value={eq.id}>{eq.displayName || eq.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label block mb-2">Difficulty</label>
            <select value={customDifficulty} onChange={(e) => setCustomDifficulty(e.target.value)} className="w-full">
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="label block mb-2">Instructions</label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Optional instructions..."
              className="w-full"
              rows={3}
            />
          </div>
          {createError && <p className="text-sm text-red-400">{createError}</p>}
          <button
            onClick={handleCreateCustom}
            disabled={!customName.trim() || creating}
            className="btn-primary w-full disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {creating && <Loader2 size={14} className="animate-spin" />}
            Create & Add to Routine
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
