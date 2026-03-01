import { useState } from 'react';
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
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.15))',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold">{current}</span>
        <span className="text-sm text-neutral-500 mt-1">of {goal} ml</span>
      </div>
    </div>
  );
}

export default function Water() {
  const { dailyGoal, addEntry, deleteEntry, getTodayEntries, getTodayTotal } = useWaterStore();
  const todayEntries = getTodayEntries();
  const todayTotal = getTodayTotal();
  const percentage = Math.round((todayTotal / dailyGoal) * 100);

  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const handleCustomAdd = () => {
    const amount = parseInt(customAmount);
    if (amount > 0) {
      addEntry(amount);
      setCustomAmount('');
      setShowCustom(false);
    }
  };

  return (
    <div className="page">
      {/* Progress Ring */}
      <div className="flex flex-col items-center pt-8 pb-6 animate-fade-in">
        <ProgressRing current={todayTotal} goal={dailyGoal} />
        <h2 className="text-xl font-bold mt-6">Today's Hydration</h2>
        <p className="text-neutral-500 mt-1">{percentage}% of daily goal</p>
      </div>

      {/* Quick Add */}
      <div className="card mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <p className="label mb-4">Quick Add</p>
        <div className="grid grid-cols-4 gap-3 mb-3">
          {QUICK_AMOUNTS.map((ml) => (
            <button
              key={ml}
              onClick={() => addEntry(ml)}
              className="btn-outline text-center !px-0 active:scale-95 transition-transform duration-150"
            >
              {ml} ml
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCustom(true)}
          className="btn-outline w-full"
        >
          + Custom amount
        </button>
      </div>

      {/* Today's Entries */}
      <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
        <h2 className="section-title">Today's Entries</h2>

        {todayEntries.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-neutral-600">No water logged today</p>
            <p className="text-neutral-700 text-sm mt-1">Tap a quick add button above</p>
          </div>
        ) : (
          <div className="space-y-3 stagger">
            {todayEntries.map((entry) => {
              const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={entry.id} className="card flex items-center gap-4 animate-fade-in">
                  <span className="text-sm text-neutral-600 w-16 shrink-0">{time}</span>
                  <span className="text-blue-400">&#x1F4A7;</span>
                  <span className="font-semibold">{entry.amount} ml</span>
                  {entry.note && <span className="text-sm text-neutral-600 truncate">{entry.note}</span>}
                  <div className="ml-auto flex items-center gap-1 shrink-0">
                    <button className="text-xs text-neutral-600 hover:text-white px-2 py-1 rounded-lg hover:bg-neutral-800 transition-all duration-200">
                      Edit
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
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
            disabled={!customAmount || parseInt(customAmount) <= 0}
            className="btn-primary w-full disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Add {customAmount ? `${customAmount} ml` : ''}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
