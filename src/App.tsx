import React, { useEffect } from 'react';
import { useSpendStore } from './store/useSpendStore';
import Navbar from './components/layout/Navbar';
import DashboardView from './components/dashboard/DashboardView';
import LedgerView from './components/ledger/LedgerView';
import BurnSimulator from './components/simulator/BurnSimulator';
import AuditView from './components/audit/AuditView';
import SettingsView from './components/settings/SettingsView';
import CommandPalette from './components/palette/CommandPalette';
import AddExpenseModal from './components/ledger/AddExpenseModal';
import CreateProjectModal from './components/project/CreateProjectModal';

export const App: React.FC = () => {
  const {
    activeView,
    settings,
    activeDebugTimer,
    tickDebugTimer,
    addExpenseModalOpen,
    setAddExpenseModalOpen,
    createProjectModalOpen,
    setCreateProjectModalOpen,
  } = useSpendStore();

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

  return (
    <div className="min-h-screen flex flex-col bg-[#09090B] text-zinc-100 font-sans selection:bg-violet-500/30 selection:text-violet-200">
      {/* Top Fixed Navigation */}
      <Navbar />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'ledger' && <LedgerView />}
        {activeView === 'simulator' && <BurnSimulator />}
        {activeView === 'audit' && <AuditView />}
        {activeView === 'settings' && <SettingsView />}
      </main>

      {/* Global Interactive Overlays */}
      <CommandPalette />
      <AddExpenseModal
        open={addExpenseModalOpen}
        onClose={() => setAddExpenseModalOpen(false)}
      />
      <CreateProjectModal
        open={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
      />

      {/* High-density Minimalist Developer Footer */}
      <footer className="border-t border-zinc-800/60 py-4 px-4 sm:px-6 bg-[#09090B]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>DevSpend v1.0.0 — Developer FinOps Engine</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Press ⌘K for Command Palette</span>
            <span>•</span>
            <span>Local-First Persistence Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
