// ============================================================
// DevSpend — Zustand Store (persistent to localStorage)
// Multi-Tenant Isolation & Cascading Project Deletion
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useMemo } from 'react';
import {
  Project,
  ExpenseItem,
  DebugSession,
  AiAuditReport,
  AppSettings,
  SimulatorParams,
  AppView,
} from '../types';
import {
  SEED_PROJECTS,
  SEED_EXPENSES,
  SEED_DEBUG_SESSIONS,
  SEED_AI_AUDIT,
  DEFAULT_SETTINGS,
} from '../data/seed';
import { generateId, isoNow, normalizeToMonthly } from '../utils/formatters';

// ============================================================
// Store shape
// ============================================================
interface DevSpendState {
  // Multi-tenant data
  projects: Project[];
  expenses: ExpenseItem[];
  debugSessions: DebugSession[];
  auditReports: AiAuditReport[];
  settings: AppSettings;

  // Live debug timer
  activeDebugTimer: {
    projectId: string;
    ownerUserId: string;
    startedAt: number; // ms timestamp
    running: boolean;
    description: string;
    component: string;
    severity: 'low' | 'medium' | 'critical';
    elapsedSeconds: number;
  } | null;

  // UI state (not persisted)
  activeView: AppView;
  commandPaletteOpen: boolean;
  addExpenseModalOpen: boolean;
  createProjectModalOpen: boolean;
  deleteProjectModalOpen: boolean;
  projectToDeleteId: string | null;
  simulatorParams: SimulatorParams;

  // ── Project actions ─────────────────────────────────────────
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string) => void;
  setDeleteProjectModal: (open: boolean, projectId?: string | null) => void;

  // ── Expense actions ─────────────────────────────────────────
  addExpense: (expense: Omit<ExpenseItem, 'id'>) => string;
  updateExpense: (id: string, updates: Partial<ExpenseItem>) => void;
  deleteExpense: (id: string) => void;
  deleteExpenses: (ids: string[]) => void;
  clearProjectExpenses: (projectId: string) => void;
  duplicateExpense: (id: string) => void;
  applyAiOptimization: (
    expenseId: string,
    newVendor: string,
    newAmount: number,
    recommendationId: string
  ) => void;

  // ── Debug timer actions ─────────────────────────────────────
  startDebugTimer: (params: {
    projectId: string;
    ownerUserId: string;
    description: string;
    component: string;
    severity: 'low' | 'medium' | 'critical';
  }) => void;
  pauseDebugTimer: () => void;
  resumeDebugTimer: () => void;
  stopAndLogDebugTimer: () => void;
  tickDebugTimer: () => void;
  logManualDebugSession: (session: Omit<DebugSession, 'id'>) => void;
  deleteDebugSession: (id: string) => void;
  clearProjectDebugSessions: (projectId: string) => void;

  // ── AI Audit actions ────────────────────────────────────────
  addAuditReport: (report: AiAuditReport) => void;
  deleteAuditReport: (id: string) => void;
  applyRecommendation: (reportId: string, recommendationId: string) => void;

  // ── Settings ────────────────────────────────────────────────
  updateSettings: (updates: Partial<AppSettings>) => void;
  toggleDarkMode: () => void;

  // ── UI actions ───────────────────────────────────────────────
  setActiveView: (view: AppView) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setAddExpenseModalOpen: (open: boolean) => void;
  setCreateProjectModalOpen: (open: boolean) => void;
  setSimulatorParams: (params: Partial<SimulatorParams>) => void;

  // ── Data portability ────────────────────────────────────────
  exportFullState: () => object;
  importFullState: (data: Partial<DevSpendState>) => void;
  resetToSeedData: () => void;
}

