import { NavLink, Outlet } from 'react-router-dom';
import { Home, Droplets, ClipboardList, Scale, Sun, Moon, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/water', icon: Droplets, label: 'Water' },
  { to: '/routines', icon: ClipboardList, label: 'Routines' },
  { to: '/metrics', icon: Scale, label: 'Body' },
];

export default function Layout() {
  const [darkMode, setDarkMode] = useState(true);
  const { user, signOut } = useAuthStore();

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-neutral-900">
        <div className="flex items-center justify-between h-14 px-5 lg:px-8 max-w-screen-xl mx-auto">
          <span className="text-lg font-bold tracking-tight">GymJournal</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-500 hidden sm:block">{displayName}</span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-9 h-9 rounded-xl border border-neutral-800 flex items-center justify-center
                         hover:border-neutral-600 hover:bg-neutral-900 transition-all duration-200"
            >
              {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-52 shrink-0 border-r border-neutral-900 pt-6 px-3 sticky top-14 h-[calc(100vh-3.5rem)]">
          <nav className="flex flex-col gap-1">
            {tabs.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-neutral-800/80 text-white'
                      : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'
                  }`
                }
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
                         text-neutral-600 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 w-full"
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-neutral-900 safe-area-pb z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 ${
                  isActive ? 'text-white' : 'text-neutral-600'
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
