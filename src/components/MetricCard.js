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
            <p className={`text-2xl font-bold ${accent || 'text-white'}`}>
              {typeof value === 'number' ? value.toFixed(1) : value}
              <span className="text-sm font-normal text-neutral-600 ml-1">{unit}</span>
            </p>
            {trend && trend.length >= 2 && (
              <Sparkline data={trend} />
            )}
          </div>
          {badge && (
            <p className={`text-[10px] mt-1.5 ${accent || 'text-neutral-500'}`}>{badge}</p>
          )}
        </>
      ) : (
        <p className="text-2xl text-neutral-700 font-bold">--</p>
      )}
    </button>
  );
}
