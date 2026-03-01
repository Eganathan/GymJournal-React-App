import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function ExerciseCard({ exercise, onUpdate, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card mb-3 animate-fade-in">
      <div className="flex items-center gap-3">
        {/* Reorder */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1 rounded-lg hover:bg-neutral-800 disabled:opacity-10 transition-all duration-200"
          >
            <ChevronUp size={14} className="text-neutral-500" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1 rounded-lg hover:bg-neutral-800 disabled:opacity-10 transition-all duration-200"
          >
            <ChevronDown size={14} className="text-neutral-500" />
          </button>
        </div>

        {/* Info */}
        <button className="flex-1 min-w-0 text-left" onClick={() => setExpanded(!expanded)}>
          <p className="font-semibold truncate">{exercise.exerciseName}</p>
          <p className="text-sm text-neutral-500 mt-0.5">
            {exercise.defaultSets} sets &times; {exercise.defaultReps} reps
            {exercise.defaultWeightKg ? ` · ${exercise.defaultWeightKg} kg` : ''}
          </p>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-neutral-500 hover:text-white px-2 py-1 rounded-lg hover:bg-neutral-800 transition-all duration-200"
          >
            Edit
          </button>
          <button
            onClick={onRemove}
            className="text-xs text-red-500/70 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/5 transition-all duration-200"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Expanded edit */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-neutral-800 animate-fade-in grid grid-cols-3 gap-3">
          <div>
            <label className="label block mb-1.5">Sets</label>
            <input
              type="number"
              min="1"
              value={exercise.defaultSets}
              onChange={(e) => onUpdate({ defaultSets: parseInt(e.target.value) || 1 })}
              className="w-full text-center !py-2.5"
            />
          </div>
          <div>
            <label className="label block mb-1.5">Reps</label>
            <input
              type="number"
              min="1"
              value={exercise.defaultReps}
              onChange={(e) => onUpdate({ defaultReps: parseInt(e.target.value) || 1 })}
              className="w-full text-center !py-2.5"
            />
          </div>
          <div>
            <label className="label block mb-1.5">Weight (kg)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={exercise.defaultWeightKg || ''}
              onChange={(e) => onUpdate({ defaultWeightKg: parseFloat(e.target.value) || null })}
              className="w-full text-center !py-2.5"
              placeholder="--"
            />
          </div>
          <div className="col-span-3">
            <label className="label block mb-1.5">Notes</label>
            <input
              type="text"
              value={exercise.notes || ''}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              className="w-full !py-2.5"
              placeholder="Optional notes..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
