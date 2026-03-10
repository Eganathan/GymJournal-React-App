import { useState, useEffect } from 'react';
import {
  Plus, AlertTriangle, Pill, StickyNote, Loader2,
  ChevronDown, ChevronUp, Pencil, Trash2, CalendarDays, Clock,
} from 'lucide-react';
import { formatTime, formatDateHeading } from '../lib/dateUtils';
import { useLogsStore } from '../stores/logsStore';
import BottomSheet from '../components/BottomSheet';
import ConfirmDialog from '../components/ConfirmDialog';

// ── Constants ───────────────────────────────────────────────

const TYPES = [
  { value: 'INJURY',     label: 'Injury',     icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
  { value: 'MEDICATION', label: 'Medication', icon: Pill,          color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  { value: 'NOTE',       label: 'Note',       icon: StickyNote,    color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
];

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH'];

const SEVERITY_STYLE = {
  LOW:    { text: 'text-green-400',  bg: 'bg-green-500/10',  label: 'Low' },
  MEDIUM: { text: 'text-amber-400',  bg: 'bg-amber-500/10',  label: 'Medium' },
  HIGH:   { text: 'text-red-400',    bg: 'bg-red-500/10',    label: 'High' },
};

const todayStr = () => new Date().toISOString().split('T')[0];

function typeInfo(type) {
  return TYPES.find((t) => t.value === type) || TYPES[2];
}

// ── Log Entry Card ───────────────────────────────────────────

function LogCard({ entry, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const info = typeInfo(entry.type);
  const Icon = info.icon;
  const sev = entry.severity ? SEVERITY_STYLE[entry.severity] : null;
  const time = formatTime(entry.createdAt);
  const hasDesc = !!entry.description;

  return (
    <div className="card animate-fade-in" style={{ borderColor: `var(--border-default)` }}>
      <div className="flex items-start gap-3">
        {/* Type icon */}
        <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${info.bg}`}>
          <Icon size={16} className={info.color} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${info.bg} ${info.color} ${info.border}`}>
              {info.label}
            </span>
            {sev && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${sev.bg} ${sev.text}`}>
                {sev.label}
              </span>
            )}
          </div>

          <p className="font-semibold mt-1.5 leading-snug">{entry.title}</p>

          {hasDesc && (
            <>
              {expanded ? (
                <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {entry.description}
                </p>
              ) : (
                <p className="text-sm mt-1.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                  {entry.description}
                </p>
              )}
              {entry.description.length > 80 && (
                <button
                  onClick={() => setExpanded((x) => !x)}
                  className="flex items-center gap-0.5 text-xs mt-1 transition-colors duration-200"
                  style={{ color: 'var(--text-dim)' }}
                >
                  {expanded ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> More</>}
                </button>
              )}
            </>
          )}

          <div className="flex items-center gap-2 mt-2.5" style={{ color: 'var(--text-faint)' }}>
            <span className="flex items-center gap-1 text-[11px]">
              <CalendarDays size={10} />
              {entry.logDate}
            </span>
            {time && (
              <span className="flex items-center gap-1 text-[11px]">
                <Clock size={10} /> {time}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0 -mt-0.5">
          <button
            onClick={() => onEdit(entry)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
            style={{ color: 'var(--text-dim)' }}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(entry)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500/40 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Entry Form (shared for create & edit) ────────────────────

function LogForm({ initial = {}, onSave, saving, error }) {
  const [logDate, setLogDate]     = useState(initial.logDate || todayStr());
  const [type, setType]           = useState(initial.type || 'INJURY');
  const [title, setTitle]         = useState(initial.title || '');
  const [description, setDesc]    = useState(initial.description || '');
  const [severity, setSeverity]   = useState(initial.severity || '');
  const isEdit = !!initial.id;

  const handleSubmit = () => {
    if (!title.trim()) return;
    const body = isEdit
      ? { title: title.trim(), description: description.trim(), severity }
      : { logDate, type, title: title.trim(), description: description.trim(), severity };
    onSave(body);
  };

  return (
    <div className="space-y-5">
      {/* Date — only for new entries */}
      {!isEdit && (
        <div>
          <label className="label block mb-2">Date</label>
          <input
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            className="w-full"
          />
        </div>
      )}

      {/* Type — only for new entries */}
      {!isEdit && (
        <div>
          <label className="label block mb-3">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((t) => {
              const Icon = t.icon;
              const active = type === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className="flex flex-col items-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all duration-200"
                  style={active
                    ? { backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderColor: 'var(--btn-primary-bg)' }
                    : { backgroundColor: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-default)' }
                  }
                >
                  <Icon size={18} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="label block mb-2">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            type === 'INJURY' ? 'e.g. Left knee pain during squats'
            : type === 'MEDICATION' ? 'e.g. Ibuprofen 400mg'
            : 'e.g. Felt unusually fatigued today'
          }
          className="w-full"
          autoFocus={isEdit}
        />
      </div>

      {/* Severity */}
      <div>
        <label className="label block mb-3">Severity <span className="normal-case font-normal" style={{ color: 'var(--text-dim)' }}>(optional)</span></label>
        <div className="flex gap-2">
          <button
            onClick={() => setSeverity('')}
            className="flex-1 py-2 rounded-xl border text-xs font-medium transition-all duration-200"
            style={!severity
              ? { backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderColor: 'var(--btn-primary-bg)' }
              : { backgroundColor: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-default)' }
            }
          >
            None
          </button>
          {SEVERITIES.map((s) => {
            const st = SEVERITY_STYLE[s];
            const active = severity === s;
            return (
              <button
                key={s}
                onClick={() => setSeverity(s)}
                className="flex-1 py-2 rounded-xl border text-xs font-medium transition-all duration-200"
                style={active
                  ? { backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderColor: 'var(--btn-primary-bg)' }
                  : { backgroundColor: 'transparent', borderColor: 'var(--border-default)' }
                }
              >
                <span className={active ? '' : st.text}>{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="label block mb-2">Details <span className="normal-case font-normal" style={{ color: 'var(--text-dim)' }}>(optional)</span></label>
        <textarea
          value={description}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Add any additional details..."
          className="w-full"
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!title.trim() || saving}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        {isEdit ? 'Save Changes' : 'Add Entry'}
      </button>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────

const TYPE_FILTERS = [
  { value: '', label: 'All', icon: null, color: null },
  ...TYPES.map((t) => ({ value: t.value, label: t.label, icon: t.icon, color: t.color, bg: t.bg, border: t.border })),
];

export default function Logs() {
  const { recent, isLoading, error, fetchRecent, createLog, updateLog, deleteLog } = useLogsStore();

  const [typeFilter, setTypeFilter] = useState('');
  const [showAdd, setShowAdd]       = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');

  useEffect(() => {
    fetchRecent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = typeFilter
    ? recent.filter((e) => e.type === typeFilter)
    : recent;

  // Group by date for timeline display
  const grouped = filtered.reduce((acc, entry) => {
    const d = entry.logDate;
    if (!acc[d]) acc[d] = [];
    acc[d].push(entry);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const handleCreate = async (body) => {
    if (!body.title) return;
    setSaving(true);
    setFormError('');
    const result = await createLog(body);
    setSaving(false);
    if (result) {
      setShowAdd(false);
    } else {
      setFormError(useLogsStore.getState().error || 'Failed to save entry');
    }
  };

  const handleUpdate = async (body) => {
    if (!body.title) return;
    setSaving(true);
    setFormError('');
    const result = await updateLog(editTarget.id, body);
    setSaving(false);
    if (result) {
      setEditTarget(null);
    } else {
      setFormError(useLogsStore.getState().error || 'Failed to update entry');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteLog(deleteTarget.id);
    setDeleteTarget(null);
  };

  const openEdit = (entry) => {
    setFormError('');
    setEditTarget(entry);
  };

  const openAdd = () => {
    setFormError('');
    setShowAdd(true);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Health Log</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Track injuries, medication & notes</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 !py-2.5 !px-4 text-sm">
          <Plus size={14} /> Add Entry
        </button>
      </div>

      {/* Type filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide animate-fade-in" style={{ animationDelay: '50ms' }}>
        {TYPE_FILTERS.map((f) => {
          const active = typeFilter === f.value;
          const Icon = f.icon;
          return (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border"
              style={active
                ? (f.color
                    ? { backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderColor: 'var(--btn-primary-bg)' }
                    : { backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderColor: 'var(--btn-primary-bg)' })
                : (f.color
                    ? { backgroundColor: 'var(--bg-raised)', color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }
                    : { backgroundColor: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-default)' })
              }
            >
              {Icon && <Icon size={12} className={active ? '' : f.color} />}
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Error banner */}
      {error && (
        <div className="card !border-red-900/50 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Content */}
      {isLoading && recent.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-dim)' }} />
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="card text-center py-16 animate-fade-in">
          <AlertTriangle size={36} className="mx-auto mb-4" style={{ color: 'var(--text-faint)' }} />
          <p className="text-lg mb-1" style={{ color: 'var(--text-secondary)' }}>
            {typeFilter ? `No ${typeFilter.toLowerCase()} entries` : 'No entries yet'}
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
            Log injuries, medication, or notes about your training days
          </p>
          <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2">
            <Plus size={14} /> Add First Entry
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((date) => {
            const isToday = date === todayStr();
            const dateLabel = formatDateHeading(date);

            return (
              <div key={date} className="animate-fade-in">
                {/* Date heading */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-semibold" style={{ color: isToday ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {dateLabel}
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-subtle)' }} />
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-dim)' }}>
                    {grouped[date].length}
                  </span>
                </div>

                <div className="space-y-3">
                  {grouped[date].map((entry) => (
                    <LogCard
                      key={entry.id}
                      entry={entry}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Entry Sheet */}
      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="New Entry">
        <LogForm onSave={handleCreate} saving={saving} error={formError} />
      </BottomSheet>

      {/* Edit Entry Sheet */}
      <BottomSheet open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Entry">
        {editTarget && (
          <LogForm
            initial={editTarget}
            onSave={handleUpdate}
            saving={saving}
            error={formError}
          />
        )}
      </BottomSheet>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete entry?"
        message={deleteTarget ? `"${deleteTarget.title}" will be permanently removed.` : ''}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
