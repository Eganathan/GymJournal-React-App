import { useNavigate } from 'react-router-dom';
import Sparkline from './Sparkline';

export default function MetricCard({ metricType, label, value, unit, accent, badge, trend }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/metrics/${metricType}`)}
      className="card text-left w-full group"
    >
      <p className="label mb-2">{label}</p>
      {value != null ? (
        <>
          <div className="flex items-end justify-between gap-1">
            <p className={`text-2xl font-bold ${accent || 'text-[var(--text-primary)]'}`}>
              {typeof value === 'number' ? value.toFixed(1) : value}
              <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-dim)' }}>{unit}</span>
            </p>
            {trend && trend.length >= 2 && (
              <Sparkline data={trend} />
            )}
          </div>
          {badge && (
            <p className={`text-[10px] mt-1.5 ${accent || ''}`} style={!accent ? { color: 'var(--text-muted)' } : undefined}>{badge}</p>
          )}
        </>
      ) : (
        <p className="text-2xl font-bold" style={{ color: 'var(--text-faint)' }}>--</p>
      )}
    </button>
  );
}
