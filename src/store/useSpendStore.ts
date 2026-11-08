// ============================================================
// DevSpend — Zustand Store (persistent to localStorage)
// Full-Spectrum Financial Ledger & Cap-Table Ownership Engine
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useMemo } from 'react';
import {
  Project,
  ExpenseItem,
  RevenueItem,
  Stakeholder,
  FundingRound,
  DebugSession,
  AiAuditReport,
  AppSettings,
  SimulatorParams,
  AppView,
} from '../types';
import {
  SEED_PROJECTS,
  SEED_EXPENSES,
  SEED_REVENUES,
  SEED_STAKEHOLDERS,
  SEED_FUNDING_ROUNDS,
  SEED_DEBUG_SESSIONS,
  SEED_AI_AUDIT,
  DEFAULT_SETTINGS,
} from '../data/seed';
import {
  generateId,
  isoNow,
  normalizeToMonthly,
  safeDiv,
  safeNum,
} from '../utils/formatters';

// ============================================================
// Store shape
// ============================================================
interface DevSpendState {
  // Multi-tenant financial data
  projects: Project[];
  expenses: ExpenseItem[];
  revenues: RevenueItem[];
  stakeholders: Stakeholder[];
  fundingRounds: FundingRound[];
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
  ledgerTab: 'overall' | 'revenue' | 'expenses';
  commandPaletteOpen: boolean;
  addExpenseModalOpen: boolean;
  addRevenueModalOpen: boolean;
  addStakeholderModalOpen: boolean;
  addFundingRoundModalOpen: boolean;
  editingRevenue: RevenueItem | null;
  editingStakeholder: Stakeholder | null;
  editingFundingRound: FundingRound | null;
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

  // ── Revenue actions ─────────────────────────────────────────
  addRevenue: (revenue: Omit<RevenueItem, 'id'>) => string;
  updateRevenue: (id: string, updates: Partial<RevenueItem>) => void;
  deleteRevenue: (id: string) => void;
  deleteRevenues: (ids: string[]) => void;
  clearProjectRevenues: (projectId: string) => void;

  // ── Stakeholder & Ownership actions ─────────────────────────
  addStakeholder: (stakeholder: Omit<Stakeholder, 'id'>) => string;
  updateStakeholder: (id: string, updates: Partial<Stakeholder>) => void;
  deleteStakeholder: (id: string) => void;

  // ── Funding Round actions ───────────────────────────────────
  addFundingRound: (round: Omit<FundingRound, 'id'>) => string;
  updateFundingRound: (id: string, updates: Partial<FundingRound>) => void;
  deleteFundingRound: (id: string) => void;

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

  // ── UI modal & view actions ──────────────────────────────────
  setActiveView: (view: AppView) => void;
  setLedgerTab: (tab: 'overall' | 'revenue' | 'expenses') => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setAddExpenseModalOpen: (open: boolean) => void;
  setAddRevenueModalOpen: (open: boolean, revenue?: RevenueItem | null) => void;
  setAddStakeholderModalOpen: (open: boolean, stakeholder?: Stakeholder | null) => void;
  setAddFundingRoundModalOpen: (open: boolean, round?: FundingRound | null) => void;
  setEditingRevenue: (revenue: RevenueItem | null) => void;
  setEditingStakeholder: (stakeholder: Stakeholder | null) => void;
  setEditingFundingRound: (round: FundingRound | null) => void;
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
      // Initial financial datasets
      projects: SEED_PROJECTS,
      expenses: SEED_EXPENSES,
      revenues: SEED_REVENUES,
      stakeholders: SEED_STAKEHOLDERS,
      fundingRounds: SEED_FUNDING_ROUNDS,
      debugSessions: SEED_DEBUG_SESSIONS,
      auditReports: [SEED_AI_AUDIT],
      settings: DEFAULT_SETTINGS,
      activeDebugTimer: null,

