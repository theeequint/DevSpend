// ============================================================
// DevSpend — Cryptographic Authentication Store (Zustand)
// ============================================================

import { create } from 'zustand';
import { User, AuthSession } from '../types';
import {
  registerWithCredentials,
  loginWithCredentials,
  loginWithDemo,
  loginWithSocialOAuth,
  getVerifiedCurrentSession,
  terminateSession,
} from '../services/authService';

interface AuthState {
  currentUser: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  authError: string | null;
  lockoutSeconds: number;
  oauthModalOpen: boolean;
  oauthTargetProvider: 'google' | 'github' | null;

  // Actions
  initAuth: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  loginDemo: () => Promise<boolean>;
  loginOAuth: (
    provider: 'google' | 'github',
    profile: {
      email: string;
      displayName: string;
      avatarUrl?: string;
      username?: string;
    }
  ) => Promise<boolean>;
  openOAuthModal: (provider: 'google' | 'github') => void;
  closeOAuthModal: () => void;
  logout: () => void;
  clearError: () => void;
  setLockoutSeconds: (seconds: number) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  session: null,
  isAuthenticated: false,
  isInitializing: true,
  authError: null,
  lockoutSeconds: 0,
  oauthModalOpen: false,
  oauthTargetProvider: null,

  initAuth: async () => {
    try {
      set({ isInitializing: true, authError: null });
      const verifiedSession = await getVerifiedCurrentSession();
      if (verifiedSession) {
        const user: User = {
          id: verifiedSession.userId,
          username: verifiedSession.username,
          email: verifiedSession.email,
          displayName: verifiedSession.displayName,
          avatarUrl: verifiedSession.avatarUrl,
          authProvider: verifiedSession.authProvider,
          createdAt: new Date(verifiedSession.issuedAt).toISOString(),
        };
        set({
          currentUser: user,
          session: verifiedSession,
          isAuthenticated: true,
          isInitializing: false,
        });
      } else {
        set({
          currentUser: null,
          session: null,
          isAuthenticated: false,
          isInitializing: false,
        });
      }
    } catch (err: unknown) {
      console.error('Failed to initialize auth session:', err);
      set({
        currentUser: null,
        session: null,
        isAuthenticated: false,
        isInitializing: false,
      });
    }
  },

  login: async (identifier, password) => {
    try {
      set({ authError: null });
      const { user, session } = await loginWithCredentials(identifier, password);
      set({
        currentUser: user,
        session,
        isAuthenticated: true,
        authError: null,
        lockoutSeconds: 0,
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check credentials.';
      // Check if message has cooldown
      const match = msg.match(/(\d+)s/);
      const cooldown = match ? parseInt(match[1], 10) : 0;
      set({ authError: msg, lockoutSeconds: cooldown });
      return false;
    }
  },

  register: async (username, email, password) => {
    try {
      set({ authError: null });
      const { user, session } = await registerWithCredentials(username, email, password);
      set({
        currentUser: user,
        session,
        isAuthenticated: true,
        authError: null,
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      set({ authError: msg });
      return false;
    }
  },

  loginDemo: async () => {
    try {
      set({ authError: null });
      const { user, session } = await loginWithDemo();
      set({
        currentUser: user,
        session,
        isAuthenticated: true,
        authError: null,
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to launch demo sandbox.';
      set({ authError: msg });
      return false;
    }
  },

  loginOAuth: async (provider, profile) => {
    try {
      set({ authError: null, oauthModalOpen: false });
      const { user, session } = await loginWithSocialOAuth(provider, profile);
      set({
        currentUser: user,
        session,
        isAuthenticated: true,
        authError: null,
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Social OAuth failed.';
      set({ authError: msg });
      return false;
    }
  },

  openOAuthModal: (provider) => {
    set({ oauthModalOpen: true, oauthTargetProvider: provider, authError: null });
  },

  closeOAuthModal: () => {
    set({ oauthModalOpen: false, oauthTargetProvider: null });
  },

  logout: () => {
    terminateSession();
    set({
      currentUser: null,
      session: null,
      isAuthenticated: false,
      authError: null,
    });
  },

  clearError: () => set({ authError: null }),

  setLockoutSeconds: (seconds: number) => set({ lockoutSeconds: seconds }),
}));
