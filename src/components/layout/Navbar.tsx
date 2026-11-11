import React, { useRef, useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Layers,
  Sparkles,
  ChevronDown,
  Plus,
  Terminal,
  Bug,
  FolderOpen,
  FolderPlus,
  FolderEdit,
  DollarSign,
  Trash2,
  LogOut,
  Shield,
  Home,
  PieChart,
} from 'lucide-react';
import { useSpendStore, useActiveProject, useUserProjects } from '../../store/useSpendStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Currency, AppView } from '../../types';
import { formatCurrency, formatDuration } from '../../utils/formatters';
import PortalDropdown from '../ui/PortalDropdown';
import TopRightThemeSwitcher from './TopRightThemeSwitcher';
import DataExportDropdown from './DataExportDropdown';
import AndroidApkDownloadButton from './AndroidApkDownloadButton';

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
};

export const Navbar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    setActiveProject,
    setCommandPaletteOpen,
    setAddExpenseModalOpen,
    setCreateProjectModalOpen,
    setDeleteProjectModal,
    setEditProjectModal,
    activeDebugTimer,
    updateProject,
  } = useSpendStore();

  const { currentUser, logout } = useAuthStore();
  const userProjects = useUserProjects(currentUser?.id);
  const activeProject = useActiveProject(currentUser?.id);
  const hasActiveProject = Boolean(
    activeProject && userProjects.some((p) => p.id === activeProject.id)
  );

  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const projectTriggerRef = useRef<HTMLButtonElement>(null);
  const currencyTriggerRef = useRef<HTMLButtonElement>(null);
  const userTriggerRef = useRef<HTMLButtonElement>(null);

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
  ];

  return (
    <header className="sticky top-0 z-[100] w-full max-w-full border-b border-zinc-800/80 bg-[#09090B]/95 backdrop-blur-md font-sans overflow-visible pt-[env(safe-area-inset-top)]">
      <div className="overflow-x-auto no-scrollbar whitespace-nowrap overscroll-x-contain flex items-center justify-between gap-2 sm:gap-3 w-full max-w-full px-3 sm:px-4 h-14">
        {/* Zone 1: Left Brand / Logo + Project Switcher */}
        <div className="flex items-center gap-2 lg:gap-2.5 shrink-0">
          {/* Logo */}
          <div
            onClick={() => setActiveView('home')}
            className="flex items-center gap-2 cursor-pointer group shrink-0"
            title="DevSpend Home"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-emerald-950 font-mono shrink-0">
              DS
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-100 group-hover:text-white font-sans whitespace-nowrap">
              Dev<span className="text-emerald-400">Spend</span>
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-800 hidden md:block shrink-0" />

          {/* Project Switcher Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="relative shrink-0">
              <button
                ref={projectTriggerRef}
                type="button"
                onClick={() => {
                  setCurrencyDropdownOpen(false);
                  setUserDropdownOpen(false);
                  setProjectDropdownOpen((prev) => !prev);
                }}
                className="flex items-center gap-1.5 h-8 lg:h-9 px-2 lg:px-2.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-xs font-medium text-zinc-200 transition-colors cursor-pointer shrink-0"
                title="Switch Active Project Workspace"
              >
                <FolderOpen size={13} className="text-emerald-400 shrink-0" />
                <span className="truncate max-w-[85px] sm:max-w-[110px] xl:max-w-[130px] font-mono">
                  {activeProject?.name || (userProjects.length > 0 ? 'Select Project' : 'Zero Projects')}
                </span>
                <ChevronDown size={11} className="text-zinc-500 shrink-0" />
              </button>

              <PortalDropdown
                isOpen={projectDropdownOpen}
                onClose={() => setProjectDropdownOpen(false)}
                triggerRef={projectTriggerRef}
                align="left"
                className="w-64 max-w-[calc(100vw-16px)] rounded-xl bg-[#121215]/95 backdrop-blur-md border border-zinc-700/80 shadow-2xl p-1.5 space-y-1 animate-in fade-in duration-150 overflow-y-auto"
              >
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
                        type="button"
                        onClick={() => {
                          setActiveProject(p.id);
                          setProjectDropdownOpen(false);
                        }}
                        className="truncate flex-1 text-left cursor-pointer"
                      >
                        <div className="truncate font-semibold">{p.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono truncate">
                          Rate: {p.currency} {p.hourlyDevRate}/hr
                        </div>
                      </button>
                      <div className="flex items-center gap-1 pl-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectDropdownOpen(false);
                            setEditProjectModal(true, p.id);
                          }}
                          className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60 rounded cursor-pointer"
                          title="Edit Project Settings"
                        >
                          <FolderEdit size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectDropdownOpen(false);
                            setDeleteProjectModal(true, p.id);
                          }}
                          className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer"
                          title="Delete Project & Ledger"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}

                <div className="pt-1 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setProjectDropdownOpen(false);
                      setCreateProjectModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Create New Project</span>
                  </button>
                </div>
              </PortalDropdown>
            </div>

            {/* Quick Project New Button (visible on 2xl only) */}
            <button
              type="button"
              onClick={() => setCreateProjectModalOpen(true)}
              className="hidden 2xl:flex items-center gap-1 h-8 px-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
              title="Create New Project"
            >
              <FolderPlus size={13} className="text-emerald-400 shrink-0" />
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Zone 2: Center Navigation Tabs (Project-Gated) */}
        {hasActiveProject ? (
          <nav className="flex items-center gap-1 lg:gap-1.5 shrink-0 py-1 px-1 bg-zinc-900/90 border border-zinc-800/80 rounded-xl">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 px-2.5 lg:px-3 py-1.5 text-xs lg:text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  <span className="w-4 h-4 shrink-0 flex items-center justify-center">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl shrink-0 bg-zinc-900/60 border border-zinc-800/70 text-xs font-mono text-zinc-400">
            <button
              type="button"
              onClick={() => setActiveView('home')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200 font-medium font-sans hover:text-white transition-colors cursor-pointer"
            >
              <Home size={14} className="text-emerald-400" />
              <span>Projects</span>
            </button>
            <span className="text-zinc-600">|</span>
            <span className="text-[11px] text-zinc-500">
              Select or create a project to unlock workspace
            </span>
          </div>
        )}

        {/* Zone 3: Right Controls & Currency Dropdown */}
        <div className="shrink-0 flex items-center gap-1.5 lg:gap-2">
          {/* Live Debug Timer pill if active */}
          {activeDebugTimer && (
            <button
              type="button"
              onClick={() => setActiveView('ledger')}
              className="hidden 2xl:flex items-center gap-1.5 h-8 lg:h-9 px-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono animate-pulse hover:bg-rose-500/20 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              title="Active Debugging Timer"
            >
              <Bug size={12} className="text-rose-400 shrink-0" />
              <span>{formatDuration(elapsedSeconds)}</span>
              <span className="font-bold text-rose-400">
                ({formatCurrency(currentDebugCost, currency)})
              </span>
            </button>
          )}

          {/* Currency Switcher */}
          <div className="relative shrink-0">
            <button
              ref={currencyTriggerRef}
              type="button"
              onClick={() => {
                setProjectDropdownOpen(false);
                setUserDropdownOpen(false);
                setCurrencyDropdownOpen((prev) => !prev);
              }}
              className="h-8 lg:h-9 px-2 lg:px-2.5 text-xs lg:text-sm whitespace-nowrap shrink-0 flex items-center gap-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono transition-colors cursor-pointer"
              title="Change Display Currency"
            >
              <DollarSign size={12} className="text-zinc-500 shrink-0" />
              <span>{CURRENCY_SYMBOLS[currency]} {currency}</span>
              <ChevronDown size={10} className="text-zinc-500 shrink-0" />
            </button>

            <PortalDropdown
              isOpen={currencyDropdownOpen}
              onClose={() => setCurrencyDropdownOpen(false)}
              triggerRef={currencyTriggerRef}
              align="right"
              className="min-w-[160px] max-w-[calc(100vw-16px)] rounded-xl bg-[#121215]/95 backdrop-blur-md border border-zinc-700/80 shadow-2xl p-1.5 space-y-0.5 animate-in fade-in duration-150 font-mono text-xs overflow-y-auto"
            >
              {(['USD', 'EUR', 'GBP', 'INR'] as Currency[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCurrencyChange(c)}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-left transition-colors flex items-center justify-between cursor-pointer ${
                    currency === c
                      ? 'bg-emerald-600/20 text-emerald-300'
                      : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                  }`}
                >
                  <span>{CURRENCY_SYMBOLS[c]} {c}</span>
                  {currency === c && <span>✓</span>}
                </button>
              ))}
            </PortalDropdown>
          </div>

          {/* Quick Cmd+K Button */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="h-8 lg:h-9 px-2 lg:px-2.5 flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            title="Open Command Palette (Cmd+K)"
          >
            <Terminal size={12} className="shrink-0" />
            <kbd className="hidden 2xl:inline font-mono text-[10px] bg-zinc-800 px-1.5 py-0.2 rounded border border-zinc-700">
              ⌘K
            </kbd>
          </button>

          {/* Data / Export Dropdown */}
          <DataExportDropdown />

          {/* Android APK Download Button (Only visible on Android web browsers) */}
          <AndroidApkDownloadButton />

          {/* Top-Right Interactive 15-Theme Studio Switcher */}
          <TopRightThemeSwitcher />

          {/* Quick Log Expense button */}
          <button
            type="button"
            onClick={() => {
              if (hasActiveProject) {
                setAddExpenseModalOpen(true);
              } else {
                setCreateProjectModalOpen(true);
              }
            }}
            className="btn-primary h-8 lg:h-9 px-2.5 text-xs font-medium shrink-0 flex items-center gap-1 cursor-pointer whitespace-nowrap"
            title={hasActiveProject ? "Log New Expense" : "Create Project to Unlock Expense Logging"}
          >
            <Plus size={13} className="shrink-0" />
            <span className="hidden sm:inline">{hasActiveProject ? 'Add' : 'New Project'}</span>
          </button>

          {/* User Profile Pill & Dropdown */}
          <div className="relative shrink-0">
            <button
              ref={userTriggerRef}
              type="button"
              onClick={() => {
                setProjectDropdownOpen(false);
                setCurrencyDropdownOpen(false);
                setUserDropdownOpen((prev) => !prev);
              }}
              className="h-8 lg:h-9 px-1.5 lg:px-2 flex items-center gap-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 transition-all cursor-pointer shrink-0 whitespace-nowrap"
              title="User Account"
            >
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-5 h-5 rounded-md object-cover ring-1 ring-zinc-700 shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-300 text-[10px] font-bold shrink-0">
                  {currentUser?.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="text-xs font-mono text-zinc-300 hidden 2xl:inline max-w-[80px] truncate">
                {currentUser?.displayName || currentUser?.username}
              </span>
              <ChevronDown size={10} className="text-zinc-500 shrink-0" />
            </button>

            <PortalDropdown
              isOpen={userDropdownOpen}
              onClose={() => setUserDropdownOpen(false)}
              triggerRef={userTriggerRef}
              align="right"
              className="w-56 max-w-[calc(100vw-16px)] rounded-xl bg-[#121215]/95 backdrop-blur-md border border-zinc-700/80 shadow-2xl p-2 space-y-1 animate-in fade-in duration-150 font-sans text-xs overflow-y-auto"
            >
              <div className="px-2 py-1.5 border-b border-zinc-800">
                <p className="text-xs font-semibold text-zinc-200 truncate">
                  {currentUser?.displayName || currentUser?.username}
                </p>
                <p className="text-[10px] text-zinc-400 font-mono truncate">
                  {currentUser?.email || `${currentUser?.username}@devspend.local`}
                </p>
                <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                  <Shield size={10} />
                  <span>{currentUser?.authProvider?.toUpperCase() || 'PASSWORD'} AUTH</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUserDropdownOpen(false);
                  setActiveView('home');
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors text-left cursor-pointer"
              >
                <Layers size={13} />
                <span>Workspace Projects</span>
              </button>

              {activeProject && (
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    setEditProjectModal(true, activeProject.id);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors text-left cursor-pointer"
                >
                  <FolderEdit size={13} className="text-cyan-400" />
                  <span>Project Details & Rate</span>
                </button>
              )}

              <div className="pt-1 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            </PortalDropdown>
          </div>
        </div>
      </div>

      {/* Responsive Sub-Tier Navigation Bar for < 1024px (Tablets & Split-Screen) */}
      {hasActiveProject && (
        <div className="hidden md:flex lg:hidden border-t border-zinc-800/80 px-3 sm:px-4 py-1.5 overflow-x-auto no-scrollbar bg-[#09090B]/98">
          <div className="flex items-center gap-1.5 min-w-0 mx-auto">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
