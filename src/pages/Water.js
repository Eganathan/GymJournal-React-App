import { useState, useEffect } from 'react';
import { useWaterStore } from '../stores/waterStore';
import BottomSheet from '../components/BottomSheet';

const QUICK_AMOUNTS = [150, 250, 350, 500];

function ProgressRing({ current, goal, size = 220, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(current / goal, 1);
  const offset = circumference - progress * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-default)"
          strokeWidth={strokeWidth}
          strokeOpacity="0.5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--chart-stroke)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: 'drop-shadow(0 0 8px rgba(128,128,128,0.15))',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold">{current}</span>
        <span className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>of {goal} ml</span>
      </div>
    </div>
  );
}

export default function Water() {
  const {
    entries, totalMl, goalMl, progressPercent,
    isLoading, error,
    fetchToday, addEntry, deleteEntry, updateEntry,
  } = useWaterStore();

  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuickAdd = async (ml) => {
    setAdding(true);
    await addEntry(ml);
    setAdding(false);
  };

  const handleCustomAdd = async () => {
    const amount = parseInt(customAmount);
    if (amount > 0) {
      setAdding(true);
      await addEntry(amount);
      setCustomAmount('');
      setShowCustom(false);
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this entry?')) {
      await deleteEntry(id);
    }
  };

  const openEdit = (entry) => {
    setEditingEntry(entry);
    setEditAmount(String(entry.amountMl));
    setEditNotes(entry.notes || '');
  };

  const handleEditSave = async () => {
    if (!editingEntry) return;
    const amount = parseInt(editAmount);
    if (amount > 0) {
      await updateEntry(editingEntry.id, { amountMl: amount, notes: editNotes });
      setEditingEntry(null);
    }
  };

  return (
    <div className="page">
      {/* Progress Ring */}
      <div className="flex flex-col items-center pt-8 pb-6 animate-fade-in">
        <ProgressRing current={totalMl} goal={goalMl} />
        <h2 className="text-xl font-bold mt-6">Today's Hydration</h2>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>{progressPercent}% of daily goal</p>
      </div>

      {/* Error */}
      {error && (
        <div className="card !border-red-900/50 mb-4 animate-fade-in">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Quick Add */}
      <div className="card mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <p className="label mb-4">Quick Add</p>
        <div className="grid grid-cols-4 gap-3 mb-3">
          {QUICK_AMOUNTS.map((ml) => (
            <button
              key={ml}
              onClick={() => handleQuickAdd(ml)}
              disabled={adding}
              className="btn-outline text-center !px-0 active:scale-95 transition-transform duration-150
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {ml} ml
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCustom(true)}
          disabled={adding}
          className="btn-outline w-full disabled:opacity-40"
        >
          + Custom amount
        </button>
      </div>

      {/* Today's Entries */}
      <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
        <h2 className="section-title">Today's Entries</h2>

        {isLoading && entries.length === 0 ? (
          <div className="card text-center py-10">
            <div className="w-6 h-6 rounded-full animate-spin mx-auto mb-3" style={{ border: '2px solid var(--border-default)', borderTopColor: 'var(--text-primary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Loading...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="card text-center py-10">
            <p style={{ color: 'var(--text-dim)' }}>No water logged today</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-faint)' }}>Tap a quick add button above</p>
          </div>
        ) : (
          <div className="space-y-3 stagger">
            {entries.map((entry) => {
              const time = entry.logDateTime
                ? new Date(entry.logDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';
              return (
                <div key={entry.id} className="card flex items-center gap-4 animate-fade-in">
                  <span className="text-sm w-16 shrink-0" style={{ color: 'var(--text-dim)' }}>{time}</span>
                  <span className="text-blue-400">&#x1F4A7;</span>
                  <span className="font-semibold">{entry.amountMl} ml</span>
                  {entry.notes && <span className="text-sm truncate" style={{ color: 'var(--text-dim)' }}>{entry.notes}</span>}
                  <div className="ml-auto flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(entry)}
                      className="text-xs px-2 py-1 rounded-lg transition-all duration-200"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-xs text-red-500/60 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/5 transition-all duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Amount Sheet */}
      <BottomSheet open={showCustom} onClose={() => setShowCustom(false)} title="Custom Amount">
        <div className="space-y-5">
          <div>
            <label className="label block mb-2">Amount (ml)</label>
            <input
              type="number"
              min="1"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="e.g. 400"
              className="w-full"
              autoFocus
            />
          </div>
          <button
            onClick={handleCustomAdd}
            disabled={!customAmount || parseInt(customAmount) <= 0 || adding}
            className="btn-primary w-full disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {adding ? 'Adding...' : `Add ${customAmount ? `${customAmount} ml` : ''}`}
          </button>
        </div>
      </BottomSheet>

      {/* Edit Entry Sheet */}
      <BottomSheet open={!!editingEntry} onClose={() => setEditingEntry(null)} title="Edit Entry">
        <div className="space-y-5">
          <div>
            <label className="label block mb-2">Amount (ml)</label>
            <input
              type="number"
              min="1"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="w-full"
              autoFocus
            />
          </div>
          <div>
            <label className="label block mb-2">Notes</label>
            <input
              type="text"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Optional note"
              className="w-full"
            />
          </div>
          <button
            onClick={handleEditSave}
            disabled={!editAmount || parseInt(editAmount) <= 0}
            className="btn-primary w-full disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
