import { Link } from 'react-router-dom';
import { Plus, Dumbbell, ChevronRight } from 'lucide-react';
import { useRoutineStore } from '../stores/routineStore';

export default function Routines() {
  const routines = useRoutineStore((s) => s.routines);
  const deleteRoutine = useRoutineStore((s) => s.deleteRoutine);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Routines</h1>
        <Link to="/routines/new" className="btn-primary flex items-center gap-2 !py-2.5 !px-4 text-sm">
          <Plus size={14} /> New
        </Link>
      </div>

      {routines.length === 0 ? (
        <div className="card text-center py-14 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <Dumbbell size={40} className="mx-auto text-neutral-800 mb-4" />
          <p className="text-neutral-400 text-lg mb-1">No routines yet</p>
          <p className="text-neutral-600 text-sm mb-6">Create your first workout routine to get started</p>
          <Link to="/routines/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={14} /> Create Routine
          </Link>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {routines.map((r) => (
            <div key={r.id} className="card flex items-center gap-3 animate-fade-in">
              <Link to={`/routines/${r.id}`} className="flex-1 min-w-0">
                <p className="font-semibold truncate">{r.name}</p>
                {r.description && <p className="text-sm text-neutral-600 truncate mt-0.5">{r.description}</p>}
                <p className="text-xs text-neutral-600 mt-1.5">
                  {r.exercises.length} exercise{r.exercises.length !== 1 ? 's' : ''}
                  <span className="mx-1.5 text-neutral-800">&middot;</span>
                  {new Date(r.updatedAt).toLocaleDateString()}
                </p>
              </Link>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => { if (window.confirm('Delete this routine?')) deleteRoutine(r.id); }}
                  className="text-xs text-red-500/60 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/5 transition-all duration-200"
                >
                  Delete
                </button>
                <Link to={`/routines/${r.id}`}>
                  <ChevronRight size={16} className="text-neutral-700" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
