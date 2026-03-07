/* global catalyst */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { loadCatalystSDK } from '../lib/catalystLoader';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, setUser } = useAuthStore();
  const [status, setStatus] = useState('loading'); // loading | catalyst | dev
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  // Try loading Catalyst SDK
  useEffect(() => {
    if (isAuthenticated) return;

    loadCatalystSDK().then((available) => {
      if (available) {
        setStatus('catalyst');
        setTimeout(() => {
          try {
            catalyst.auth.signIn('catalyst-login', {
              service_url: '/app/',
              css_url: '/app/css/catalyst-login.css',
            });

            // Watch for iFrame to appear inside the container
            const container = document.getElementById('catalyst-login');
            if (container) {
              const observer = new MutationObserver(() => {
                const iframe = container.querySelector('iframe');
                if (iframe) {
                  iframe.style.minHeight = '400px';
                  iframe.style.width = '100%';
                  iframe.style.border = 'none';
                  iframe.style.borderRadius = '16px';
                  iframe.addEventListener('load', () => setIframeLoaded(true));
                  // Fallback if load event already fired
                  setTimeout(() => setIframeLoaded(true), 2000);
                  observer.disconnect();
                }
              });
              observer.observe(container, { childList: true, subtree: true });
              // Fallback timeout
              setTimeout(() => setIframeLoaded(true), 4000);
            }
          } catch (err) {
            console.error('Catalyst signIn error:', err);
            setStatus('dev');
          }
        }, 200);
      } else {
        setStatus('dev');
      }
    });
  }, [isAuthenticated]);

  const handleDevLogin = () => {
    setUser({
      email: 'dev@gymjournal.local',
      firstName: 'Dev',
      lastName: 'User',
      userId: 'dev-local',
    });
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Branding */}
      <div className="mb-8 text-center animate-fade-in">
        <h1 className="text-4xl font-bold tracking-tight">GymJournal</h1>
        <p className="mt-2" style={{ color: 'var(--text-muted)' }}>Track your fitness journey</p>
      </div>

      {/* Loading state */}
      {status === 'loading' && (
        <div className="animate-fade-in flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-dim)' }} />
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Connecting...</p>
        </div>
      )}

      {/* Catalyst embedded login */}
      {status === 'catalyst' && (
        <div className="w-full max-w-md animate-fade-in" style={{ animationDelay: '100ms' }}>
          {/* Loading indicator while iFrame loads */}
          {!iframeLoaded && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-dim)' }} />
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Loading sign-in...</p>
            </div>
          )}

          <div
            id="catalyst-login"
            className="w-full rounded-2xl overflow-hidden"
            style={{
              minHeight: iframeLoaded ? '400px' : '0px',
              opacity: iframeLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
          />

          {/* Fallback link to skip */}
          <p className="text-center mt-6">
            <button
              onClick={handleDevLogin}
              className="text-xs transition-colors"
              style={{ color: 'var(--text-faint)' }}
            >
              Skip sign-in (dev mode)
            </button>
          </p>
        </div>
      )}

      {/* Dev / Offline mode */}
      {status === 'dev' && (
        <div className="w-full max-w-sm animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="card !p-6 mb-4">
            <p className="label mb-5 text-center">Sign in to continue</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full"
                  disabled
                />
              </div>
              <div>
                <label className="text-sm block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full"
                  disabled
                />
              </div>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: '1px solid var(--border-default)' }} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-dim)' }}>Catalyst unavailable</span>
              </div>
            </div>

            <button onClick={handleDevLogin} className="btn-primary w-full">
              Continue as Dev User
            </button>
          </div>

          <p className="text-xs text-center" style={{ color: 'var(--text-faint)' }}>
            Catalyst SDK couldn't connect. This is expected in local dev.
            <br />
            Auth will work when deployed to Catalyst hosting.
          </p>
        </div>
      )}

      <p className="text-xs mt-10 animate-fade-in" style={{ animationDelay: '300ms', color: 'var(--text-faint)' }}>
        Powered by Zoho Catalyst
      </p>
    </div>
  );
}
