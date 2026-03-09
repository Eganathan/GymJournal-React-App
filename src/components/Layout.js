import { NavLink, Outlet } from 'react-router-dom';
import { Home, Droplets, Dumbbell, ClipboardList, Scale, Sun, Moon, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/workouts', icon: Dumbbell, label: 'Workouts' },
  { to: '/water', icon: Droplets, label: 'Water' },
  { to: '/routines', icon: ClipboardList, label: 'Routines' },
  { to: '/metrics', icon: Scale, label: 'Body' },
];

export default function Layout() {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const { user, signOut } = useAuthStore();

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md" style={{ backgroundColor: 'var(--bg-nav)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center justify-between h-14 px-5 lg:px-8 max-w-screen-xl mx-auto">
          <span className="text-lg font-bold tracking-tight">GymJournal</span>
          <div className="flex items-center gap-3">
            {/* Name visible on sm+; initial avatar on mobile */}
            <span className="text-sm hidden sm:block" style={{ color: 'var(--text-muted)' }}>{displayName}</span>
            <div
              className="sm:hidden w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
              title={displayName}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-80 transition-all duration-200"
              style={{ border: '1px solid var(--border-default)' }}
            >
              {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => signOut()}
              className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-80 transition-all duration-200"
              style={{ border: '1px solid var(--border-default)' }}
              title="Sign out"
            >
              <LogOut size={16} style={{ color: 'var(--text-dim)' }} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-52 shrink-0 pt-6 px-3 sticky top-14 h-[calc(100vh-3.5rem)]" style={{ borderRight: '1px solid var(--border-subtle)' }}>
          <nav className="flex flex-col gap-1">
            {tabs.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`
                }
                style={({ isActive }) => isActive ? { backgroundColor: 'var(--bg-input)' } : {}}
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto pb-6">
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                         text-[var(--text-dim)] hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 w-full"
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 backdrop-blur-md z-50"
        style={{
          backgroundColor: 'var(--bg-nav)',
          borderTop: '1px solid var(--border-subtle)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 ${
                  isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-dim)]'
                }`
              }
            >
              <Icon size={20} strokeWidth={1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