      // Initial UI state
      activeView: 'dashboard',
      ledgerTab: 'overall',
      commandPaletteOpen: false,
      addExpenseModalOpen: false,
      addRevenueModalOpen: false,
      addStakeholderModalOpen: false,
      addFundingRoundModalOpen: false,
      editingRevenue: null,
      editingStakeholder: null,
      editingFundingRound: null,
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
          revenues: s.revenues.filter(r => r.projectId !== id),
          stakeholders: s.stakeholders.filter(stk => stk.projectId !== id),
          fundingRounds: s.fundingRounds.filter(f => f.projectId !== id),
          debugSessions: s.debugSessions.filter(d => d.projectId !== id),
          auditReports: s.auditReports.filter(a => a.projectId !== id),
          settings: {
            ...s.settings,
            activeProjectId: newActiveId,
          },
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

      // ── Revenue actions ───────────────────────────────────────
      addRevenue: (revenueData) => {
        const id = `rev_${generateId()}`;
        const netAmount = safeNum(revenueData.amount) - safeNum(revenueData.feeDeducted || 0);
        const revenue: RevenueItem = {
          ...revenueData,
          id,
          netAmount: Math.max(0, netAmount),
        };
        set(s => ({
          revenues: [...s.revenues, revenue],
          addRevenueModalOpen: false,
          editingRevenue: null,
        }));
        return id;
      },

      updateRevenue: (id, updates) => {
        set(s => ({
          revenues: s.revenues.map(r => {
            if (r.id !== id) return r;
            const updated = { ...r, ...updates };
            const netAmount = safeNum(updated.amount) - safeNum(updated.feeDeducted || 0);
            return {
              ...updated,
              netAmount: Math.max(0, netAmount),
            };
          }),
          editingRevenue: null,
        }));
      },

      deleteRevenue: (id) => {
        set(s => ({ revenues: s.revenues.filter(r => r.id !== id) }));
      },

      deleteRevenues: (ids) => {
        const idSet = new Set(ids);
        set(s => ({
          revenues: s.revenues.filter(r => !idSet.has(r.id)),
        }));
      },

      clearProjectRevenues: (projectId) => {
        set(s => ({
          revenues: s.revenues.filter(r => r.projectId !== projectId),
        }));
      },

      // ── Stakeholder & Ownership actions ─────────────────────────
      addStakeholder: (stakeholderData) => {
        const id = `stk_${generateId()}`;
        const stakeholder: Stakeholder = { ...stakeholderData, id };
        set(s => ({
          stakeholders: [...s.stakeholders, stakeholder],
          addStakeholderModalOpen: false,
          editingStakeholder: null,
        }));
        return id;
      },

      updateStakeholder: (id, updates) => {
        set(s => ({
          stakeholders: s.stakeholders.map(stk => (stk.id === id ? { ...stk, ...updates } : stk)),
          editingStakeholder: null,
        }));
      },

      deleteStakeholder: (id) => {
        set(s => ({ stakeholders: s.stakeholders.filter(stk => stk.id !== id) }));
      },

      // ── Funding Round actions ───────────────────────────────────
      addFundingRound: (roundData) => {
        const id = `rnd_${generateId()}`;
        const round: FundingRound = { ...roundData, id };

        set(s => {
          // If addToCashReserve is true, update project totalCashReserve
          const updatedProjects = roundData.addToCashReserve
            ? s.projects.map(p =>
                p.id === roundData.projectId
                  ? { ...p, totalCashReserve: p.totalCashReserve + safeNum(roundData.amountRaised) }
                  : p
              )
            : s.projects;

          return {
            fundingRounds: [...s.fundingRounds, round],
            projects: updatedProjects,
            addFundingRoundModalOpen: false,
            editingFundingRound: null,
          };
        });
        return id;
      },

      updateFundingRound: (id, updates) => {
        set(s => ({
          fundingRounds: s.fundingRounds.map(f => (f.id === id ? { ...f, ...updates } : f)),
          editingFundingRound: null,
        }));
      },

