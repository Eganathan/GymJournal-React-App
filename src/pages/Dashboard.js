import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Plus, ChevronRight, Activity } from 'lucide-react';
import { useRoutineStore } from '../stores/routineStore';
import { useMetricsStore } from '../stores/metricsStore';
import { getBMIStatus } from '../lib/bmi';

export default function Dashboard() {
  const routines = useRoutineStore((s) => s.routines);
  const snapshot = useMetricsStore((s) => s.snapshot) || {};
  const fetchSnapshot = useMetricsStore((s) => s.fetchSnapshot);

  useEffect(() => {
    // Only fetch if snapshot is empty (not yet loaded)
    if (Object.keys(snapshot).length === 0) {
      fetchSnapshot();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weight = snapshot.weight?.value ?? null;
  const bmi = snapshot.bmi?.value ?? null;
  const bodyFat = snapshot.bodyFat?.value ?? null;
  const bmiStatus = getBMIStatus(bmi);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const recentRoutines = routines.slice(0, 3);

  return (
    <div className="page">
      {/* Greeting */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold">{greeting}</h1>
        <p className="text-neutral-500 mt-1">Let's crush it today.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-10 animate-fade-in" style={{ animationDelay: '50ms' }}>
        <Link to="/routines/new" className="btn-primary flex items-center justify-center gap-2 text-sm !py-3.5">
          <Plus size={16} /> New Routine
        </Link>
        <Link to="/metrics/log" className="btn-secondary flex items-center justify-center gap-2 text-sm !py-3.5">
          <Activity size={16} /> Log Metrics
        </Link>
      </div>

      {/* Body Snapshot */}
      <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
        <h2 className="section-title">Body Snapshot</h2>
        <div className="grid grid-cols-3 gap-3 mb-10">
          <div className="card text-center">
            <p className="label mb-2">Weight</p>
            <p className="text-2xl font-bold">{weight != null ? weight : '--'}</p>
            <p className="text-xs text-neutral-600 mt-1">kg</p>
          </div>
          <div className="card text-center">
            <p className="label mb-2">BMI</p>
            <p className={`text-2xl font-bold ${bmiStatus.color}`}>{bmi != null ? Number(bmi).toFixed(1) : '--'}</p>
            <p className={`text-xs mt-1 ${bmiStatus.color}`}>{bmiStatus.label}</p>
          </div>
          <div className="card text-center">
            <p className="label mb-2">Body Fat</p>
            <p className="text-2xl font-bold">{bodyFat != null ? bodyFat : '--'}</p>
            <p className="text-xs text-neutral-600 mt-1">%</p>
          </div>
        </div>
      </div>

      {/* Recent Routines */}
      <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Routines</h2>
          <Link to="/routines" className="text-sm text-neutral-500 hover:text-white transition-colors duration-200">
            View all &rarr;
          </Link>
        </div>

        {recentRoutines.length === 0 ? (
          <div className="card text-center py-10">
            <Dumbbell size={32} className="mx-auto text-neutral-700 mb-3" />
            <p className="text-neutral-500 mb-1">No routines yet</p>
            <Link to="/routines/new" className="text-sm text-neutral-400 hover:text-white transition-colors duration-200">
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
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {r.exercises.length} exercise{r.exercises.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <ChevronRight size={16} className="text-neutral-700 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
