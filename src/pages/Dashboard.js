import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, ChevronRight, Activity, Play, Clock, Droplets } from 'lucide-react';
import { useRoutineStore } from '../stores/routineStore';
import { useWorkoutStore } from '../stores/workoutStore';
import { useMetricsStore } from '../stores/metricsStore';
import { useWaterStore } from '../stores/waterStore';
import { getBMIStatus } from '../lib/bmi';
import { formatRelativeDateTime, formatDuration } from '../lib/dateUtils';

function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

const INSIGHT_DOT = {
  OK: 'bg-green-400',
  BORDERLINE: 'bg-amber-400',
  WARNING: 'bg-orange-400',
  DANGER: 'bg-red-400',
};

export default function Dashboard() {
  const routines = useRoutineStore((s) => s.routines);
  const routinesLoading = useRoutineStore((s) => s.isLoading);
  const fetchRoutines = useRoutineStore((s) => s.fetchRoutines);
  const sessions = useWorkoutStore((s) => s.sessions);
  const workoutsLoading = useWorkoutStore((s) => s.isLoading);
  const fetchSessions = useWorkoutStore((s) => s.fetchSessions);
  const snapshot = useMetricsStore((s) => s.snapshot) || {};
  const metricsLoading = useMetricsStore((s) => s.isLoading);
  const insights = useMetricsStore((s) => s.insights);
  const fetchSnapshot = useMetricsStore((s) => s.fetchSnapshot);
  const fetchInsights = useMetricsStore((s) => s.fetchInsights);
  const waterTotal = useWaterStore((s) => s.totalMl);
  const waterGoal = useWaterStore((s) => s.goalMl);
  const waterProgress = useWaterStore((s) => s.progressPercent);
  const waterLoading = useWaterStore((s) => s.isLoading);
  const fetchWaterToday = useWaterStore((s) => s.fetchToday);

  useEffect(() => {
    fetchRoutines();
    fetchSessions({ pageSize: 5 });
    if (Object.keys(snapshot).length === 0) {
      fetchSnapshot();
    }
    fetchInsights();
    fetchWaterToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weight = snapshot.weight?.value ?? null;
  const bmi = snapshot.bmi?.value ?? null;
  const bodyFat = snapshot.bodyFat?.value ?? null;
  const bmiStatus = getBMIStatus(bmi);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const recentRoutines = routines.slice(0, 3);
  const recentWorkouts = sessions.filter((s) => s.status === 'COMPLETED').slice(0, 3);
  const activeWorkout = sessions.find((s) => s.status === 'IN_PROGRESS');
  const alertInsights = (insights || []).filter((i) => i.status !== 'OK').slice(0, 3);

  // Workouts this week (Mon–Sun)
  const startOfWeek = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return d;
  })();
  const workoutsThisWeek = sessions.filter(
    (s) => s.status === 'COMPLETED' && new Date(s.completedAt || s.startedAt) >= startOfWeek
  ).length;

  return (
    <div className="page">
      {/* Greeting */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold">{greeting}</h1>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Let's crush it today.</p>
      </div>

      {/* Active Workout Banner */}
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-10 animate-fade-in" style={{ animationDelay: '50ms' }}>
        <Link to="/routines" className="btn-primary flex items-center justify-center gap-2 text-sm !py-3.5">
          <Play size={16} /> Start Workout
        </Link>
        <Link to="/metrics/log" className="btn-secondary flex items-center justify-center gap-2 text-sm !py-3.5">
          <Activity size={16} /> Log Metrics
        </Link>
      </div>

      {/* This week */}
      <div className="grid grid-cols-3 gap-3 mb-10 animate-fade-in" style={{ animationDelay: '80ms' }}>
        <div className="card text-center !py-4">
          <p className="text-2xl font-bold">{workoutsThisWeek}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>This week</p>
        </div>
        <div className="card text-center !py-4">
          <p className="text-2xl font-bold">{waterProgress ?? 0}<span className="text-sm font-normal">%</span></p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Hydration</p>
        </div>
        <div className="card text-center !py-4">
          <p className="text-2xl font-bold">{weight != null ? Number(weight).toFixed(1) : '--'}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Weight kg</p>
        </div>
      </div>

      {/* Body Snapshot */}
      <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
        <h2 className="section-title">Body Snapshot</h2>
        <div className="grid grid-cols-3 gap-3 mb-10">
          {metricsLoading && Object.keys(snapshot).length === 0 ? (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} className="card text-center">
                  <Skeleton className="h-3 w-12 mx-auto mb-3" />
                  <Skeleton className="h-7 w-16 mx-auto mb-2" />
                  <Skeleton className="h-3 w-8 mx-auto" />
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="card text-center">
                <p className="label mb-2">Weight</p>
                <p className="text-2xl font-bold">{weight != null ? weight : '--'}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>kg</p>
              </div>
              <div className="card text-center">
                <p className="label mb-2">BMI</p>
                <p className={`text-2xl font-bold ${bmiStatus.color}`}>{bmi != null ? Number(bmi).toFixed(1) : '--'}</p>
                <p className={`text-xs mt-1 ${bmiStatus.color}`}>{bmiStatus.label}</p>
              </div>
              <div className="card text-center">
                <p className="label mb-2">Body Fat</p>
                <p className="text-2xl font-bold">{bodyFat != null ? bodyFat : '--'}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>%</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Water Intake */}
      {waterLoading && waterTotal === 0 ? (
        <div className="card flex items-center gap-4 mb-10 animate-fade-in" style={{ animationDelay: '110ms' }}>
          <Skeleton className="w-12 h-12 !rounded-full shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-10" />
        </div>
      ) : (
        <Link to="/water" className="card flex items-center gap-4 mb-10 animate-fade-in" style={{ animationDelay: '110ms' }}>
          <div className="relative w-12 h-12 shrink-0">
            <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--border-default)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.5" fill="none"
                stroke="rgb(96, 165, 250)" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${(waterProgress / 100) * 97.4} 97.4`}
              />
            </svg>
            <Droplets size={14} className="absolute inset-0 m-auto text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Hydration</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {waterTotal >= 1000 ? `${(waterTotal / 1000).toFixed(1)}L` : `${waterTotal}ml`} / {waterGoal >= 1000 ? `${(waterGoal / 1000).toFixed(1)}L` : `${waterGoal}ml`}
            </p>
          </div>
          <span className="text-lg font-bold text-blue-400">{waterProgress}%</span>
        </Link>
      )}

      {/* Compact Insights */}
      {alertInsights.length > 0 && (
        <div className="mb-10 animate-fade-in" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title mb-0">Insights</h2>
            <Link to="/metrics" className="text-xs transition-colors duration-200" style={{ color: 'var(--text-muted)' }}>
              View all &rarr;
            </Link>
          </div>
          <div className="space-y-2">
            {alertInsights.map((insight, i) => (
              <div key={i} className="card !py-3 flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${INSIGHT_DOT[insight.status] || INSIGHT_DOT.OK}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{insight.metricLabel || insight.metricType}</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{insight.message}</p>
                </div>
                <span className="text-[10px] uppercase shrink-0" style={{ color: 'var(--text-dim)' }}>{insight.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Workouts */}
      {workoutsLoading && sessions.length === 0 ? (
        <div className="mb-10 animate-fade-in" style={{ animationDelay: '140ms' }}>
          <h2 className="section-title">Recent Workouts</h2>
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="card flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-4 !rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ) : recentWorkouts.length > 0 && (
        <div className="mb-10 animate-fade-in" style={{ animationDelay: '140ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Recent Workouts</h2>
            <Link to="/workouts" className="text-sm transition-colors duration-200" style={{ color: 'var(--text-muted)' }}>
              View all &rarr;
            </Link>
          </div>
          <div className="space-y-3 stagger">
            {recentWorkouts.map((session) => (
              <Link
                key={session.id}
                to={`/workouts/${session.id}`}
                className="card flex items-center justify-between animate-fade-in"
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate">{session.name || 'Workout'}</p>
                  <p className="text-xs mt-0.5 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <span>{formatRelativeDateTime(session.startedAt || session.createdAt)}</span>
                    {session.startedAt && (
                      <>
                        <span style={{ color: 'var(--text-faint)' }}>&middot;</span>
                        <span className="flex items-center gap-0.5">
                          <Clock size={10} /> {formatDuration(session.startedAt, session.completedAt)}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0" style={{ color: 'var(--text-faint)' }} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Routines */}
      <div className="animate-fade-in" style={{ animationDelay: '160ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Routines</h2>
          <Link to="/routines" className="text-sm transition-colors duration-200" style={{ color: 'var(--text-muted)' }}>
            View all &rarr;
          </Link>
        </div>

        {routinesLoading && routines.length === 0 ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-4 w-36 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-4 !rounded-full" />
              </div>
            ))}
          </div>
        ) : recentRoutines.length === 0 ? (
          <div className="card text-center py-10">
            <Dumbbell size={32} className="mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
            <p className="mb-1" style={{ color: 'var(--text-muted)' }}>No routines yet</p>
            <Link to="/routines/new" className="text-sm transition-colors duration-200" style={{ color: 'var(--text-secondary)' }}>
              Create your first routine &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-3 stagger">
            {recentRoutines.map((r) => (
              <Link
                key={r.id}
                to={`/routines/${r.id}`}
                className="card flex items-center justify-between animate-fade-in"
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate">{r.name}</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {r.itemCount ?? 0} exercise{(r.itemCount ?? 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0" style={{ color: 'var(--text-faint)' }} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