      deleteFundingRound: (id) => {
        set(s => ({ fundingRounds: s.fundingRounds.filter(f => f.id !== id) }));
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

      // ── UI Modal & View Actions ────────────────────────────────
      setActiveView: (view) => set({ activeView: view }),
      setLedgerTab: (tab) => set({ ledgerTab: tab }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setAddExpenseModalOpen: (open) => set({ addExpenseModalOpen: open }),
      setAddRevenueModalOpen: (open, revenue = null) =>
        set({ addRevenueModalOpen: open, editingRevenue: revenue }),
      setAddStakeholderModalOpen: (open, stakeholder = null) =>
        set({ addStakeholderModalOpen: open, editingStakeholder: stakeholder }),
      setAddFundingRoundModalOpen: (open, round = null) =>
        set({ addFundingRoundModalOpen: open, editingFundingRound: round }),
      setEditingRevenue: (revenue) => set({ editingRevenue: revenue }),
      setEditingStakeholder: (stakeholder) => set({ editingStakeholder: stakeholder }),
      setEditingFundingRound: (round) => set({ editingFundingRound: round }),
      setCreateProjectModalOpen: (open) => set({ createProjectModalOpen: open }),
      setSimulatorParams: (params) => {
        set(s => ({ simulatorParams: { ...s.simulatorParams, ...params } }));
      },

      // ── Data portability ────────────────────────────────────────
      exportFullState: () => {
        const {
          projects,
          expenses,
          revenues,
          stakeholders,
          fundingRounds,
          debugSessions,
          auditReports,
          settings,
        } = get();
        return {
          version: 'devspend_v2',
          exportedAt: isoNow(),
          projects,
          expenses,
          revenues,
          stakeholders,
          fundingRounds,
          debugSessions,
          auditReports,
          settings,
        };
      },

      importFullState: (data) => {
        set(s => ({
          projects: data.projects ?? s.projects,
          expenses: data.expenses ?? s.expenses,
          revenues: data.revenues ?? s.revenues,
          stakeholders: data.stakeholders ?? s.stakeholders,
          fundingRounds: data.fundingRounds ?? s.fundingRounds,
          debugSessions: data.debugSessions ?? s.debugSessions,
          auditReports: data.auditReports ?? s.auditReports,
          settings: data.settings ?? s.settings,
        }));
      },

      resetToSeedData: () => {
        set({
          projects: SEED_PROJECTS,
          expenses: SEED_EXPENSES,
          revenues: SEED_REVENUES,
          stakeholders: SEED_STAKEHOLDERS,
          fundingRounds: SEED_FUNDING_ROUNDS,
          debugSessions: SEED_DEBUG_SESSIONS,
          auditReports: [SEED_AI_AUDIT],
          settings: DEFAULT_SETTINGS,
          activeDebugTimer: null,
          activeView: 'dashboard',
          ledgerTab: 'overall',
        });
      },
    }),
    {
      name: 'devspend_v2_storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projects: state.projects,
        expenses: state.expenses,
        revenues: state.revenues,
        stakeholders: state.stakeholders,
        fundingRounds: state.fundingRounds,
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

export function useUserProjects(ownerUserId?: string): Project[] {
  const projects = useSpendStore(s => s.projects);
  return useMemo(() => {
    if (!ownerUserId) return projects;
    return projects.filter(p => p.ownerUserId === ownerUserId);
  }, [projects, ownerUserId]);
}

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

export function useProjectRevenues(projectId?: string): RevenueItem[] {
  const revenues = useSpendStore(s => s.revenues);
  return useMemo(() => {
    if (!projectId) return [];
    return revenues.filter(r => r.projectId === projectId);
  }, [revenues, projectId]);
}

export function useProjectStakeholders(projectId?: string): Stakeholder[] {
  const stakeholders = useSpendStore(s => s.stakeholders);
  return useMemo(() => {
    if (!projectId) return [];
    return stakeholders.filter(s => s.projectId === projectId);
  }, [stakeholders, projectId]);
}

export function useProjectFundingRounds(projectId?: string): FundingRound[] {
  const fundingRounds = useSpendStore(s => s.fundingRounds);
  return useMemo(() => {
    if (!projectId) return [];
    return fundingRounds.filter(f => f.projectId === projectId);
  }, [fundingRounds, projectId]);
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

export function useMonthlyRevenue(projectId?: string): number {
  const revenues = useProjectRevenues(projectId);
  return useMemo(
    () => revenues.reduce((sum, r) => sum + normalizeToMonthly(r.netAmount, r.billingCycle), 0),
    [revenues]
  );
}

export function useNetMonthlyBurn(projectId?: string) {
  const grossBurn = useMonthlyBurn(projectId);
  const monthlyRevenue = useMonthlyRevenue(projectId);
  const activeProject = useActiveProject();

  return useMemo(() => {
    const netBurn = Math.max(0, grossBurn - monthlyRevenue);
    const isDefaultAlive = monthlyRevenue >= grossBurn && grossBurn > 0;
    const cashReserve = activeProject?.totalCashReserve ?? 0;

    let runwayMonths = 999;
    let runwayDays = 0;

    if (isDefaultAlive) {
      runwayMonths = 999;
      runwayDays = 0;
    } else if (netBurn > 0) {
      const floatMonths = safeDiv(cashReserve, netBurn);
      runwayMonths = Math.floor(floatMonths);
      runwayDays = Math.round((floatMonths - runwayMonths) * 30);
    }

    return {
      grossBurn,
      monthlyRevenue,
      netBurn,
      isDefaultAlive,
      runwayMonths,
      runwayDays,
      effectiveMonthlySavings: Math.min(grossBurn, monthlyRevenue),
    };
  }, [grossBurn, monthlyRevenue, activeProject?.totalCashReserve]);
}

export function useCapTableSummary(projectId?: string) {
  const stakeholders = useProjectStakeholders(projectId);
  const fundingRounds = useProjectFundingRounds(projectId);

  return useMemo(() => {
    const totalShares = stakeholders.reduce((sum, s) => sum + safeNum(s.sharesOwned), 0);
    const totalInvestedAmount = stakeholders.reduce((sum, s) => sum + safeNum(s.totalInvestedAmount), 0);
    const totalCapitalRaised = fundingRounds.reduce((sum, f) => sum + safeNum(f.amountRaised), 0) || totalInvestedAmount;

    // Latest round valuation or implied valuation
    const latestRound = [...fundingRounds].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];

    const postMoneyValuation = latestRound
      ? safeNum(latestRound.postMoneyValuation)
      : totalShares > 0 && totalCapitalRaised > 0
      ? totalCapitalRaised * 4 // reasonable default 25% dilution implied
      : 1000000;

    const pricePerShare = totalShares > 0 ? safeDiv(postMoneyValuation, totalShares) : 0;

    // Equity breakdowns by role
    const founderShares = stakeholders
      .filter(s => s.role === 'founder')
      .reduce((sum, s) => sum + safeNum(s.sharesOwned), 0);

    const investorShares = stakeholders
      .filter(s => s.role === 'angel_investor' || s.role === 'vc_fund')
      .reduce((sum, s) => sum + safeNum(s.sharesOwned), 0);

    const esopShares = stakeholders
      .filter(s => s.role === 'esop_pool')
      .reduce((sum, s) => sum + safeNum(s.sharesOwned), 0);

    const advisorShares = stakeholders
      .filter(s => s.role === 'advisor' || s.role === 'strategic_partner')
      .reduce((sum, s) => sum + safeNum(s.sharesOwned), 0);

    const founderPercent = totalShares > 0 ? (founderShares / totalShares) * 100 : 0;
    const investorPercent = totalShares > 0 ? (investorShares / totalShares) * 100 : 0;
    const esopPercent = totalShares > 0 ? (esopShares / totalShares) * 100 : 0;
    const advisorPercent = totalShares > 0 ? (advisorShares / totalShares) * 100 : 0;

    return {
      totalShares,
      totalCapitalRaised,
      postMoneyValuation,
      pricePerShare,
      founderShares,
      investorShares,
      esopShares,
      advisorShares,
      founderPercent,
      investorPercent,
      esopPercent,
      advisorPercent,
      stakeholderCount: stakeholders.length,
      fundingRoundCount: fundingRounds.length,
    };
  }, [stakeholders, fundingRounds]);
}
