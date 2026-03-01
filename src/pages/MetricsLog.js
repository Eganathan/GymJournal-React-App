import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, ChevronUp, FlaskConical, Plus } from 'lucide-react';
import { useMetricsStore } from '../stores/metricsStore';
import { METRIC_TYPES, METRIC_GROUPS, DEFAULT_GROUPS, ADVANCED_GROUPS } from '../lib/constants';
import BottomSheet from '../components/BottomSheet';

export default function MetricsLog() {
  const navigate = useNavigate();
  const addEntry = useMetricsStore((s) => s.addEntry);
  const customMetricDefs = useMetricsStore((s) => s.customMetricDefs);
  const addCustomMetricDef = useMetricsStore((s) => s.addCustomMetricDef);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [values, setValues] = useState({});
  const [saved, setSaved] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCustomSheet, setShowCustomSheet] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customUnit, setCustomUnit] = useState('');

  const setValue = (type, val) => {
    setValues((prev) => ({ ...prev, [type]: val }));
  };

  const handleSave = () => {
    let count = 0;
    Object.entries(values).forEach(([type, val]) => {
      if (val !== '' && val != null && !isNaN(parseFloat(val))) {
        const meta = METRIC_TYPES[type];
        const customDef = customMetricDefs.find((d) => d.key === type);
        const unit = meta?.unit || customDef?.unit || '';
        addEntry(type, val, unit, date);
        count++;
      }
    });
    if (count > 0) {
      setSaved(true);
      setTimeout(() => navigate('/metrics'), 800);
    }
  };

  const handleAddCustomDef = () => {
    if (!customLabel.trim()) return;
    addCustomMetricDef(customLabel.trim(), customUnit.trim() || '');
    setCustomLabel('');
    setCustomUnit('');
    setShowCustomSheet(false);
  };

  const filledCount = Object.values(values).filter((v) => v !== '' && v != null).length;

  const renderGroup = (groupKey) => {
    const group = METRIC_GROUPS[groupKey];
    return (
      <div key={groupKey} className="mb-8">
        <h2 className="section-title">{group.label}</h2>
        <div className="space-y-3">
          {group.types.map((type) => {
            const meta = METRIC_TYPES[type];
            return (
              <div key={type} className="flex items-center gap-4">
                <label className="text-sm text-neutral-400 w-32 shrink-0">{meta.label}</label>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={values[type] || ''}
                    onChange={(e) => setValue(type, e.target.value)}
                    placeholder="--"
                    className="w-full !pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-600">
                    {meta.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-neutral-500 hover:text-white mb-6 transition-all duration-200 text-sm"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="page-title animate-fade-in">Log Measurements</h1>

      {saved ? (
        <div className="card text-center py-16 animate-scale-in">
          <div className="w-16 h-16 rounded-full border border-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-green-400" />
          </div>
          <p className="text-lg font-semibold text-green-400">Saved!</p>
        </div>
      ) : (
        <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
          {/* Date */}
          <div className="mb-8">
            <label className="label block mb-2">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full" />
          </div>

          {/* Default groups */}
          {DEFAULT_GROUPS.map(renderGroup)}

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 w-full py-3 mb-6 text-neutral-500 hover:text-white transition-all duration-200 border-t border-neutral-900 pt-6"
          >
            <FlaskConical size={16} />
            <span className="text-sm font-medium">Medical & Blood Work</span>
            <span className="text-[10px] text-neutral-700 ml-1">(optional)</span>
            <span className="ml-auto">
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>

          {showAdvanced && (
            <div className="animate-fade-in">
              {ADVANCED_GROUPS.map(renderGroup)}

              {/* Custom metrics */}
              {customMetricDefs.length > 0 && (
                <div className="mb-8">
                  <h2 className="section-title">Custom Metrics</h2>
                  <div className="space-y-3">
                    {customMetricDefs.map((def) => (
                      <div key={def.key} className="flex items-center gap-4">
                        <label className="text-sm text-neutral-400 w-32 shrink-0">{def.label}</label>
                        <div className="flex-1 relative">
                          <input
                            type="number"
                            step="0.1"
                            value={values[def.key] || ''}
                            onChange={(e) => setValue(def.key, e.target.value)}
                            placeholder="--"
                            className="w-full !pr-16"
                          />
                          {def.unit && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-600">
                              {def.unit}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add custom metric button */}
              <button
                onClick={() => setShowCustomSheet(true)}
                className="btn-outline w-full flex items-center justify-center gap-2 mb-8"
              >
                <Plus size={14} /> Add Custom Metric
              </button>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={filledCount === 0}
            className="btn-primary w-full disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {filledCount > 0
              ? `Save ${filledCount} measurement${filledCount > 1 ? 's' : ''}`
              : 'Fill in at least one metric'}
          </button>
        </div>
      )}

      {/* Custom Metric Sheet */}
      <BottomSheet open={showCustomSheet} onClose={() => setShowCustomSheet(false)} title="Add Custom Metric">
        <p className="text-sm text-neutral-500 mb-5">
          Define a new metric to track. It will appear in your log form and dashboard.
        </p>
        <div className="space-y-5">
          <div>
            <label className="label block mb-2">Metric Name *</label>
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="e.g. SGPT, Cortisol, VO2 Max"
              className="w-full"
              autoFocus
            />
          </div>
          <div>
            <label className="label block mb-2">Unit</label>
            <input
              type="text"
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              placeholder="e.g. U/L, ng/dL, mL/kg/min"
              className="w-full"
            />
          </div>
          <button
            onClick={handleAddCustomDef}
            disabled={!customLabel.trim()}
            className="btn-primary w-full disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Add Metric
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