// ============================================================
// Store implementation
// ============================================================
export const useSpendStore = create<DevSpendState>()(
  persist(
    (set, get) => ({
      // Initial data
      projects: SEED_PROJECTS,
      expenses: SEED_EXPENSES,
      debugSessions: SEED_DEBUG_SESSIONS,
      auditReports: [SEED_AI_AUDIT],
      settings: DEFAULT_SETTINGS,
      activeDebugTimer: null,

      // Initial UI state
      activeView: 'dashboard',
      commandPaletteOpen: false,
      addExpenseModalOpen: false,
      createProjectModalOpen: false,
      deleteProjectModalOpen: false,
      projectToDeleteId: null,
      simulatorParams: {
        monthlyActiveUsers: 1000,
        avgTokensPerUser: 5000,
        headcount: 1,
        debugFrequencyPercent: 15,
      },

      // ── Project actions ───────────────────────────────────────
      addProject: (projectData) => {
        const id = `proj_${generateId()}`;
        const project: Project = {
          ...projectData,
          id,
          createdAt: isoNow(),
        };
        set(s => ({
          projects: [...s.projects, project],
          settings: { ...s.settings, activeProjectId: id },
          activeView: 'dashboard',
          createProjectModalOpen: false,
        }));
        return id;
      },

      updateProject: (id, updates) => {
        set(s => ({
          projects: s.projects.map(p => (p.id === id ? { ...p, ...updates } : p)),
        }));
      },

      deleteProject: (id) => {
        const remainingProjects = get().projects.filter(p => p.id !== id);
        const currentActive = get().settings.activeProjectId;
        const newActiveId = currentActive === id
          ? (remainingProjects[0]?.id ?? '')
          : currentActive;

        set(s => ({
          projects: remainingProjects,
          expenses: s.expenses.filter(e => e.projectId !== id),
          debugSessions: s.debugSessions.filter(d => d.projectId !== id),
          auditReports: s.auditReports.filter(a => a.projectId !== id),
          settings: {
            ...s.settings,
            activeProjectId: newActiveId,
          },
          // If no projects remain, transition automatically to home
          activeView: remainingProjects.length === 0 ? 'home' : s.activeView,
          deleteProjectModalOpen: false,
          projectToDeleteId: null,
        }));
      },

      setActiveProject: (id) => {
        set(s => ({
          settings: { ...s.settings, activeProjectId: id },
          activeView: s.activeView === 'home' ? 'dashboard' : s.activeView,
        }));
      },

      setDeleteProjectModal: (open, projectId = null) => {
        set({
          deleteProjectModalOpen: open,
          projectToDeleteId: projectId,
        });
      },

      // ── Expense actions ───────────────────────────────────────
      addExpense: (expenseData) => {
        const id = `exp_${generateId()}`;
        const expense: ExpenseItem = { ...expenseData, id };
        set(s => ({
          expenses: [...s.expenses, expense],
          addExpenseModalOpen: false,
        }));
        return id;
      },

      updateExpense: (id, updates) => {
        set(s => ({
          expenses: s.expenses.map(e => (e.id === id ? { ...e, ...updates } : e)),
        }));
      },

      deleteExpense: (id) => {
        set(s => ({ expenses: s.expenses.filter(e => e.id !== id) }));
      },

      deleteExpenses: (ids) => {
        const idSet = new Set(ids);
        set(s => ({
          expenses: s.expenses.filter(e => !idSet.has(e.id)),
        }));
      },

      clearProjectExpenses: (projectId) => {
        set(s => ({
          expenses: s.expenses.filter(e => e.projectId !== projectId),
        }));
      },

      duplicateExpense: (id) => {
        const existing = get().expenses.find(e => e.id === id);
        if (!existing) return;
        const newId = `exp_${generateId()}`;
        set(s => ({
          expenses: [
            ...s.expenses,
            {
              ...existing,
              id: newId,
              title: `${existing.title} (copy)`,
              date: isoNow(),
            },
          ],
        }));
      },

      applyAiOptimization: (expenseId, newVendor, newAmount, recommendationId) => {
        set(s => ({
          expenses: s.expenses.map(e =>
            e.id === expenseId
              ? { ...e, vendor: newVendor, amount: newAmount, isAiOptimized: true }
              : e
          ),
          auditReports: s.auditReports.map(r => ({
            ...r,
            recommendations: r.recommendations.map(rec =>
              rec.id === recommendationId ? { ...rec, applied: true } : rec
            ),
          })),
        }));
      },

      // ── Debug timer ───────────────────────────────────────────
      startDebugTimer: ({ projectId, ownerUserId, description, component, severity }) => {
        set({
          activeDebugTimer: {
            projectId,
            ownerUserId,
            startedAt: Date.now(),
            running: true,
            description,
            component,
            severity,
            elapsedSeconds: 0,
          },
        });
      },

      pauseDebugTimer: () => {
        set(s =>
          s.activeDebugTimer
            ? { activeDebugTimer: { ...s.activeDebugTimer, running: false } }
            : {}
        );
      },

      resumeDebugTimer: () => {
        set(s =>
          s.activeDebugTimer
            ? {
                activeDebugTimer: {
                  ...s.activeDebugTimer,
                  running: true,
                  startedAt: Date.now() - s.activeDebugTimer.elapsedSeconds * 1000,
                },
              }
            : {}
        );
      },

      tickDebugTimer: () => {
        set(s => {
          if (!s.activeDebugTimer?.running) return {};
          const elapsed = Math.floor((Date.now() - s.activeDebugTimer.startedAt) / 1000);
          return { activeDebugTimer: { ...s.activeDebugTimer, elapsedSeconds: elapsed } };
        });
      },

      stopAndLogDebugTimer: () => {
        const { activeDebugTimer, projects } = get();
        if (!activeDebugTimer) return;

        const project = projects.find(p => p.id === activeDebugTimer.projectId);
        const hourlyRate = project?.hourlyDevRate ?? 60;
        const durationMinutes = Math.max(1, Math.round(activeDebugTimer.elapsedSeconds / 60));
        const calculatedCost = (durationMinutes / 60) * hourlyRate;

        const session: DebugSession = {
          id: `dbg_${generateId()}`,
          projectId: activeDebugTimer.projectId,
          ownerUserId: activeDebugTimer.ownerUserId || project?.ownerUserId || 'user_demo',
          bugDescription: activeDebugTimer.description || 'Live Debugging Session',
          relatedComponent: activeDebugTimer.component || 'Application Module',
          durationMinutes,
          calculatedCost,
          timestamp: isoNow(),
          severity: activeDebugTimer.severity,
        };

        const expense: ExpenseItem = {
          id: `exp_${generateId()}`,
          projectId: activeDebugTimer.projectId,
          ownerUserId: session.ownerUserId,
          title: activeDebugTimer.description || 'Debug Session',
          vendor: 'Self-Time',
          category: 'debugging_tech_debt',
          billingCycle: 'time_logged',
          amount: calculatedCost,
          hoursLogged: durationMinutes / 60,
          usageMetric: `${durationMinutes}m @ $${hourlyRate}/hr`,
          date: isoNow(),
          isEssential: false,
          isAiOptimized: false,
          notes: `Auto-logged from debug timer. Component: ${activeDebugTimer.component}`,
        };

        set(s => ({
          debugSessions: [...s.debugSessions, session],
          expenses: [...s.expenses, expense],
          activeDebugTimer: null,
        }));
      },

      logManualDebugSession: (sessionData) => {
        const session: DebugSession = { ...sessionData, id: `dbg_${generateId()}` };
        set(s => ({ debugSessions: [...s.debugSessions, session] }));
      },

      deleteDebugSession: (id) => {
        set(s => ({
          debugSessions: s.debugSessions.filter(d => d.id !== id),
        }));
      },

      clearProjectDebugSessions: (projectId) => {
        set(s => ({
          debugSessions: s.debugSessions.filter(d => d.projectId !== projectId),
        }));
      },

      // ── AI Audit ──────────────────────────────────────────────
      addAuditReport: (report) => {
        set(s => ({
          auditReports: [report, ...s.auditReports.filter(r => r.projectId !== report.projectId)],
        }));
      },

      deleteAuditReport: (id) => {
        set(s => ({
          auditReports: s.auditReports.filter(r => r.id !== id),
        }));
      },

      applyRecommendation: (reportId, recommendationId) => {
        const { auditReports, expenses } = get();
        const report = auditReports.find(r => r.id === reportId);
        const rec = report?.recommendations.find(r => r.id === recommendationId);
        if (!rec) return;

        const updates: Partial<DevSpendState> = {
          auditReports: auditReports.map(r =>
            r.id === reportId
              ? {
                  ...r,
                  recommendations: r.recommendations.map(rx =>
                    rx.id === recommendationId ? { ...rx, applied: true } : rx
                  ),
                }
              : r
          ),
        };

        if (rec.targetExpenseId) {
          updates.expenses = expenses.map(e =>
            e.id === rec.targetExpenseId
              ? {
                  ...e,
                  vendor: rec.suggestedVendor,
                  amount: rec.suggestedMonthlyCost,
                  isAiOptimized: true,
                  notes: `${e.notes} [AI Optimized: ${rec.title}]`,
                }
              : e
          );
        }

        set(updates);
      },

      // ── Settings ──────────────────────────────────────────────
      updateSettings: (updates) => {
        set(s => ({ settings: { ...s.settings, ...updates } }));
      },

      toggleDarkMode: () => {
        set(s => ({
          settings: { ...s.settings, darkMode: !s.settings.darkMode },
        }));
      },

      // ── UI ────────────────────────────────────────────────────
      setActiveView: (view) => set({ activeView: view }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setAddExpenseModalOpen: (open) => set({ addExpenseModalOpen: open }),
      setCreateProjectModalOpen: (open) => set({ createProjectModalOpen: open }),
      setSimulatorParams: (params) => {
        set(s => ({ simulatorParams: { ...s.simulatorParams, ...params } }));
      },

      // ── Data portability ──────────────────────────────────────
      exportFullState: () => {
        const { projects, expenses, debugSessions, auditReports, settings } = get();
        return {
          version: 'devspend_v1',
          exportedAt: isoNow(),
          projects,
          expenses,
          debugSessions,
          auditReports,
          settings,
        };
      },

      importFullState: (data) => {
        set(s => ({
          projects: data.projects ?? s.projects,
          expenses: data.expenses ?? s.expenses,
          debugSessions: data.debugSessions ?? s.debugSessions,
          auditReports: data.auditReports ?? s.auditReports,
          settings: data.settings ?? s.settings,
        }));
      },

      resetToSeedData: () => {
        set({
          projects: SEED_PROJECTS,
          expenses: SEED_EXPENSES,
          debugSessions: SEED_DEBUG_SESSIONS,
          auditReports: [SEED_AI_AUDIT],
          settings: DEFAULT_SETTINGS,
          activeDebugTimer: null,
          activeView: 'dashboard',
        });
      },
    }),
    {
      name: 'devspend_v1_storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projects: state.projects,
        expenses: state.expenses,
        debugSessions: state.debugSessions,
        auditReports: state.auditReports,
        settings: state.settings,
      }),
    }
  )
);

