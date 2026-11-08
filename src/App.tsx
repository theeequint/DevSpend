import React, { useEffect } from 'react';
import { useSpendStore, useUserProjects } from './store/useSpendStore';
import { useAuthStore } from './store/useAuthStore';
import { AuthGuard } from './components/auth/AuthGuard';
import Navbar from './components/layout/Navbar';
import { WelcomeHomeView } from './components/onboarding/WelcomeHomeView';
import DashboardView from './components/dashboard/DashboardView';
import LedgerView from './components/ledger/LedgerView';
import OwnershipView from './components/ownership/OwnershipView';
import BurnSimulator from './components/simulator/BurnSimulator';
import AuditView from './components/audit/AuditView';
import SettingsView from './components/settings/SettingsView';
import CommandPalette from './components/palette/CommandPalette';
import AddExpenseModal from './components/ledger/AddExpenseModal';
import AddRevenueModal from './components/ledger/AddRevenueModal';
import AddStakeholderModal from './components/ownership/AddStakeholderModal';
import AddFundingRoundModal from './components/ownership/AddFundingRoundModal';
import CreateProjectModal from './components/project/CreateProjectModal';
import { DeleteProjectModal } from './components/project/DeleteProjectModal';

export const AppContent: React.FC = () => {
  const {
    activeView,
    settings,
    activeDebugTimer,
    tickDebugTimer,
    addExpenseModalOpen,
    setAddExpenseModalOpen,
    addRevenueModalOpen,
    setAddRevenueModalOpen,
    addStakeholderModalOpen,
    setAddStakeholderModalOpen,
    addFundingRoundModalOpen,
    setAddFundingRoundModalOpen,
    createProjectModalOpen,
    setCreateProjectModalOpen,
  } = useSpendStore();

  const { currentUser } = useAuthStore();
  const userProjects = useUserProjects(currentUser?.id);

  // Sync dark mode class on <html>
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Global debug timer tick: keeps running across all views
  useEffect(() => {
    let interval: any = null;
    if (activeDebugTimer?.running) {
      interval = setInterval(() => {
        tickDebugTimer();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeDebugTimer?.running, tickDebugTimer]);

  // If user has zero projects, route directly to zero-project onboarding / home view
  const shouldRenderHome = activeView === 'home' || userProjects.length === 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#09090B] text-zinc-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Fixed Navigation */}
      <Navbar />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {shouldRenderHome ? (
          <WelcomeHomeView />
        ) : (
          <>
            {activeView === 'dashboard' && <DashboardView />}
            {activeView === 'ledger' && <LedgerView />}
            {activeView === 'ownership' && <OwnershipView />}
            {activeView === 'simulator' && <BurnSimulator />}
            {activeView === 'audit' && <AuditView />}
            {activeView === 'settings' && <SettingsView />}
          </>
        )}
      </main>

      {/* Global Interactive Overlays */}
      <CommandPalette />
      <AddExpenseModal
        open={addExpenseModalOpen}
        onClose={() => setAddExpenseModalOpen(false)}
      />
      <AddRevenueModal
        open={addRevenueModalOpen}
        onClose={() => setAddRevenueModalOpen(false)}
      />
      <AddStakeholderModal
        open={addStakeholderModalOpen}
        onClose={() => setAddStakeholderModalOpen(false)}
      />
      <AddFundingRoundModal
        open={addFundingRoundModalOpen}
        onClose={() => setAddFundingRoundModalOpen(false)}
      />
      <CreateProjectModal
        open={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
      />
      <DeleteProjectModal />

      {/* High-density Minimalist Developer Footer */}
      <footer className="border-t border-zinc-800/60 py-4 px-4 sm:px-6 bg-[#09090B]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>DevSpend v2.1.0 — GitHub Sharded FinOps Engine (`PublicUsersData/`)</span>
          </div>
          <div className="flex items-center gap-4">
            <span>200 Users/Shard Pipeline</span>
            <span>•</span>
            <span>PBKDF2-100k + HMAC-SHA256</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthGuard>
      <AppContent />
    </AuthGuard>
  );
};

export default App;
