import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Dumbbell, ChevronRight, Loader2, Copy, Search, Globe, Lock } from 'lucide-react';
import { useRoutineStore } from '../stores/routineStore';
import { routinesApi } from '../lib/api';

export default function Routines() {
  const routines = useRoutineStore((s) => s.routines);
  const isLoading = useRoutineStore((s) => s.isLoading);
  const deleteRoutine = useRoutineStore((s) => s.deleteRoutine);
  const fetchRoutines = useRoutineStore((s) => s.fetchRoutines);

  const [tab, setTab] = useState('mine'); // 'mine' | 'browse'
  const [publicRoutines, setPublicRoutines] = useState([]);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicSearch, setPublicSearch] = useState('');
  const [cloning, setCloning] = useState(null);

  useEffect(() => {
    fetchRoutines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch public routines when Browse tab is active
  useEffect(() => {
    if (tab !== 'browse') return;
    const timer = setTimeout(async () => {
      setPublicLoading(true);
      try {
        const data = await routinesApi.list({ search: publicSearch || undefined, pageSize: 30 });
        const list = Array.isArray(data) ? data : data?.routines || [];
        setPublicRoutines(list);
      } catch {
        setPublicRoutines([]);
      } finally {
        setPublicLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [tab, publicSearch]);

  const handleClone = async (routineId) => {
    setCloning(routineId);
    try {
      await routinesApi.clone(routineId);
      await fetchRoutines();
      setTab('mine');
    } catch {
      // ignore
    } finally {
      setCloning(null);
    }
  };

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Routines</h1>
        <Link to="/routines/new" className="btn-primary flex items-center gap-2 !py-2.5 !px-4 text-sm">
          <Plus size={14} /> New
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl animate-fade-in" style={{ backgroundColor: 'var(--bg-input)' }}>
        <button
          onClick={() => setTab('mine')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            tab === 'mine' ? 'shadow-sm' : ''
          }`}
          style={tab === 'mine'
            ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }
            : { color: 'var(--text-muted)' }
          }
        >
          <Lock size={12} className="inline mr-1.5" style={{ verticalAlign: '-1px' }} />
          My Routines
        </button>
        <button
          onClick={() => setTab('browse')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
            tab === 'browse' ? 'shadow-sm' : ''
          }`}
          style={tab === 'browse'
            ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }
            : { color: 'var(--text-muted)' }
          }
        >
          <Globe size={12} className="inline mr-1.5" style={{ verticalAlign: '-1px' }} />
          Browse Public
        </button>
      </div>

      {/* My Routines Tab */}
      {tab === 'mine' && (
        <>
          {isLoading && routines.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-dim)' }} />
            </div>
          ) : routines.length === 0 ? (
            <div className="card text-center py-14 animate-fade-in">
              <Dumbbell size={40} className="mx-auto mb-4" style={{ color: 'var(--text-faint)' }} />
              <p className="text-lg mb-1" style={{ color: 'var(--text-secondary)' }}>No routines yet</p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>Create your first workout routine or browse public ones</p>
              <div className="flex gap-3 justify-center">
                <Link to="/routines/new" className="btn-primary inline-flex items-center gap-2">
                  <Plus size={14} /> Create Routine
                </Link>
                <button onClick={() => setTab('browse')} className="btn-secondary inline-flex items-center gap-2">
                  <Globe size={14} /> Browse Public
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 stagger">
              {routines.map((r) => (
                <div key={r.id} className="card flex items-center gap-3 animate-fade-in">
                  <Link to={`/routines/${r.id}`} className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{r.name}</p>
                    {r.description && <p className="text-sm truncate mt-0.5" style={{ color: 'var(--text-dim)' }}>{r.description}</p>}
                    <p className="text-xs mt-1.5 flex items-center gap-2" style={{ color: 'var(--text-dim)' }}>
                      <span>{r.itemCount ?? (r.items || r.exercises || []).length} exercises</span>
                      <span style={{ color: 'var(--text-faint)' }}>&middot;</span>
                      <span>{r.isPublic ? 'Public' : 'Private'}</span>
                    </p>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { if (window.confirm('Delete this routine?')) deleteRoutine(r.id); }}
                      className="text-xs text-red-500/60 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/5 transition-all duration-200"
                    >
                      Delete
                    </button>
                    <Link to={`/routines/${r.id}`}>
                      <ChevronRight size={16} style={{ color: 'var(--text-faint)' }} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Browse Public Tab */}
      {tab === 'browse' && (
        <>
          <div className="relative mb-5 animate-fade-in">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
            <input
              type="text" value={publicSearch} onChange={(e) => setPublicSearch(e.target.value)}
              placeholder="Search public routines..." className="w-full !pl-11"
            />
          </div>

          {publicLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-dim)' }} />
            </div>
          ) : publicRoutines.length === 0 ? (
            <div className="card text-center py-14 animate-fade-in">
              <Globe size={36} className="mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
              <p style={{ color: 'var(--text-muted)' }}>
                {publicSearch ? 'No routines match your search' : 'No public routines yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 stagger">
              {publicRoutines.map((r) => (
                <div key={r.id} className="card animate-fade-in">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{r.name}</p>
                      {r.description && <p className="text-sm truncate mt-0.5" style={{ color: 'var(--text-dim)' }}>{r.description}</p>}
                      <p className="text-xs mt-1.5" style={{ color: 'var(--text-dim)' }}>
                        {r.itemCount ?? 0} exercises
                        {r.estimatedMinutes > 0 && <> · ~{r.estimatedMinutes}min</>}
                      </p>
                      {r.tags && r.tags.length > 0 && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {r.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-dim)' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleClone(r.id)}
                      disabled={cloning === r.id}
                      className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5 shrink-0"
                    >
                      {cloning === r.id ? <Loader2 size={12} className="animate-spin" /> : <Copy size={12} />}
                      Clone
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
