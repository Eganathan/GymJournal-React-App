import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, ChevronRight, Loader2, Plus, Clock, Play } from 'lucide-react';
import { useWorkoutStore } from '../stores/workoutStore';

const STATUS_BADGE = {
  IN_PROGRESS: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'In Progress' },
  COMPLETED: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Completed' },
  CANCELLED: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Cancelled' },
};

function formatDuration(startedAt, completedAt) {
  if (!startedAt) return '';
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const mins = Math.floor((end - start) / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

export default function Workouts() {
  const sessions = useWorkoutStore((s) => s.sessions);
  const isLoading = useWorkoutStore((s) => s.isLoading);
  const fetchSessions = useWorkoutStore((s) => s.fetchSessions);
  const deleteWorkout = useWorkoutStore((s) => s.deleteWorkout);

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeWorkout = sessions.find((s) => s.status === 'IN_PROGRESS');

  return (
    <div className="page">
      {/* Active workout banner */}
      {activeWorkout && (
        <Link
          to={`/workouts/${activeWorkout.id}`}
          className="card flex items-center gap-3 mb-6 animate-fade-in"
          style={{ borderColor: 'rgba(245, 158, 11, 0.3)', backgroundColor: 'rgba(245, 158, 11, 0.05)' }}
        >
          <Play size={18} className="text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-amber-500">Active Workout</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {activeWorkout.name || 'Workout'} — {formatDuration(activeWorkout.startedAt)}
            </p>
          </div>
          <span className="text-xs font-medium text-amber-500">Resume &rarr;</span>
        </Link>
      )}

      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Workouts</h1>
        <Link to="/routines" className="btn-primary flex items-center gap-2 !py-2.5 !px-4 text-sm">
          <Plus size={14} /> New
        </Link>
      </div>

      {isLoading && sessions.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-dim)' }} />
        </div>
      ) : sessions.length === 0 ? (
        <div className="card text-center py-14 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <Dumbbell size={40} className="mx-auto mb-4" style={{ color: 'var(--text-faint)' }} />
          <p className="text-lg mb-1" style={{ color: 'var(--text-secondary)' }}>No workouts yet</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>Pick a routine to start your first workout</p>
          <Link to="/routines" className="btn-primary inline-flex items-center gap-2">
            <Dumbbell size={14} /> Browse Routines
          </Link>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {sessions.map((session) => {
            const badge = STATUS_BADGE[session.status] || STATUS_BADGE.COMPLETED;
            const isActive = session.status === 'IN_PROGRESS';
            return (
              <div key={session.id} className="card flex items-center gap-3 animate-fade-in">
                <Link to={`/workouts/${session.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold truncate">{session.name || 'Workout'}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs flex items-center gap-2" style={{ color: 'var(--text-dim)' }}>
                    <span>{new Date(session.startedAt || session.createdAt).toLocaleDateString()}</span>
                    {session.startedAt && (
                      <>
                        <span style={{ color: 'var(--text-faint)' }}>&middot;</span>
                        <span className="flex items-center gap-0.5">
                          <Clock size={10} />
                          {formatDuration(session.startedAt, session.completedAt)}
                        </span>
                      </>
                    )}
                    {session.exerciseCount != null && (
                      <>
                        <span style={{ color: 'var(--text-faint)' }}>&middot;</span>
                        <span>{session.exerciseCount} exercises</span>
                      </>
                    )}
                  </p>
                </Link>
                <div className="flex items-center gap-1 shrink-0">
                  {!isActive && (
                    <button
                      onClick={() => { if (window.confirm('Delete this workout?')) deleteWorkout(session.id); }}
                      className="text-xs text-red-500/60 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/5 transition-all duration-200"
                    >
                      Delete
                    </button>
                  )}
                  <Link to={`/workouts/${session.id}`}>
                    <ChevronRight size={16} style={{ color: 'var(--text-faint)' }} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
