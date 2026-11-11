import React from 'react';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Plus,
  Play,
  Layers,
  CheckCircle2,
  FolderPlus,
} from 'lucide-react';
import {
  useActiveProject,
  useProjectExpenses,
  useProjectAudit,
  useSpendStore,
} from '../../store/useSpendStore';
import {
  formatCurrency,
  normalizeToMonthly,
  formatDate,
} from '../../utils/formatters';
import KpiRibbon from './KpiRibbon';
import BurnAreaChart from '../charts/BurnAreaChart';
import CategoryDonut from '../charts/CategoryDonut';
import StatusBadge from '../ui/StatusBadge';
import CategoryBadge from '../ui/CategoryBadge';
import ExportExcelButton from '../ui/ExportExcelButton';

export const DashboardView: React.FC = () => {
  const activeProject = useActiveProject();
  const expenses = useProjectExpenses(activeProject?.id ?? '');
  const auditReport = useProjectAudit(activeProject?.id ?? '');
  const {
    setActiveView,
    setAddExpenseModalOpen,
    setCreateProjectModalOpen,
    activeDebugTimer,
    applyRecommendation,
  } = useSpendStore();

  const currency = activeProject?.currency ?? 'USD';

  // Sort expenses by normalized monthly burn descending
  const topExpenses = [...expenses]
    .sort(
      (a, b) =>
        normalizeToMonthly(b.amount, b.billingCycle) -
        normalizeToMonthly(a.amount, a.billingCycle)
    )
    .slice(0, 5);

  const pendingRecommendations = (auditReport?.recommendations || [])
    .filter((r) => !r.applied)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Project Banner & Quick Meta */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121215] border border-zinc-800/80 rounded-xl p-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">
              {activeProject?.name || 'DevSpend Project'}
            </h1>
            {activeProject && <StatusBadge status={activeProject.status} />}
            <span className="text-xs text-zinc-500 font-mono">
              Created {formatDate(activeProject?.createdAt || '')}
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            {activeProject?.description}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-zinc-500 mr-1 flex items-center gap-1">
              <Layers size={12} /> Tech Stack:
            </span>
            {(activeProject?.techStack || []).map((tech) => (
              <span
                key={tech}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800/80 text-zinc-300 border border-zinc-700/50"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <ExportExcelButton />
          <button
            onClick={() => setCreateProjectModalOpen(true)}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/80 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <FolderPlus size={14} className="text-violet-400" /> New Project
          </button>
          <button
            onClick={() => setAddExpenseModalOpen(true)}
            className="btn-primary text-xs"
          >
            <Plus size={14} /> Log Expense
          </button>
          <button
            onClick={() => setActiveView('audit')}
            className="px-3 py-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Sparkles size={14} /> AI Audit
          </button>
        </div>
      </div>

      {/* Live Debugging Banner if active */}
      {activeDebugTimer && (
        <div className="card p-3.5 bg-rose-950/20 border-rose-500/30 flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span className="text-xs text-rose-300 font-medium">
              Live Debug Timer Active:
            </span>
            <span className="text-xs font-mono text-zinc-200">
              {activeDebugTimer.description || 'Bug fixing session'}
            </span>
          </div>
          <button
            onClick={() => setActiveView('ledger')}
            className="text-xs text-rose-400 hover:text-rose-300 underline font-mono flex items-center gap-1"
          >
            View in Ledger <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* 6 KPI Cards Ribbon */}
      <KpiRibbon />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <BurnAreaChart />
        </div>
        <div className="lg:col-span-5">
          <CategoryDonut />
        </div>
      </div>

      {/* Lower Row: Top Cost Drivers & AI Quick Wins */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Top 5 Cost Drivers */}
        <div className="card p-5 lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div>
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <TrendingUp size={16} className="text-zinc-400" /> Top Cost Drivers
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Highest normalized monthly expenditures in current ledger
              </p>
            </div>
            <button
              onClick={() => setActiveView('ledger')}
              className="text-xs text-zinc-400 hover:text-zinc-200 font-medium flex items-center gap-1"
            >
              Full Ledger ({expenses.length}) <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-2.5">
            {topExpenses.map((exp) => {
              const monthly = normalizeToMonthly(exp.amount, exp.billingCycle);
              return (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700/70 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryBadge category={exp.category} size="sm" />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-zinc-200 truncate flex items-center gap-1.5">
                        {exp.title}
                        {exp.isAiOptimized && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30">
                            AI-Optimized
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        Vendor: {exp.vendor} • {exp.billingCycle}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="num font-bold text-xs text-zinc-100">
                      {formatCurrency(monthly, currency)}/mo
                    </div>
                    {exp.billingCycle !== 'monthly' && (
                      <div className="text-[10px] text-zinc-500 font-mono">
                        raw: {formatCurrency(exp.amount, currency)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Optimization Quick Wins */}
        <div className="card p-5 lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div>
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Sparkles size={16} className="text-violet-400" /> AI Optimization Wins
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Top actionable stack downgrades & swaps
              </p>
            </div>
            <button
              onClick={() => setActiveView('audit')}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1"
            >
              All Recommendations <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-3">
            {pendingRecommendations.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 size={24} className="mx-auto text-emerald-400" />
                <p className="text-xs text-zinc-400">All current recommendations applied or stack is lean!</p>
              </div>
            ) : (
              pendingRecommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-semibold text-zinc-200 line-clamp-1">
                      {rec.title}
                    </h4>
                    <span className="num font-bold text-xs text-emerald-400 shrink-0">
                      +${rec.monthlySavings}/mo
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="font-mono">
                      {rec.currentVendor} → {rec.suggestedVendor}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">
                      {rec.implementationEffort}
                    </span>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => auditReport && applyRecommendation(auditReport.id, rec.id)}
                      className="px-2.5 py-1 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-medium transition-colors flex items-center gap-1"
                    >
                      <Sparkles size={11} /> Apply Swap
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
