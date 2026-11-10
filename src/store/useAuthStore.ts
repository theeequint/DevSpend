// ============================================================
// DevSpend — Cryptographic Authentication Store (Zustand)
// Strict Username + Password ONLY • GitHub Sharded Pipeline
// ============================================================

import { create } from 'zustand';
import { User, AuthSession, UserDataSnapshot } from '../types';
import {
  registerWithCredentials,
  loginWithCredentials,
  loginWithDemo,
  getVerifiedCurrentSession,
  terminateSession,
} from '../services/authService';
import { getShardManifest } from '../services/userShardService';
import { useSpendStore } from './useSpendStore';
import { initCloudSyncListener } from '../services/cloudSyncService';

interface AuthState {
  currentUser: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  authError: string | null;
  lockoutSeconds: number;
  shardSyncStatus: 'synced' | 'syncing' | 'offline';

  // Actions
  initAuth: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, confirmPassword?: string) => Promise<boolean>;
  loginDemo: () => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  setLockoutSeconds: (seconds: number) => void;
  syncShards: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  session: null,
  isAuthenticated: false,
  isInitializing: true,
  authError: null,
  lockoutSeconds: 0,
  shardSyncStatus: 'synced',

  initAuth: async () => {
    try {
      set({ isInitializing: true, authError: null });
      initCloudSyncListener();

      // Fetch latest shard manifest in background
      getShardManifest()
        .then(() => set({ shardSyncStatus: 'synced' }))
        .catch(() => set({ shardSyncStatus: 'offline' }));

      const verifiedSession = await getVerifiedCurrentSession();
      if (verifiedSession) {
        const user: User = {
          id: verifiedSession.userId,
          username: verifiedSession.username,
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
      set({ authError: null, shardSyncStatus: 'syncing' });
      const { user, session, userDataSnapshot } = await loginWithCredentials(identifier, password);

      // Hydrate user workspace data from snapshot if available
      if (
        userDataSnapshot &&
        Array.isArray(userDataSnapshot.projects) &&
        userDataSnapshot.projects.length > 0
      ) {
        try {
          useSpendStore.getState().importFullState({
            projects: userDataSnapshot.projects,
            expenses: userDataSnapshot.expenses || [],
            revenues: userDataSnapshot.revenues || [],
            stakeholders: userDataSnapshot.stakeholders || [],
            fundingRounds: userDataSnapshot.fundingRounds || [],
          });
        } catch (err) {
          console.warn('[Auth] Workspace hydration notice:', err);
        }
      }

      set({
        currentUser: user,
        session,
        isAuthenticated: true,
        authError: null,
        lockoutSeconds: 0,
        shardSyncStatus: 'synced',
      });
      initCloudSyncListener();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check credentials.';
      const match = msg.match(/(\d+)s/);
      const cooldown = match ? parseInt(match[1], 10) : 0;
      set({
        authError: msg,
        lockoutSeconds: cooldown,
        shardSyncStatus: 'synced',
      });
      return false;
    }
  },

  register: async (username, password, confirmPassword) => {
    try {
      set({ authError: null, shardSyncStatus: 'syncing' });

      // Capture current workspace snapshot for the new account
      const currentSpend = useSpendStore.getState();
      const initialSnapshot: UserDataSnapshot = {
        projects: currentSpend.projects,
        expenses: currentSpend.expenses,
        revenues: currentSpend.revenues,
        stakeholders: currentSpend.stakeholders,
        fundingRounds: currentSpend.fundingRounds,
        lastSyncedAt: new Date().toISOString(),
      };

      const { user, session } = await registerWithCredentials(
        username,
        password,
        confirmPassword,
        initialSnapshot
      );

      set({
        currentUser: user,
        session,
        isAuthenticated: true,
        authError: null,
        shardSyncStatus: 'synced',
      });
      initCloudSyncListener();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      set({
        authError: msg,
        shardSyncStatus: 'synced',
      });
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

  syncShards: async () => {
    try {
      set({ shardSyncStatus: 'syncing' });
      await getShardManifest();
      set({ shardSyncStatus: 'synced' });
    } catch {
      set({ shardSyncStatus: 'offline' });
    }
  },
}));
