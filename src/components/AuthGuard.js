import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { healthApi } from '../lib/api';

export default function AuthGuard({ children }) {
  const { isAuthenticated, isLoading, checkSession } = useAuthStore();
  const warmedUp = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      checkSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fire-and-forget health check to warm up the AppSail container
  useEffect(() => {
    if (isAuthenticated && !warmedUp.current) {
      warmedUp.current = true;
      healthApi.check().catch(() => {});
    }
  }, [isAuthenticated]);

  // Loading — checkSession will redirect to Catalyst login if needed
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="text-center animate-fade-in">
          <div className="w-10 h-10 rounded-full animate-spin mx-auto mb-4" style={{ border: '2px solid var(--border-default)', borderTopColor: 'var(--text-primary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return children;
}
