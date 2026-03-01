import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronDown, ChevronUp, FlaskConical } from 'lucide-react';
import { useMetricsStore } from '../stores/metricsStore';
import { METRIC_TYPES, METRIC_GROUPS, DEFAULT_GROUPS, ADVANCED_GROUPS } from '../lib/constants';
import { calculateBMI, getBMIStatus, calculateSMI, getMedicalStatus } from '../lib/bmi';
import MetricCard from '../components/MetricCard';

export default function Metrics() {
  const getLatest = useMetricsStore((s) => s.getLatest);
  const customMetricDefs = useMetricsStore((s) => s.customMetricDefs);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const weight = getLatest('weight');
  const height = getLatest('height');
  const smm = getLatest('smm');

  // Auto-calculated
  const bmi = calculateBMI(weight?.value, height?.value);
  const bmiStatus = getBMIStatus(bmi);
  const smi = calculateSMI(smm?.value, height?.value);

  // Check if user has any advanced data logged
  const hasAdvancedData = ADVANCED_GROUPS.some((gk) =>
    METRIC_GROUPS[gk].types.some((t) => getLatest(t) !== null)
  );

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Body Metrics</h1>
        <Link to="/metrics/log" className="btn-primary flex items-center gap-2 !py-2.5 !px-4 text-sm">
          <Plus size={14} /> Log
        </Link>
      </div>

      {/* Auto-Calculated Summary */}
      <div className="grid grid-cols-2 gap-3 mb-8 animate-fade-in" style={{ animationDelay: '50ms' }}>
        {/* BMI */}
        <div className={`card ${bmiStatus.bg}`}>
          <p className="label mb-2">BMI</p>
          <p className={`text-3xl font-bold ${bmiStatus.color}`}>
            {bmi ? bmi.toFixed(1) : '--'}
          </p>
          <p className={`text-xs mt-1 ${bmiStatus.color}`}>{bmiStatus.label}</p>
          <p className="text-[10px] text-neutral-700 mt-2">Auto-calculated</p>
        </div>
        {/* SMI */}
        <div className="card">
          <p className="label mb-2">SMI</p>
          <p className={`text-3xl font-bold ${smi ? 'text-white' : 'text-neutral-700'}`}>
            {smi ? smi.toFixed(1) : '--'}
          </p>
          <p className="text-xs text-neutral-600 mt-1">kg/m²</p>
          <p className="text-[10px] text-neutral-700 mt-2">{smi ? 'Auto: SMM ÷ height²' : 'Log SMM & height'}</p>
        </div>
      </div>

      {/* Default Groups */}
      {DEFAULT_GROUPS.map((groupKey, gi) => {
        const group = METRIC_GROUPS[groupKey];
        return (
          <div key={groupKey} className="mb-8 animate-fade-in" style={{ animationDelay: `${100 + gi * 40}ms` }}>
            <h2 className="section-title">{group.label}</h2>
            <div className="grid grid-cols-2 gap-3">
              {group.types.map((type) => {
                const meta = METRIC_TYPES[type];
                const latest = getLatest(type);
                return (
                  <MetricCard
                    key={type}
                    metricType={type}
                    label={meta.label}
                    value={latest?.value}
                    unit={meta.unit}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Advanced Toggle */}
      <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 w-full py-3 mb-4 text-neutral-500 hover:text-white transition-all duration-200"
        >
          <FlaskConical size={16} />
          <span className="text-sm font-medium">
            Medical & Blood Work {hasAdvancedData && '·'}
          </span>
          {hasAdvancedData && <span className="text-xs text-green-500/60">Has data</span>}
          <span className="ml-auto">
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>

        {showAdvanced && (
          <div className="animate-fade-in">
            {ADVANCED_GROUPS.map((groupKey, gi) => {
              const group = METRIC_GROUPS[groupKey];
              return (
                <div key={groupKey} className="mb-8" style={{ animationDelay: `${gi * 40}ms` }}>
                  <h2 className="section-title">{group.label}</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {group.types.map((type) => {
                      const meta = METRIC_TYPES[type];
                      const latest = getLatest(type);
                      const status = getMedicalStatus(type, latest?.value);
                      return (
                        <MetricCard
                          key={type}
                          metricType={type}
                          label={meta.label}
                          value={latest?.value}
                          unit={meta.unit}
                          accent={status?.color}
                          badge={status?.status}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Custom Metrics */}
            {customMetricDefs.length > 0 && (
              <div className="mb-8">
                <h2 className="section-title">Custom Metrics</h2>
                <div className="grid grid-cols-2 gap-3">
                  {customMetricDefs.map((def) => {
                    const latest = getLatest(def.key);
                    return (
                      <MetricCard
                        key={def.key}
                        metricType={def.key}
                        label={def.label}
                        value={latest?.value}
                        unit={def.unit}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
