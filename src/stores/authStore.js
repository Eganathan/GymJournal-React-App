/* global catalyst */
import { create } from 'zustand';
import { loadCatalystSDK } from '../lib/catalystLoader';
import { setCurrentUser } from '../lib/api';

const CATALYST_LOGIN_URL = '/__catalyst/auth/login';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  /**
   * Check session using Catalyst Web SDK.
   * Waits for SDK to load, then calls getCurrentProjectUser().
   * If not authenticated, redirects to Catalyst's hosted login page.
   */
  checkSession: async () => {
    set({ isLoading: true });

    // Wait for SDK scripts to finish loading
    const sdkAvailable = await loadCatalystSDK();

    if (!sdkAvailable) {
      // SDK failed to load — redirect to Catalyst login
      window.location.href = CATALYST_LOGIN_URL;
      return;
    }

    try {
      const response = await catalyst.userManagement.getCurrentProjectUser();
      const user = response.content || response;
      const userId = user.user_id || user.zuid || '';
      setCurrentUser(userId);
      set({
        user: {
          email: user.email_id || user.email || '',
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          userId,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // Not authenticated — redirect to Catalyst login
      window.location.href = CATALYST_LOGIN_URL;
    }
  },

  signOut: () => {
    set({ user: null, isAuthenticated: false });
    try {
      if (typeof catalyst !== 'undefined' && catalyst.auth) {
        catalyst.auth.signOut(CATALYST_LOGIN_URL);
      } else {
        window.location.href = CATALYST_LOGIN_URL;
      }
    } catch {
      window.location.href = CATALYST_LOGIN_URL;
    }
  },
}));
