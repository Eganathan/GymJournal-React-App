import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronDown, ChevronUp, FlaskConical, AlertTriangle, Loader2 } from 'lucide-react';
import { useMetricsStore } from '../stores/metricsStore';
import { METRIC_TYPES, METRIC_GROUPS, DEFAULT_GROUPS, ADVANCED_GROUPS } from '../lib/constants';
import { getBMIStatus, getMedicalStatus } from '../lib/bmi';
import MetricCard from '../components/MetricCard';

const INSIGHT_COLORS = {
  OK: 'text-green-400 border-green-500/20',
  BORDERLINE: 'text-amber-400 border-amber-500/20',
  WARNING: 'text-orange-400 border-orange-500/20',
  DANGER: 'text-red-400 border-red-500/20',
};

export default function Metrics() {
  const snapshot = useMetricsStore((s) => s.snapshot);
  const insights = useMetricsStore((s) => s.insights);
  const customDefs = useMetricsStore((s) => s.customDefs);
  const isLoading = useMetricsStore((s) => s.isLoading);
  const error = useMetricsStore((s) => s.error);
  const fetchSnapshot = useMetricsStore((s) => s.fetchSnapshot);
  const fetchInsights = useMetricsStore((s) => s.fetchInsights);
  const fetchCustomDefs = useMetricsStore((s) => s.fetchCustomDefs);

  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetchSnapshot();
    fetchInsights();
    fetchCustomDefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snap = snapshot || {};
  const getVal = (type) => snap[type]?.value ?? null;

  // BMI & SMI from server snapshot
  const bmi = getVal('bmi');
  const bmiStatus = getBMIStatus(bmi);
  const smi = getVal('smiComputed');

  // Check if user has any advanced data logged
  const hasAdvancedData = ADVANCED_GROUPS.some((gk) =>
    METRIC_GROUPS[gk].types.some((t) => getVal(t) !== null)
  );

  if (isLoading && Object.keys(snap).length === 0) {
    return (
      <div className="page flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-neutral-600" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Body Metrics</h1>
        <Link to="/metrics/log" className="btn-primary flex items-center gap-2 !py-2.5 !px-4 text-sm">
          <Plus size={14} /> Log
        </Link>
      </div>

      {error && (
        <div className="card border-red-500/20 mb-6 animate-fade-in">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Auto-Calculated Summary */}
      <div className="grid grid-cols-2 gap-3 mb-8 animate-fade-in" style={{ animationDelay: '50ms' }}>
        {/* BMI */}
        <div className={`card ${bmiStatus.bg}`}>
          <p className="label mb-2">BMI</p>
          <p className={`text-3xl font-bold ${bmiStatus.color}`}>
            {bmi != null ? Number(bmi).toFixed(1) : '--'}
          </p>
          <p className={`text-xs mt-1 ${bmiStatus.color}`}>{bmiStatus.label}</p>
          <p className="text-[10px] text-neutral-700 mt-2">Server-calculated</p>
        </div>
        {/* SMI */}
        <div className="card">
          <p className="label mb-2">SMI</p>
          <p className={`text-3xl font-bold ${smi != null ? 'text-white' : 'text-neutral-700'}`}>
            {smi != null ? Number(smi).toFixed(1) : '--'}
          </p>
          <p className="text-xs text-neutral-600 mt-1">kg/m²</p>
          <p className="text-[10px] text-neutral-700 mt-2">{smi != null ? 'SMM ÷ height²' : 'Log SMM & height'}</p>
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
                const val = getVal(type);
                return (
                  <MetricCard
                    key={type}
                    metricType={type}
                    label={meta.label}
                    value={val}
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
                      const val = getVal(type);
                      const status = getMedicalStatus(type, val);
                      return (
                        <MetricCard
                          key={type}
                          metricType={type}
                          label={meta.label}
                          value={val}
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
            {customDefs.length > 0 && (
              <div className="mb-8">
                <h2 className="section-title">Custom Metrics</h2>
                <div className="grid grid-cols-2 gap-3">
                  {customDefs.map((def) => {
                    const val = getVal(def.key);
                    return (
                      <MetricCard
                        key={def.key}
                        metricType={def.key}
                        label={def.label}
                        value={val}
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

      {/* Insights Section */}
      {insights.length > 0 && (
        <div className="mt-4 animate-fade-in" style={{ animationDelay: '350ms' }}>
          <h2 className="section-title flex items-center gap-2">
            <AlertTriangle size={14} /> Health Insights
          </h2>
          <div className="space-y-3">
            {insights.map((insight, i) => {
              const statusClass = INSIGHT_COLORS[insight.status] || INSIGHT_COLORS.OK;
              const borderColor = statusClass.split(' ')[1];
              return (
                <div key={i} className={`card border ${borderColor}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{insight.metricLabel || insight.metricType}</p>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${statusClass}`}>
                      {insight.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">{insight.message}</p>
                  {insight.referenceRange && (
                    <p className="text-[10px] text-neutral-600 mt-1.5">
                      Range: {typeof insight.referenceRange === 'string'
                        ? insight.referenceRange
                        : `${insight.referenceRange.min ?? ''} – ${insight.referenceRange.max ?? ''}${insight.referenceRange.description ? ` (${insight.referenceRange.description})` : ''}`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
