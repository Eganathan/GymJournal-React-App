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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-10 h-10 border-2 border-neutral-800 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
}
