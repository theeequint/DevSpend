import React, { useEffect } from 'react';
import { useSpendStore, useUserProjects } from './store/useSpendStore';
import { useAuthStore } from './store/useAuthStore';
import { AuthGuard } from './components/auth/AuthGuard';
import Navbar from './components/layout/Navbar';
import MobileBottomNav from './components/layout/MobileBottomNav';
import MobileQuickActionFab from './components/layout/MobileQuickActionFab';
import MobileDebugTimerBar from './components/layout/MobileDebugTimerBar';
import { WelcomeHomeView } from './components/onboarding/WelcomeHomeView';
import DashboardView from './components/dashboard/DashboardView';
import LedgerView from './components/ledger/LedgerView';
import OwnershipView from './components/ownership/OwnershipView';
import BurnSimulator from './components/simulator/BurnSimulator';
import AuditView from './components/audit/AuditView';
import EditProjectModal from './components/project/EditProjectModal';
import CommandPalette from './components/palette/CommandPalette';
import AddExpenseModal from './components/ledger/AddExpenseModal';
import AddRevenueModal from './components/ledger/AddRevenueModal';
import AddStakeholderModal from './components/ownership/AddStakeholderModal';
import AddFundingRoundModal from './components/ownership/AddFundingRoundModal';
import CreateProjectModal from './components/project/CreateProjectModal';
import { DeleteProjectModal } from './components/project/DeleteProjectModal';
import { applyThemeToDOM, DEFAULT_THEME_ID, ThemeId } from './config/themes';

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
    editProjectModalOpen,
    setEditProjectModal,
    projectToEditId,
    projects,
  } = useSpendStore();

  const { currentUser } = useAuthStore();
  const userProjects = useUserProjects(currentUser?.id);

  // Sync dynamic theme on <html>
  useEffect(() => {
    let savedTheme: string | null = null;
    try {
      savedTheme = localStorage.getItem('devspend_active_theme');
    } catch {
      //
    }
    const themeToApply = (settings.activeTheme || savedTheme || DEFAULT_THEME_ID) as ThemeId;
    applyThemeToDOM(
      themeToApply,
      settings.gradientIntensity || 'subtle',
      settings.cardGlow || 'subtle'
    );
  }, [settings.activeTheme, settings.gradientIntensity, settings.cardGlow, settings.darkMode]);

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
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-28 md:pb-12">
        {shouldRenderHome ? (
          <WelcomeHomeView />
        ) : (
          <>
            {activeView === 'dashboard' && <DashboardView />}
            {activeView === 'ledger' && <LedgerView />}
            {activeView === 'ownership' && <OwnershipView />}
            {activeView === 'simulator' && <BurnSimulator />}
            {activeView === 'audit' && <AuditView />}
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
      <EditProjectModal
        open={editProjectModalOpen}
        onClose={() => setEditProjectModal(false)}
        project={projects.find((p) => p.id === projectToEditId) || null}
      />

      {/* High-density Minimalist Developer Footer */}
      {/* Mobile-Only Native Bottom Navigation, Quick FAB & Debug Island */}
      <MobileDebugTimerBar />
      <MobileQuickActionFab />
      <MobileBottomNav />

      {/* High-density Minimalist Developer Footer (Desktop only) */}
      <footer className="hidden md:block border-t border-zinc-800/60 py-4 px-4 sm:px-6 bg-[#09090B]">
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
