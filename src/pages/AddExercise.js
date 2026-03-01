import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Check } from 'lucide-react';
import { useRoutineStore } from '../stores/routineStore';
import { MOCK_EXERCISES, MUSCLE_GROUPS } from '../lib/constants';
import BottomSheet from '../components/BottomSheet';

export default function AddExercise() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addExercise = useRoutineStore((s) => s.addExercise);
  const routine = useRoutineStore((s) => s.getRoutine(id));

  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState('');

  const existingNames = new Set(routine?.exercises.map((e) => e.exerciseName) || []);

  const filtered = MOCK_EXERCISES.filter((ex) => {
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (muscleFilter && ex.muscleGroup !== muscleFilter) return false;
    return true;
  });

  const handleAdd = (exercise) => {
    addExercise(id, exercise);
  };

  const handleCreateCustom = () => {
    if (!customName.trim()) return;
    addExercise(id, { name: customName.trim(), id: null, defaultSets: 3, defaultReps: 10 });
    setShowCreate(false);
    setCustomName('');
    setCustomMuscle('');
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

      {/* Muscle Group Filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide animate-fade-in" style={{ animationDelay: '100ms' }}>
        <button
          onClick={() => setMuscleFilter('')}
          className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 border ${
            !muscleFilter
              ? 'bg-white text-black border-white'
              : 'bg-transparent text-neutral-500 border-neutral-800 hover:border-neutral-600'
          }`}
        >
          All
        </button>
        {MUSCLE_GROUPS.map((mg) => (
          <button
            key={mg}
            onClick={() => setMuscleFilter(mg === muscleFilter ? '' : mg)}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 border ${
              muscleFilter === mg
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-neutral-500 border-neutral-800 hover:border-neutral-600'
            }`}
          >
            {mg}
          </button>
        ))}
      </div>

      {/* Exercise List */}
      <div className="space-y-3 mb-6 stagger">
        {filtered.map((ex) => {
          const added = existingNames.has(ex.name);
          return (
            <div key={ex.id} className="card flex items-center justify-between animate-fade-in">
              <div className="min-w-0">
                <p className="font-medium">{ex.name}</p>
                <p className="text-xs text-neutral-600 mt-0.5">
                  {ex.muscleGroup}
                  <span className="mx-1.5 text-neutral-800">&middot;</span>
                  {ex.equipment}
                  <span className="mx-1.5 text-neutral-800">&middot;</span>
                  {ex.difficulty}
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
        {filtered.length === 0 && (
          <div className="text-center py-10 text-neutral-600">
            <p>No exercises found</p>
          </div>
        )}
      </div>

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
            <select value={customMuscle} onChange={(e) => setCustomMuscle(e.target.value)} className="w-full">
              <option value="">Select...</option>
              {MUSCLE_GROUPS.map((mg) => (
                <option key={mg} value={mg}>{mg}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCreateCustom}
            disabled={!customName.trim()}
            className="btn-primary w-full disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Add to Routine
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
