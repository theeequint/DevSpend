import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Play,
  Square,
  Sparkles,
  Sun,
  Moon,
  Download,
  FolderSync,
  FolderPlus,
  Layers,
  ArrowRight,
  Terminal,
  CornerDownLeft,
  Home,
  Trash2,
  LogOut,
  PieChart,
  TrendingUp,
} from 'lucide-react';
import { useSpendStore, useActiveProject, useUserProjects } from '../../store/useSpendStore';
import { useAuthStore } from '../../store/useAuthStore';
import { exportToJSON, normalizeToMonthly } from '../../utils/formatters';
import { THEMES, applyThemeToDOM, ThemeId } from '../../config/themes';

interface CommandOption {
  id: string;
  category: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setAddExpenseModalOpen,
    setAddRevenueModalOpen,
    setAddStakeholderModalOpen,
    setCreateProjectModalOpen,
    setDeleteProjectModal,
    setActiveView,
    activeDebugTimer,
    startDebugTimer,
    stopAndLogDebugTimer,
    setActiveProject,
    toggleDarkMode,
    settings,
    updateSettings,
    exportFullState,
  } = useSpendStore();

  const { currentUser, logout } = useAuthStore();
  const userProjects = useUserProjects(currentUser?.id);
  const activeProject = useActiveProject(currentUser?.id);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        e.preventDefault();
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  // Focus input when opened
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  // Build command list dynamically
  const commands: CommandOption[] = [
    {
      id: 'go_home',
      category: 'Navigation',
      label: 'Projects & Workspaces Hub',
      description: 'Zero-project onboarding, blueprints, and portfolio grid',
      icon: <Home size={16} className="text-emerald-400" />,
      shortcut: 'H',
      action: () => {
        setCommandPaletteOpen(false);
        setActiveView('home');
      },
    },
    {
      id: 'create_project',
      category: 'Actions',
      label: 'Create New Project',
      description: 'Initialize a new project workspace with custom budget & tech stack',
      icon: <FolderPlus size={16} className="text-emerald-400" />,
      shortcut: 'P',
      action: () => {
        setCommandPaletteOpen(false);
        setCreateProjectModalOpen(true);
      },
    },
    {
      id: 'new_revenue',
      category: 'Actions',
      label: 'New Revenue / Funds',
      description: 'Record recurring MRR, client contracts, grants, or capital additions',
      icon: <TrendingUp size={16} className="text-emerald-400" />,
      shortcut: 'R',
      action: () => {
        setCommandPaletteOpen(false);
        setAddRevenueModalOpen(true);
      },
    },
    {
      id: 'new_stakeholder',
      category: 'Actions',
      label: 'New Stakeholder / Equity',
      description: 'Register founder, angel investor, SAFE, or ESOP option pool',
      icon: <PieChart size={16} className="text-teal-400" />,
      shortcut: 'K',
      action: () => {
        setCommandPaletteOpen(false);
        setAddStakeholderModalOpen(true);
      },
    },
    {
      id: 'new_expense',
      category: 'Actions',
      label: 'New Expense',
      description: 'Log a vendor subscription, API usage, or one-time fee',
      icon: <Plus size={16} className="text-violet-400" />,
      shortcut: 'N',
      action: () => {
        setCommandPaletteOpen(false);
        setAddExpenseModalOpen(true);
      },
    },
    {
      id: 'toggle_timer',
      category: 'Actions',
      label: activeDebugTimer?.running ? 'Stop Debug Timer' : 'Start Debug Timer',
      description: activeDebugTimer?.running
        ? 'Stop ticking cost clock and append session to ledger'
        : 'Launch live bug clock to track real-time dev time burn',
      icon: activeDebugTimer?.running ? (
        <Square size={16} className="text-rose-400" />
      ) : (
        <Play size={16} className="text-emerald-400" />
      ),
      shortcut: 'T',
      action: () => {
        setCommandPaletteOpen(false);
        if (activeDebugTimer?.running) {
          stopAndLogDebugTimer();
        } else {
          startDebugTimer({
            projectId: activeProject?.id ?? '',
            ownerUserId: currentUser?.id || activeProject?.ownerUserId || 'user_demo',
            description: 'Quick Bug Triage Session',
            component: 'Active Module',
            severity: 'medium',
          });
          setActiveView('ledger');
        }
      },
    },
    {
      id: 'run_audit',
      category: 'FinOps',
      label: 'Run AI FinOps Audit',
      description: 'Analyze stack for tier downgrades and architecture swaps',
      icon: <Sparkles size={16} className="text-violet-400" />,
      shortcut: 'A',
      action: () => {
        setCommandPaletteOpen(false);
        setActiveView('audit');
      },
    },
    {
      id: 'view_simulator',
      category: 'Navigation',
      label: 'Scaling & Traffic Simulator',
      description: 'Interactive what-if forecasting and free-tier cliff analysis',
      icon: <Layers size={16} className="text-cyan-400" />,
      shortcut: 'S',
      action: () => {
        setCommandPaletteOpen(false);
        setActiveView('simulator');
      },
    },
    {
      id: 'view_ledger',
      category: 'Navigation',
      label: 'View Financial Ledger',
      description: 'Triple-tab cashflow statement, revenues, and expense data grid',
      icon: <Terminal size={16} className="text-amber-400" />,
      shortcut: 'L',
      action: () => {
        setCommandPaletteOpen(false);
        setActiveView('ledger');
      },
    },
    {
      id: 'view_ownership',
      category: 'Navigation',
      label: 'Ownership & Cap Table',
      description: 'Equity capitalization, stakeholder registry, and dilution simulator',
      icon: <PieChart size={16} className="text-emerald-400" />,
      shortcut: 'O',
      action: () => {
        setCommandPaletteOpen(false);
        setActiveView('ownership');
      },
    },
    {
      id: 'view_dashboard',
      category: 'Navigation',
      label: 'Executive Dashboard',
      description: 'Unit economics, runway counter, and burn chart',
      icon: <FolderSync size={16} className="text-emerald-400" />,
      shortcut: 'D',
      action: () => {
        setCommandPaletteOpen(false);
        setActiveView('dashboard');
      },
    },
    {
      id: 'toggle_theme',
      category: 'Appearance',
      label: 'Toggle Dark / Light Theme',
      description: `Switch current theme (currently ${settings.darkMode ? 'Obsidian Dark' : 'Light'})`,
      icon: settings.darkMode ? (
        <Sun size={16} className="text-amber-400" />
      ) : (
        <Moon size={16} className="text-violet-400" />
      ),
      action: () => {
        toggleDarkMode();
      },
    },

    ...THEMES.map((th) => ({
      id: `theme_${th.id}`,
      category: 'Appearance / Themes',
      label: `Switch Theme: ${th.name}`,
      description: `${th.tagline} (${th.isDark ? 'Dark' : 'Light'})`,
      icon: (
        <span
          className="w-3 h-3 rounded-full inline-block border border-white/20 shadow-sm"
          style={{ backgroundColor: th.colors.accentPrimary }}
        />
      ),
      action: () => {
        setCommandPaletteOpen(false);
        updateSettings({
          activeTheme: th.id,
          darkMode: th.isDark,
        });
        try {
          localStorage.setItem('devspend_active_theme', th.id);
        } catch {}
        applyThemeToDOM(
          th.id as ThemeId,
          settings.gradientIntensity || 'subtle',
          settings.cardGlow || 'subtle'
        );
      },
    })),
    {
      id: 'export_ledger',
      category: 'Data',
      label: 'Export Ledger & State (JSON)',
      description: 'Download complete timestamped backup snapshot',
      icon: <Download size={16} className="text-emerald-400" />,
      shortcut: 'E',
      action: () => {
        setCommandPaletteOpen(false);
        exportToJSON(exportFullState(), `devspend-backup-${Date.now()}.json`);
      },
    },
    ...(activeProject
      ? [
          {
            id: 'delete_project',
            category: 'Actions',
            label: `Delete Project: ${activeProject.name}`,
            description: 'Permanently purge project, expenses, debug sessions & audits',
            icon: <Trash2 size={16} className="text-rose-400" />,
            action: () => {
              setCommandPaletteOpen(false);
              setDeleteProjectModal(true, activeProject.id);
            },
          },
        ]
      : []),
    {
      id: 'sign_out',
      category: 'Account',
      label: 'Sign Out of DevSpend',
      description: `End authenticated session for ${currentUser?.displayName || currentUser?.username || 'user'}`,
      icon: <LogOut size={16} className="text-rose-400" />,
      action: () => {
        setCommandPaletteOpen(false);
        logout();
      },
    },
    // Project switchers
    ...userProjects.map((p) => ({
      id: `proj_${p.id}`,
      category: 'Switch Project',
      label: `Switch to: ${p.name}`,
      description: `${p.techStack.slice(0, 3).join(', ')} • ${p.status.toUpperCase()} tier`,
      icon: <Layers size={16} className="text-zinc-400" />,
      action: () => {
        setActiveProject(p.id);
        setCommandPaletteOpen(false);
      },
    })),
  ];

  // Filter commands by query
  const filtered = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  // Handle arrow key navigation & Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(filtered.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(filtered.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    }
  };

  return (
    <div
      onClick={() => setCommandPaletteOpen(false)}
      className="fixed inset-0 z-50 flex items-end sm:items-start justify-center p-0 sm:pt-24 sm:px-4 bg-black/75 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-t-3xl sm:rounded-2xl bg-[#121215] border border-zinc-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[85dvh] sm:max-h-[600px] animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 pb-[env(safe-area-inset-bottom)] sm:pb-0"
      >
        <div className="w-12 h-1.5 rounded-full bg-zinc-600/50 mx-auto my-2.5 sm:hidden shrink-0" />
        {/* Search Input Box */}
        <div className="flex items-center px-4 py-3.5 border-b border-zinc-800 gap-3">
          <Search size={18} className="text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search actions..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none font-sans"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Command List Results */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No matching commands found.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-violet-600/20 border border-violet-500/40 text-zinc-100'
                      : 'hover:bg-zinc-800/60 text-zinc-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0">{cmd.icon}</span>
                    <div className="truncate">
                      <div className="text-xs font-semibold truncate flex items-center gap-2">
                        <span>{cmd.label}</span>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">
                          • {cmd.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate">
                        {cmd.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cmd.shortcut && (
                      <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <CornerDownLeft size={13} className="text-violet-400" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950/80 border-t border-zinc-800/80 text-[11px] text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <span>↑↓ to navigate</span>
            <span>•</span>
            <span>↵ to select</span>
          </div>
          <span>DevSpend Quick Palette</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
