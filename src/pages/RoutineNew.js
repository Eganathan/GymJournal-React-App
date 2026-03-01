import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useRoutineStore } from '../stores/routineStore';

export default function RoutineNew() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const createRoutine = useRoutineStore((s) => s.createRoutine);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const id = createRoutine(name.trim(), description.trim());
    navigate(`/routines/${id}`, { replace: true });
  };

  return (
    <div className="page">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-neutral-500 hover:text-white mb-6 transition-all duration-200 text-sm"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="page-title animate-fade-in">New Routine</h1>

      <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in" style={{ animationDelay: '50ms' }}>
        <div>
          <label className="label block mb-2">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Push Day, Upper Body..."
            autoFocus
            className="w-full"
          />
        </div>
        <div>
          <label className="label block mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            rows={3}
            className="w-full resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={!name.trim()}
          className="btn-primary w-full disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Create Routine
        </button>
      </form>
    </div>
  );
}
