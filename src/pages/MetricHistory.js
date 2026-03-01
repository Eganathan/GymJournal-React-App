import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useMetricsStore } from '../stores/metricsStore';
import { METRIC_TYPES } from '../lib/constants';
import { getMedicalStatus } from '../lib/bmi';
import MiniChart from '../components/MiniChart';

export default function MetricHistory() {
  const { metricType } = useParams();
  const navigate = useNavigate();

  const history = useMetricsStore((s) => s.history[metricType] || []);
  const customDefs = useMetricsStore((s) => s.customDefs);
  const isLoading = useMetricsStore((s) => s.isLoading);
  const fetchHistory = useMetricsStore((s) => s.fetchHistory);
  const deleteEntry = useMetricsStore((s) => s.deleteEntry);

  // Resolve metadata from built-in or custom
  const builtIn = METRIC_TYPES[metricType];
  const customDef = customDefs.find((d) => d.key === metricType);
  const meta = builtIn || (customDef ? { label: customDef.label, unit: customDef.unit } : null);

  useEffect(() => {
    fetchHistory(metricType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricType]);

  if (!meta) {
    return (
      <div className="page text-center py-20">
        <p className="text-neutral-500">Unknown metric type</p>
      </div>
    );
  }

  const latest = history.length > 0 ? history[history.length - 1] : null;
  const change =
    history.length >= 2
      ? history[history.length - 1].value - history[history.length - 2].value
      : null;
  const medicalStatus = getMedicalStatus(metricType, latest?.value);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    await deleteEntry(id);
    // Refresh history after delete
    fetchHistory(metricType);
  };

  return (
    <div className="page">
      <button
        onClick={() => navigate('/metrics')}
        className="flex items-center gap-1.5 text-neutral-500 hover:text-white mb-6 transition-all duration-200 text-sm"
      >
        <ArrowLeft size={16} /> Metrics
      </button>

      <h1 className="page-title animate-fade-in">{meta.label}</h1>

      {isLoading && history.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-neutral-600" />
        </div>
      ) : (
        <>
          {/* Current Value */}
          <div className="card mb-5 animate-fade-in" style={{ animationDelay: '50ms' }}>
            <p className="label mb-2">Current</p>
            <div className="flex items-end gap-2">
              <span className={`text-4xl font-bold ${medicalStatus?.color || 'text-white'}`}>
                {latest ? Number(latest.value).toFixed(1) : '--'}
              </span>
              <span className="text-neutral-600 mb-1">{meta.unit}</span>
              {change != null && (
                <span className={`text-sm mb-1 ml-auto ${change >= 0 ? 'text-green-500/80' : 'text-red-500/80'}`}>
                  {change >= 0 ? '+' : ''}{change.toFixed(1)}
                </span>
              )}
            </div>
            {medicalStatus && (
              <p className={`text-xs mt-2 ${medicalStatus.color}`}>{medicalStatus.status}</p>
            )}
          </div>

          {/* Chart */}
          {history.length >= 2 && (
            <div className="card mb-5 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <p className="label mb-3">Trend</p>
              <MiniChart data={history} />
            </div>
          )}

          {/* History */}
          <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
            <h2 className="section-title">History</h2>
            {history.length === 0 ? (
              <div className="card text-center py-10">
                <p className="text-neutral-600">No entries yet</p>
              </div>
            ) : (
              <div className="space-y-3 stagger">
                {[...history].reverse().map((entry) => {
                  const entryStatus = getMedicalStatus(metricType, entry.value);
                  const displayDate = entry.logDate || entry.date || '';
                  return (
                    <div key={entry.id} className="card flex items-center justify-between animate-fade-in">
                      <div>
                        <p className="font-semibold">
                          <span className={entryStatus?.color || ''}>{Number(entry.value).toFixed(1)}</span>
                          <span className="text-neutral-600 font-normal ml-1">{meta.unit}</span>
                        </p>
                        <p className="text-xs text-neutral-600 mt-0.5">{displayDate}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-xs text-red-500/60 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/5 transition-all duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
