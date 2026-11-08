import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Layers,
  Sparkles,
  Settings,
  ChevronDown,
  Plus,
  Terminal,
  Sun,
  Moon,
  Bug,
  FolderOpen,
  FolderPlus,
  DollarSign,
  Trash2,
  LogOut,
  User,
  Shield,
  Home,
  Database,
  PieChart,
} from 'lucide-react';
import { useSpendStore, useActiveProject, useUserProjects } from '../../store/useSpendStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Currency, AppView } from '../../types';
import { formatCurrency, formatDuration } from '../../utils/formatters';

export const Navbar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    setActiveProject,
    setCommandPaletteOpen,
    setAddExpenseModalOpen,
    setCreateProjectModalOpen,
    setDeleteProjectModal,
    activeDebugTimer,
    settings,
    toggleDarkMode,
    updateProject,
  } = useSpendStore();

  const { currentUser, logout, shardSyncStatus, syncShards } = useAuthStore();
  const userProjects = useUserProjects(currentUser?.id);
  const activeProject = useActiveProject(currentUser?.id);

  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const currency = activeProject?.currency ?? 'USD';
  const hourlyRate = activeProject?.hourlyDevRate ?? 60;
  const elapsedSeconds = activeDebugTimer?.elapsedSeconds ?? 0;
  const currentDebugCost = (elapsedSeconds / 3600) * hourlyRate;

  const handleCurrencyChange = (curr: Currency) => {
    if (activeProject) {
      updateProject(activeProject.id, { currency: curr });
    }
    setCurrencyDropdownOpen(false);
  };

  const navItems: { id: AppView; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Projects', icon: <Home size={14} /> },
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={14} /> },
    { id: 'ledger', label: 'Ledger', icon: <Receipt size={14} /> },
    { id: 'ownership', label: 'Ownership', icon: <PieChart size={14} /> },
    { id: 'simulator', label: 'Simulator', icon: <Layers size={14} /> },
    { id: 'audit', label: 'AI Auditor', icon: <Sparkles size={14} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={14} /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#09090B]/95 backdrop-blur-md font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 gap-3">
        {/* Left: Brand + Project Switcher */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div
            onClick={() => setActiveView('home')}
            className="flex items-center gap-2 cursor-pointer group shrink-0"
            title="DevSpend Home"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-emerald-950 font-mono">
              DS
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-100 group-hover:text-white font-sans hidden sm:inline">
              Dev<span className="text-emerald-400">Spend</span>
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

          {/* Project Switcher Dropdown */}
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <button
                onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-xs font-medium text-zinc-200 transition-colors"
              >
                <FolderOpen size={13} className="text-emerald-400 shrink-0" />
                <span className="truncate max-w-[130px] font-mono">
                  {activeProject?.name || (userProjects.length > 0 ? 'Select Project' : 'Zero Projects')}
                </span>
                <ChevronDown size={12} className="text-zinc-500" />
              </button>

              {projectDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setProjectDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-1.5 w-64 rounded-xl bg-[#121215] border border-zinc-700 shadow-2xl p-1.5 z-30 space-y-1 animate-in fade-in duration-150">
                    <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                      Workspaces ({userProjects.length})
                    </div>
                    {userProjects.length === 0 ? (
                      <div className="px-2.5 py-2 text-xs text-zinc-500 font-mono">
                        No projects found.
                      </div>
                    ) : (
                      userProjects.map((p) => (
                        <div
                          key={p.id}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                            p.id === activeProject?.id
                              ? 'bg-emerald-600/20 text-emerald-200 border border-emerald-500/30'
                              : 'hover:bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          <button
                            onClick={() => {
                              setActiveProject(p.id);
                              setProjectDropdownOpen(false);
                            }}
                            className="truncate flex-1 text-left"
                          >
                            <div className="font-semibold truncate">{p.name}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              {p.status.toUpperCase()} • {p.currency}
                            </div>
                          </button>
                          {p.id === activeProject?.id && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          )}
                        </div>
                      ))
                    )}

                    <div className="pt-1 mt-1 border-t border-zinc-800 space-y-0.5">
                      <button
                        onClick={() => {
                          setProjectDropdownOpen(false);
                          setCreateProjectModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-600/20 transition-colors"
                      >
                        <Plus size={14} />
                        <span>+ Create New Project</span>
                      </button>

                      {activeProject && (
                        <button
                          onClick={() => {
                            setProjectDropdownOpen(false);
                            setDeleteProjectModal(true, activeProject.id);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-600/20 transition-colors"
                        >
                          <Trash2 size={13} />
                          <span>Delete Current Project</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick button to create new project */}
            <button
              onClick={() => setCreateProjectModalOpen(true)}
              title="Create New Project"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <FolderPlus size={13} className="text-emerald-400" />
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Center: Navigation Bar Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-900/90 border border-zinc-800/80 p-1 rounded-xl">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Actions, Live Timer Pill, Currency Switcher, Cmd+K, User Pill */}
        <div className="flex items-center gap-2">
          {/* Live Debug Timer pill if active */}
          {activeDebugTimer && (
            <button
              onClick={() => setActiveView('ledger')}
              className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono animate-pulse hover:bg-rose-500/20 transition-colors"
            >
              <Bug size={12} className="text-rose-400" />
              <span>{formatDuration(elapsedSeconds)}</span>
              <span className="font-bold text-rose-400">
                ({formatCurrency(currentDebugCost, currency)})
              </span>
            </button>
          )}

          {/* Currency Switcher */}
          <div className="relative">
            <button
              onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 transition-colors"
              title="Change Display Currency"
            >
              <DollarSign size={12} className="text-zinc-500" />
              <span>{currency}</span>
              <ChevronDown size={10} className="text-zinc-500" />
            </button>

            {currencyDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setCurrencyDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-32 rounded-xl bg-[#121215] border border-zinc-700 shadow-2xl p-1 z-30 space-y-0.5 animate-in fade-in duration-150 font-mono text-xs">
                  {(['USD', 'EUR', 'GBP', 'INR'] as Currency[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => handleCurrencyChange(c)}
                      className={`w-full px-2 py-1.5 rounded-lg text-left transition-colors flex items-center justify-between ${
                        currency === c
                          ? 'bg-emerald-600/20 text-emerald-300'
                          : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                      }`}
                    >
                      <span>{c}</span>
                      {currency === c && <span>✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Quick Cmd+K Button */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Open Command Palette (Cmd+K)"
          >
            <Terminal size={12} />
            <kbd className="hidden sm:inline font-mono text-[10px] bg-zinc-800 px-1.5 py-0.2 rounded border border-zinc-700">
              ⌘K
            </kbd>
          </button>

          {/* GitHub Shard Sync Status Pill */}
          <button
            onClick={() => syncShards()}
            className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all ${
              shardSyncStatus === 'syncing'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse'
                : shardSyncStatus === 'synced'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="GitHub-Backed User Shards (Max 200/file). Click to force sync."
          >
            <Database size={11} className={shardSyncStatus === 'syncing' ? 'animate-spin' : ''} />
            <span>
              {shardSyncStatus === 'syncing'
                ? 'SYNCING...'
                : shardSyncStatus === 'synced'
                ? 'SHARDS: SYNCED'
                : 'SHARDS: LOCAL'}
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Toggle theme"
          >
            {settings.darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Quick Log Expense button */}
          <button
            onClick={() => setAddExpenseModalOpen(true)}
            className="btn-primary py-1 px-2.5 text-xs font-medium shrink-0 flex items-center gap-1"
          >
            <Plus size={13} />
            <span className="hidden sm:inline">Add</span>
          </button>

          {/* User Profile Pill & Sign Out */}
          <div className="relative pl-1">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 transition-all"
              title="User Account"
            >
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-6 h-6 rounded-lg object-cover ring-1 ring-zinc-700"
                />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 text-[11px] font-bold">
                  {currentUser?.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="text-xs font-mono text-zinc-300 hidden md:inline max-w-[90px] truncate">
                {currentUser?.displayName || currentUser?.username}
              </span>
              <ChevronDown size={11} className="text-zinc-500" />
            </button>

            {userDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setUserDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-[#121215] border border-zinc-700 shadow-2xl p-2 z-30 space-y-1 animate-in fade-in duration-150">
                  <div className="px-2 py-1.5 border-b border-zinc-800">
                    <p className="text-xs font-semibold text-zinc-200 truncate">
                      {currentUser?.displayName || currentUser?.username}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-mono truncate">
                      {currentUser?.email}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                      <Shield size={10} />
                      <span>{currentUser?.authProvider?.toUpperCase() || 'PASSWORD'} AUTH</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setActiveView('home');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors text-left"
                  >
                    <Layers size={13} />
                    <span>Workspace Projects</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setActiveView('settings');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors text-left"
                  >
                    <Settings size={13} />
                    <span>Settings & API Keys</span>
                  </button>

                  <div className="pt-1 border-t border-zinc-800">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                    >
                      <LogOut size={13} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-zinc-800/80 px-2 py-1 bg-zinc-950">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded text-[11px] font-medium ${
                isActive ? 'text-emerald-400 font-bold' : 'text-zinc-500'
              }`}
            >
              {item.icon}
              <span className="mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};

export default Navbar;
