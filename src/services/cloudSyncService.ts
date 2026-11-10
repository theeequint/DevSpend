// ============================================================
// DevSpend — Cloud State Sync Coordinator
// Automatically persists workspace state to PublicUsersData/
// ============================================================

import { useAuthStore } from '../store/useAuthStore';
import { useSpendStore } from '../store/useSpendStore';
import { syncUserDataSnapshot, getGitHubToken } from './userShardService';
import { UserDataSnapshot } from '../types';

let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
let initialized = false;

/**
 * Debounced automatic cloud sync that saves the user's workspace
 * (projects, expenses, revenues, stakeholders, funding rounds)
 * to their record inside PublicUsersData/ in the GitHub repository.
 */
export function triggerAutoCloudSync(): void {
  if (debounceTimeout) clearTimeout(debounceTimeout);

  debounceTimeout = setTimeout(async () => {
    try {
      const auth = useAuthStore.getState();
      // Only sync authenticated, non-demo users
      if (!auth.currentUser || auth.currentUser.id === 'user_demo') return;

      const token = getGitHubToken();
      if (!token) return;

      const spend = useSpendStore.getState();
      const snapshot: UserDataSnapshot = {
        projects: spend.projects,
        expenses: spend.expenses,
        revenues: spend.revenues,
        stakeholders: spend.stakeholders,
        fundingRounds: spend.fundingRounds,
        lastSyncedAt: new Date().toISOString(),
      };

      await syncUserDataSnapshot(auth.currentUser.id, snapshot);
    } catch (err) {
      console.warn('[CloudSync] Background sync notice:', err);
    }
  }, 1500);
}

/**
 * Initialize automatic store listeners to detect project & ledger updates
 */
export function initCloudSyncListener(): void {
  if (initialized) return;
  initialized = true;

  useSpendStore.subscribe((state, prevState) => {
    if (
      state.projects !== prevState.projects ||
      state.expenses !== prevState.expenses ||
      state.revenues !== prevState.revenues ||
      state.stakeholders !== prevState.stakeholders ||
      state.fundingRounds !== prevState.fundingRounds
    ) {
      triggerAutoCloudSync();
    }
  });
}