// ============================================================
// Multi-Tenant Selector Hooks (Safe against getSnapshot loop)
// ============================================================

/**
 * Returns projects scoped to a specific owner, or all if not provided.
 */
export function useUserProjects(ownerUserId?: string): Project[] {
  const projects = useSpendStore(s => s.projects);
  return useMemo(() => {
    if (!ownerUserId) return projects;
    return projects.filter(p => p.ownerUserId === ownerUserId);
  }, [projects, ownerUserId]);
}

/**
 * Returns active project. If not found or if list is empty, returns undefined.
 */
export function useActiveProject(ownerUserId?: string): Project | undefined {
  const projects = useSpendStore(s => s.projects);
  const activeProjectId = useSpendStore(s => s.settings.activeProjectId);

  return useMemo(() => {
    const userScoped = ownerUserId
      ? projects.filter(p => p.ownerUserId === ownerUserId)
      : projects;

    if (userScoped.length === 0) return undefined;
    return userScoped.find(p => p.id === activeProjectId) ?? userScoped[0];
  }, [projects, activeProjectId, ownerUserId]);
}

export function useProjectExpenses(projectId?: string): ExpenseItem[] {
  const expenses = useSpendStore(s => s.expenses);
  return useMemo(() => {
    if (!projectId) return [];
    return expenses.filter(e => e.projectId === projectId);
  }, [expenses, projectId]);
}

export function useProjectDebugSessions(projectId?: string): DebugSession[] {
  const debugSessions = useSpendStore(s => s.debugSessions);
  return useMemo(() => {
    if (!projectId) return [];
    return debugSessions.filter(d => d.projectId === projectId);
  }, [debugSessions, projectId]);
}

export function useProjectAudit(projectId?: string): AiAuditReport | undefined {
  const auditReports = useSpendStore(s => s.auditReports);
  return useMemo(() => {
    if (!projectId) return undefined;
    return auditReports.find(r => r.projectId === projectId);
  }, [auditReports, projectId]);
}

export function useMonthlyBurn(projectId?: string): number {
  const expenses = useProjectExpenses(projectId);
  return useMemo(
    () => expenses.reduce((sum, e) => sum + normalizeToMonthly(e.amount, e.billingCycle), 0),
    [expenses]
  );
}
