import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Check, Loader2 } from 'lucide-react';
import { useRoutineStore } from '../stores/routineStore';
import { exercisesApi } from '../lib/api';
import BottomSheet from '../components/BottomSheet';

export default function AddExercise() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addExercise = useRoutineStore((s) => s.addExercise);
  const routine = useRoutineStore((s) => s.getRoutine(id));

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategoryId, setCustomCategoryId] = useState('');
  const [customEquipmentId, setCustomEquipmentId] = useState('');
  const [customDifficulty, setCustomDifficulty] = useState('Beginner');
  const [customInstructions, setCustomInstructions] = useState('');
  const [creating, setCreating] = useState(false);

  const existingNames = new Set(routine?.exercises.map((e) => e.exerciseName) || []);

  // Fetch categories + equipment on mount
  useEffect(() => {
    Promise.all([exercisesApi.getCategories(), exercisesApi.getEquipment()])
      .then(([cats, equip]) => {
        setCategories(Array.isArray(cats) ? cats : []);
        setEquipment(Array.isArray(equip) ? equip : []);
      })
      .catch(() => {});
  }, []);

  // Fetch exercises on mount + filter/search change
  const fetchExercises = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const data = await exercisesApi.list({
        search: search || undefined,
        categoryId: categoryFilter || undefined,
        page: pageNum,
        pageSize: 20,
      });
      // data may be { exercises: [], pagination: { hasMore } } or just an array
      const list = Array.isArray(data) ? data : data?.exercises || [];
      const more = Array.isArray(data) ? list.length === 20 : !!data?.pagination?.hasMore;

      if (append) {
        setExercises((prev) => [...prev, ...list]);
      } else {
        setExercises(list);
      }
      setHasMore(more);
      setPage(pageNum);
    } catch {
      if (!append) setExercises([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchExercises(1), 300);
    return () => clearTimeout(timer);
  }, [fetchExercises]);

  const handleAdd = (exercise) => {
    addExercise(id, {
      name: exercise.name,
      id: exercise.id,
      defaultSets: 3,
      defaultReps: 10,
    });
  };

  const handleCreateCustom = async () => {
    if (!customName.trim()) return;
    setCreating(true);
    try {
      const created = await exercisesApi.create({
        name: customName.trim(),
        primaryMuscleId: customCategoryId || undefined,
        equipmentId: customEquipmentId || undefined,
        difficulty: customDifficulty,
        instructions: customInstructions.trim() || undefined,
      });
      // Add to routine
      if (created) {
        addExercise(id, {
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
      // Refresh list
      fetchExercises(1);
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page">
      <button
        onClick={() => navigate(`/routines/${id}`)}
        className="flex items-center gap-1.5 text-neutral-500 hover:text-white mb-6 transition-all duration-200 text-sm"
      >
        <ArrowLeft size={16} /> Back to Routine
      </button>

      <h1 className="page-title animate-fade-in">Add Exercise</h1>

      {/* Search */}
      <div className="relative mb-4 animate-fade-in" style={{ animationDelay: '50ms' }}>
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises..."
          className="w-full !pl-11"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide animate-fade-in" style={{ animationDelay: '100ms' }}>
        <button
          onClick={() => setCategoryFilter('')}
          className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 border ${
            !categoryFilter
              ? 'bg-white text-black border-white'
              : 'bg-transparent text-neutral-500 border-neutral-800 hover:border-neutral-600'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id === categoryFilter ? '' : cat.id)}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 border ${
              categoryFilter === cat.id
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-neutral-500 border-neutral-800 hover:border-neutral-600'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Exercise List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-neutral-600" />
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6 stagger">
            {exercises.map((ex) => {
              const added = existingNames.has(ex.name);
              return (
                <div key={ex.id} className="card flex items-center justify-between animate-fade-in">
                  <div className="min-w-0">
                    <p className="font-medium">{ex.name}</p>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      {ex.primaryMuscle || ex.muscleGroup || ''}
                      {(ex.equipment || ex.equipmentName) && (
                        <>
                          <span className="mx-1.5 text-neutral-800">&middot;</span>
                          {ex.equipment || ex.equipmentName}
                        </>
                      )}
                      {ex.difficulty && (
                        <>
                          <span className="mx-1.5 text-neutral-800">&middot;</span>
                          {ex.difficulty}
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => !added && handleAdd(ex)}
                    disabled={added}
                    className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 border ${
                      added
                        ? 'border-green-500/20 text-green-500/60'
                        : 'border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    {added ? <Check size={14} /> : <Plus size={14} />}
                  </button>
                </div>
              );
            })}
            {exercises.length === 0 && (
              <div className="text-center py-10 text-neutral-600">
                <p>No exercises found</p>
              </div>
            )}
          </div>

          {/* Load More */}
          {hasMore && (
            <button
              onClick={() => fetchExercises(page + 1, true)}
              disabled={loadingMore}
              className="btn-secondary w-full flex items-center justify-center gap-2 mb-6"
            >
              {loadingMore ? <Loader2 size={14} className="animate-spin" /> : null}
              Load More
            </button>
          )}
        </>
      )}

      {/* Create Custom */}
      <button onClick={() => setShowCreate(true)} className="btn-secondary w-full flex items-center justify-center gap-2">
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
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label block mb-2">Equipment</label>
            <select value={customEquipmentId} onChange={(e) => setCustomEquipmentId(e.target.value)} className="w-full">
              <option value="">Select...</option>
              {equipment.map((eq) => (
                <option key={eq.id} value={eq.id}>{eq.name}</option>
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
