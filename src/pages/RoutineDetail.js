import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Dumbbell } from 'lucide-react';
import { useRoutineStore } from '../stores/routineStore';
import ExerciseCard from '../components/ExerciseCard';

export default function RoutineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const routine = useRoutineStore((s) => s.getRoutine(id));
  const updateExercise = useRoutineStore((s) => s.updateExercise);
  const removeExercise = useRoutineStore((s) => s.removeExercise);
  const reorderExercises = useRoutineStore((s) => s.reorderExercises);

  if (!routine) {
    return (
      <div className="page text-center py-20">
        <p className="text-neutral-500">Routine not found</p>
        <Link to="/routines" className="text-sm text-neutral-400 hover:text-white transition-colors duration-200 mt-2 inline-block">
          Go to Routines &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <button
        onClick={() => navigate('/routines')}
        className="flex items-center gap-1.5 text-neutral-500 hover:text-white mb-6 transition-all duration-200 text-sm"
      >
        <ArrowLeft size={16} /> Routines
      </button>

      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold">{routine.name}</h1>
        {routine.description && <p className="text-neutral-500 text-sm mt-1">{routine.description}</p>}
        <p className="text-xs text-neutral-600 mt-2">
          {routine.exercises.length} exercise{routine.exercises.length !== 1 ? 's' : ''}
        </p>
      </div>

      {routine.exercises.length === 0 ? (
        <div className="card text-center py-12 mb-6 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <Dumbbell size={36} className="mx-auto text-neutral-800 mb-3" />
          <p className="text-neutral-500 mb-1">No exercises yet</p>
          <p className="text-neutral-600 text-sm">Add exercises from the library below</p>
        </div>
      ) : (
        <div className="mb-6 stagger">
          {routine.exercises
            .sort((a, b) => a.position - b.position)
            .map((ex, i) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                isFirst={i === 0}
                isLast={i === routine.exercises.length - 1}
                onUpdate={(updates) => updateExercise(id, ex.id, updates)}
                onRemove={() => {
                  if (window.confirm(`Remove ${ex.exerciseName}?`)) removeExercise(id, ex.id);
                }}
                onMoveUp={() => i > 0 && reorderExercises(id, i, i - 1)}
                onMoveDown={() => i < routine.exercises.length - 1 && reorderExercises(id, i, i + 1)}
              />
            ))}
        </div>
      )}

      <Link
        to={`/routines/${id}/add-exercise`}
        className="btn-secondary w-full flex items-center justify-center gap-2"
      >
        <Plus size={16} /> Add Exercise
      </Link>
    </div>
  );
}
