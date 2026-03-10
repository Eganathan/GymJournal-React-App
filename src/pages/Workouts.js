import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, ChevronRight, Loader2, Plus, Clock, Play, Zap, Trash2 } from 'lucide-react';
import { useWorkoutStore } from '../stores/workoutStore';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatRelativeDateTime, formatDuration } from '../lib/dateUtils';

const PERIODS = [
  { key: 'all', label: 'All' },
  { key: 'month', label: 'This Month' },
  { key: 'week', label: 'This Week' },
];

function getPeriodDates(period) {
  const today = new Date();
  const toYMD = (d) => d.toISOString().slice(0, 10);
  if (period === 'week') {
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1)); // Monday
    return { startDate: toYMD(start), endDate: toYMD(today) };
  }
  if (period === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: toYMD(start), endDate: toYMD(today) };
  }
  return {};
}

const STATUS_BADGE = {
  IN_PROGRESS: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'In Progress' },
  COMPLETED: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Completed' },
  CANCELLED: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Cancelled' },
};

export default function Workouts() {
  const navigate = useNavigate();
  const sessions = useWorkoutStore((s) => s.sessions);
  const isLoading = useWorkoutStore((s) => s.isLoading);
  const hasMore = useWorkoutStore((s) => s.hasMore);
  const fetchSessions = useWorkoutStore((s) => s.fetchSessions);
  const loadMoreSessions = useWorkoutStore((s) => s.loadMoreSessions);
  const deleteWorkout = useWorkoutStore((s) => s.deleteWorkout);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const [startingEmpty, setStartingEmpty] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    fetchSessions(getPeriodDates(period), true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const handleQuickStart = async () => {
    setStartingEmpty(true);
    const session = await startWorkout({});
    if (session) navigate(`/workouts/${session.id}`);
    setStartingEmpty(false);
  };

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

      <div className="flex items-center justify-between mb-4 animate-fade-in">
        <h1 className="text-2xl font-bold">Workouts</h1>
        <Link to="/routines" className="btn-primary flex items-center gap-2 !py-2.5 !px-4 text-sm">
          <Plus size={14} /> From Routine
        </Link>
      </div>

      {/* Period filter chips */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide animate-fade-in" style={{ animationDelay: '20ms' }}>
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border"
            style={period === p.key
              ? { backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderColor: 'var(--btn-primary-bg)' }
              : { backgroundColor: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-default)' }
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Quick start empty workout */}
      <button
        onClick={handleQuickStart}
        disabled={startingEmpty}
        className="w-full card flex items-center gap-3 mb-6 animate-fade-in text-left hover:border-[var(--border-default)] transition-all duration-200"
        style={{ animationDelay: '30ms', borderStyle: 'dashed' }}
      >
        {startingEmpty ? (
          <Loader2 size={18} className="shrink-0 animate-spin" style={{ color: 'var(--text-dim)' }} />
        ) : (
          <Zap size={18} className="shrink-0" style={{ color: 'var(--text-dim)' }} />
        )}
        <div>
          <p className="font-medium text-sm">Quick Start</p>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Start an empty workout — add exercises as you go</p>
        </div>
      </button>

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
        <>
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
                    <span>{formatRelativeDateTime(session.startedAt || session.createdAt)}</span>
                    {session.startedAt && (
                      <>
                        <span style={{ color: 'var(--text-faint)' }}>&middot;</span>
                        <span className="flex items-center gap-0.5">
                          <Clock size={10} />
                          {formatDuration(session.startedAt, session.completedAt)}
                        </span>
                      </>
                    )}
                    {session.exerciseCount != null && session.exerciseCount > 0 && (
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
                      onClick={() => setDeleteTarget(session)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500/40 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  <Link to={`/workouts/${session.id}`} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200" style={{ color: 'var(--text-faint)' }}>
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        {hasMore && (
          <button
            onClick={loadMoreSessions}
            disabled={isLoading}
            className="w-full py-3 mt-2 text-sm transition-all duration-200 flex items-center justify-center gap-2"
            style={{ color: 'var(--text-muted)' }}
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
            Load more
          </button>
        )}
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete workout?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={async () => { await deleteWorkout(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
