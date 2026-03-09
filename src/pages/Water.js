import { useState, useEffect } from 'react';
import { Settings2 } from 'lucide-react';
import { useWaterStore } from '../stores/waterStore';
import { waterApi } from '../lib/api';
import BottomSheet from '../components/BottomSheet';
import ConfirmDialog from '../components/ConfirmDialog';

const QUICK_AMOUNTS = [150, 250, 350, 500];
const GOAL_PRESETS = [1500, 2000, 2500, 3000, 3500, 4000];

function ProgressRing({ current, goal, size = 220, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(current / goal, 1);
  const offset = circumference - progress * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--text-faint)" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--chart-stroke)" strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
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
    fetchToday, addEntry, deleteEntry, updateEntry, setGoal,
  } = useWaterStore();

  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [weekHistory, setWeekHistory] = useState([]);

  // Goal setter
  const [showGoalSheet, setShowGoalSheet] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [goalSaving, setGoalSaving] = useState(false);

  // Confirm dialog
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchToday();
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    const fmt = (d) => d.toISOString().split('T')[0];
    waterApi.getHistory(fmt(start), fmt(end))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setWeekHistory([...list].reverse());
      })
      .catch(() => {});
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

  const handleGoalSave = async () => {
    const val = parseInt(goalInput);
    if (!val || val < 100) return;
    setGoalSaving(true);
    await setGoal(val);
    setShowGoalSheet(false);
    setGoalInput('');
    setGoalSaving(false);
  };

  const openGoalSheet = () => {
    setGoalInput(String(goalMl));
    setShowGoalSheet(true);
  };

  return (
    <div className="page">
      {/* Progress Ring + goal button */}
      <div className="flex flex-col items-center pt-8 pb-6 animate-fade-in">
        <div className="relative">
          <ProgressRing current={totalMl} goal={goalMl} />
          <button
            onClick={openGoalSheet}
            className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
            style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-default)' }}
            title="Set daily goal"
          >
            <Settings2 size={15} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
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

      {/* 7-day history chart */}
      {weekHistory.length > 0 && (
        <div className="card mb-8 animate-fade-in" style={{ animationDelay: '140ms' }}>
          <p className="label mb-4">Last 7 Days</p>
          <div className="flex items-end gap-1.5 h-20">
            {weekHistory.map((day) => {
              const pct = Math.min((day.totalMl / (day.goalMl || goalMl)) * 100, 100);
              const todayStr = new Date().toISOString().split('T')[0];
              const isToday = day.date === todayStr;
              const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString([], { weekday: 'narrow' });
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end" style={{ height: '60px' }}>
                    <div
                      className="w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: `${Math.max(pct, 4)}%`,
                        backgroundColor: pct >= 100
                          ? 'rgb(34, 197, 94)'
                          : isToday
                          ? 'rgb(96, 165, 250)'
                          : 'var(--text-faint)',
                      }}
                    />
                  </div>
                  <span className="text-[10px]" style={{ color: isToday ? 'var(--text-secondary)' : 'var(--text-dim)' }}>
                    {dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-dim)' }}>
              <span className="w-2.5 h-2.5 rounded-sm inline-block bg-blue-400" /> Today
            </span>
            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-dim)' }}>
              <span className="w-2.5 h-2.5 rounded-sm inline-block bg-green-500" /> Goal met
            </span>
          </div>
        </div>
      )}

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
                      onClick={() => setDeleteTarget(entry)}
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

      {/* ── Sheets & Dialogs ── */}

      {/* Custom Amount Sheet */}
      <BottomSheet open={showCustom} onClose={() => setShowCustom(false)} title="Custom Amount">
        <div className="space-y-5">
          <div>
            <label className="label block mb-2">Amount (ml)</label>
            <input
              type="number" min="1" value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="e.g. 400" className="w-full" autoFocus
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
              type="number" min="1" value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="w-full" autoFocus
            />
          </div>
          <div>
            <label className="label block mb-2">Notes</label>
            <input
              type="text" value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Optional note" className="w-full"
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

      {/* Set Daily Goal Sheet */}
      <BottomSheet open={showGoalSheet} onClose={() => setShowGoalSheet(false)} title="Daily Water Goal">
        <div className="space-y-5">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Set how much water you aim to drink each day. The ring and chart will update immediately.
          </p>

          {/* Preset chips */}
          <div>
            <label className="label block mb-3">Quick select</label>
            <div className="grid grid-cols-3 gap-2">
              {GOAL_PRESETS.map((ml) => (
                <button
                  key={ml}
                  onClick={() => setGoalInput(String(ml))}
                  className="py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border"
                  style={goalInput === String(ml)
                    ? { backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', borderColor: 'var(--btn-primary-bg)' }
                    : { backgroundColor: 'transparent', color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }
                  }
                >
                  {ml >= 1000 ? `${ml / 1000}L` : `${ml} ml`}
                </button>
              ))}
            </div>
          </div>

          {/* Manual input */}
          <div>
            <label className="label block mb-2">Or enter a custom amount (ml)</label>
            <input
              type="number" min="100" max="10000"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="e.g. 2500"
              className="w-full"
            />
          </div>

          <button
            onClick={handleGoalSave}
            disabled={!goalInput || parseInt(goalInput) < 100 || goalSaving}
            className="btn-primary w-full disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {goalSaving ? 'Saving...' : `Set goal to ${goalInput ? `${goalInput} ml` : '...'}`}
          </button>
        </div>
      </BottomSheet>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete entry?"
        message={deleteTarget ? `Remove ${deleteTarget.amountMl} ml entry?` : ''}
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (deleteTarget) await deleteEntry(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
