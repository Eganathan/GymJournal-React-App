import { useEffect, useState } from 'react';
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
  const fetchHistory = useMetricsStore((s) => s.fetchHistory);
  const fetchCustomDefs = useMetricsStore((s) => s.fetchCustomDefs);
  const deleteEntry = useMetricsStore((s) => s.deleteEntry);

  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Resolve metadata from built-in or custom
  const builtIn = METRIC_TYPES[metricType];
  const customDef = customDefs.find((d) => d.key === metricType);
  const meta = builtIn || (customDef ? { label: customDef.label, unit: customDef.unit } : null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchCustomDefs();
      await fetchHistory(metricType);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricType]);

  if (!meta && !loading) {
    return (
      <div className="page text-center py-20">
        <p style={{ color: 'var(--text-muted)' }}>Unknown metric type</p>
      </div>
    );
  }

  // Normalize history entries for display
  const entries = history.map((e) => ({
    ...e,
    value: Number(e.value),
    displayDate: e.logDate || e.date || e.createdAt?.slice(0, 10) || '',
  }));

  const latest = entries.length > 0 ? entries[entries.length - 1] : null;
  const change =
    entries.length >= 2
      ? entries[entries.length - 1].value - entries[entries.length - 2].value
      : null;
  const medicalStatus = getMedicalStatus(metricType, latest?.value);

  const handleDelete = async (id) => {
    setDeleting(true);
    await deleteEntry(id);
    setConfirmDeleteId(null);
    setDeleting(false);
    // Refresh history after delete
    fetchHistory(metricType);
  };

  return (
    <div className="page">
      <button
        onClick={() => navigate('/metrics')}
        className="flex items-center gap-1.5 mb-6 transition-all duration-200 text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={16} /> Metrics
      </button>

      <h1 className="page-title animate-fade-in">{meta?.label || metricType}</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-dim)' }} />
        </div>
      ) : (
        <>
          {/* Current Value */}
          <div className="card mb-5 animate-fade-in" style={{ animationDelay: '50ms' }}>
            <p className="label mb-2">Current</p>
            <div className="flex items-end gap-2">
              <span className={`text-4xl font-bold ${medicalStatus?.color || ''}`} style={!medicalStatus?.color ? { color: 'var(--text-primary)' } : undefined}>
                {latest ? latest.value.toFixed(1) : '--'}
              </span>
              <span className="mb-1" style={{ color: 'var(--text-dim)' }}>{meta?.unit}</span>
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
          {entries.length >= 2 && (
            <div className="card mb-5 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <p className="label mb-3">Trend</p>
              <MiniChart data={entries} />
            </div>
          )}

          {/* History */}
          <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
            <h2 className="section-title">History ({entries.length} entries)</h2>
            {entries.length === 0 ? (
              <div className="card text-center py-10">
                <p style={{ color: 'var(--text-dim)' }}>No entries yet</p>
              </div>
            ) : (
              <div className="space-y-3 stagger">
                {[...entries].reverse().map((entry) => {
                  const entryStatus = getMedicalStatus(metricType, entry.value);
                  const isConfirming = confirmDeleteId === entry.id;
                  return (
                    <div key={entry.id} className="card animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            <span className={entryStatus?.color || ''}>{entry.value.toFixed(1)}</span>
                            <span className="font-normal ml-1" style={{ color: 'var(--text-dim)' }}>{meta?.unit}</span>
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{entry.displayDate}</p>
                        </div>
                        {!isConfirming ? (
                          <button
                            onClick={() => setConfirmDeleteId(entry.id)}
                            className="text-xs text-red-500/60 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/5 transition-all duration-200"
                          >
                            Delete
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs px-2 py-1 rounded-lg transition-all duration-200"
                              style={{ color: 'var(--text-muted)' }}
                              disabled={deleting}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              disabled={deleting}
                              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all duration-200 flex items-center gap-1"
                            >
                              {deleting && <Loader2 size={10} className="animate-spin" />}
                              Confirm
                            </button>
                          </div>
                        )}
                      </div>
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
