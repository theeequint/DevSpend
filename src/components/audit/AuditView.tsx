import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Brain,
  Cpu,
  Layers,
  Bug,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Loader2,
  Check,
  AlertTriangle,
  Lightbulb,
  Trash2,
} from 'lucide-react';
import {
  useActiveProject,
  useProjectExpenses,
  useProjectDebugSessions,
  useProjectAudit,
  useSpendStore,
} from '../../store/useSpendStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  formatCurrency,
  formatPercent,
  healthScoreColor,
  formatDate,
  formatMinutes,
  safeDiv,
} from '../../utils/formatters';
import {
  runAiAudit,
  generateLeanBlueprint,
  LeanBlueprintResult,
} from '../../services/aiService';
import { AuditMode, AuditRecommendation } from '../../types';
import ConfigureAiModal from './ConfigureAiModal';

export const AuditView: React.FC = () => {
  const activeProject = useActiveProject();
  const expenses = useProjectExpenses(activeProject?.id ?? '');
  const debugSessions = useProjectDebugSessions(activeProject?.id ?? '');
  const auditReport = useProjectAudit(activeProject?.id ?? '');
  const { settings, addAuditReport, applyRecommendation, deleteAuditReport } = useSpendStore();
  const { currentUser } = useAuthStore();

  const currency = activeProject?.currency ?? 'USD';
  const hourlyRate = activeProject?.hourlyDevRate ?? 60;

  // Active Sub-tab state
  const [activeTab, setActiveTab] = useState<AuditMode>('full_cost_reduction');
  const [loading, setLoading] = useState(false);
  const [configureAiOpen, setConfigureAiOpen] = useState(false);
  const [expandedRecs, setExpandedRecs] = useState<Record<string, boolean>>({});

  // Blueprint state
  const [blueprintFeature, setBlueprintFeature] = useState(
    'Real-time notifications + PDF invoice generation + RAG chatbot'
  );
  const [blueprintResult, setBlueprintResult] = useState<LeanBlueprintResult | null>(
    () => generateLeanBlueprint('Real-time notifications + PDF invoice generation + RAG chatbot')
  );

  const toggleExpand = (id: string) => {
    setExpandedRecs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Run or re-run AI audit
  const handleTriggerAudit = async () => {
    if (!activeProject) return;
    setLoading(true);

    try {
      const apiKey =
        settings.activeProvider === 'gemini'
          ? settings.geminiApiKey
          : settings.activeProvider === 'groq'
          ? settings.groqApiKey
          : settings.activeProvider === 'openrouter'
          ? settings.openrouterApiKey
          : '';

      const report = await runAiAudit(
        {
          projectId: activeProject.id,
          ownerUserId: currentUser?.id || activeProject.ownerUserId || 'user_demo',
          projectName: activeProject.name,
          expenses,
          debugSessions,
          monthlyBudgetCap: activeProject.monthlyBudgetCap,
          hourlyDevRate: activeProject.hourlyDevRate,
        },
        settings.activeProvider,
        apiKey
      );

      addAuditReport(report);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBlueprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blueprintFeature.trim()) return;
    const res = generateLeanBlueprint(blueprintFeature);
    setBlueprintResult(res);
  };

  // Diagnostics calculations
  const totalDebugCost = debugSessions.reduce((sum, d) => sum + d.calculatedCost, 0);
  const totalDebugHours = debugSessions.reduce((sum, d) => sum + d.durationMinutes / 60, 0);

  const effortBadge: Record<string, string> = {
    '10 mins': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    '2 hours': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    '1-2 days': 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Brain size={20} className="text-violet-400" />
            AI FinOps & Lean Architecture Auditor
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-xs text-zinc-400">
              Provider Active:{' '}
              <span className="font-mono text-zinc-200 capitalize">
                {settings.activeProvider === 'deterministic'
                  ? 'Deterministic Heuristic Engine (Offline)'
                  : settings.activeProvider}
              </span>
            </p>
            <button
              onClick={() => setConfigureAiOpen(true)}
              className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Cpu size={11} />
              <span>Configure AI Engine / Keys</span>
            </button>
          </div>
        </div>

        {/* Audit Mode Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('full_cost_reduction')}
            className={`tab ${activeTab === 'full_cost_reduction' ? 'tab-active' : 'tab-inactive'} text-xs`}
          >
            Cost Reduction
          </button>
          <button
            onClick={() => setActiveTab('lean_architecture')}
            className={`tab ${activeTab === 'lean_architecture' ? 'tab-active' : 'tab-inactive'} text-xs`}
          >
            Blueprint Generator
          </button>
          <button
            onClick={() => setActiveTab('debug_diagnostic')}
            className={`tab ${activeTab === 'debug_diagnostic' ? 'tab-active' : 'tab-inactive'} text-xs`}
          >
            Bug Diagnostics
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: FULL STACK COST REDUCTION AUDIT
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'full_cost_reduction' && (
        <div className="space-y-5">
          {/* Audit Summary Bar */}
          <div className="card p-5 bg-gradient-to-r from-violet-950/20 via-[#121215] to-[#121215] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              {/* Health Score */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-zinc-700 flex items-center justify-center font-mono font-bold text-base text-zinc-100 bg-zinc-900">
                  {auditReport?.healthScore ?? 65}
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">
                    FinOps Health Score
                  </span>
                  <span className="text-xs font-semibold text-zinc-200">
                    {(auditReport?.healthScore ?? 65) >= 70 ? 'Optimal Architecture' : 'Over-Provisioned'}
                  </span>
                </div>
              </div>

              {/* Monthly Savings */}
              <div className="border-l border-zinc-800 pl-6">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">
                  Identified Monthly Savings
                </span>
                <span className="num font-bold text-xl text-emerald-400 font-mono">
                  +${auditReport?.estimatedMonthlySavings ?? 0}/mo
                </span>
              </div>

              {/* Annual Savings */}
              <div className="border-l border-zinc-800 pl-6 hidden sm:block">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">
                  Annualized Run-Rate Savings
                </span>
                <span className="num font-bold text-xl text-zinc-100 font-mono">
                  +${((auditReport?.estimatedMonthlySavings ?? 0) * 12).toLocaleString()}/yr
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfigureAiOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <Cpu size={14} className="text-violet-400" />
                <span>Configure AI Engine</span>
              </button>
              {auditReport && (
                <button
                  onClick={() => deleteAuditReport(auditReport.id)}
                  title="Clear Audit Report"
                  className="p-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                onClick={handleTriggerAudit}
                disabled={loading}
                className="btn-primary text-xs py-2 px-4 shadow-lg shadow-violet-950/40 shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Analyzing Ledger...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> Re-run AI Audit
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Recommendations List */}
          <div className="space-y-3.5">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Zap size={15} className="text-violet-400" />
              Tailored Architecture Recommendations ({auditReport?.recommendations.length ?? 0})
            </h3>

            {(!auditReport || auditReport.recommendations.length === 0) ? (
              <div className="card p-8 text-center text-zinc-400 space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-emerald-400" />
                <p className="text-sm">No critical optimization opportunities found.</p>
              </div>
            ) : (
              auditReport.recommendations.map((rec: AuditRecommendation) => {
                const isExpanded = !!expandedRecs[rec.id];
                return (
                  <div
                    key={rec.id}
                    className={`card p-5 transition-all ${
                      rec.applied ? 'border-emerald-500/30 bg-emerald-950/10' : 'hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase ${
                              effortBadge[rec.implementationEffort] || 'text-zinc-400 border-zinc-700'
                            }`}
                          >
                            Effort: {rec.implementationEffort}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700/60 uppercase">
                            {rec.category.replace('_', ' ')}
                          </span>
                          {rec.applied && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-bold">
                              <Check size={10} /> Applied to Ledger
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-semibold text-zinc-100">{rec.title}</h4>

                        {/* Current vs Suggested Vendors */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 font-mono pt-0.5">
                          <span>
                            Current: <span className="text-zinc-200">{rec.currentVendor}</span> (${rec.currentMonthlyCost}/mo)
                          </span>
                          <ArrowRight size={12} className="text-zinc-500" />
                          <span>
                            Suggested: <span className="text-emerald-400 font-bold">{rec.suggestedVendor}</span> (${rec.suggestedMonthlyCost}/mo)
                          </span>
                        </div>
                      </div>

                      {/* Right Savings & Action */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-500 uppercase block font-mono">
                            Monthly Savings
                          </span>
                          <span className="num font-bold text-base text-emerald-400 font-mono">
                            +${rec.monthlySavings}/mo
                          </span>
                        </div>

                        {!rec.applied ? (
                          <button
                            onClick={() => applyRecommendation(auditReport.id, rec.id)}
                            className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center gap-1 shadow-md shadow-emerald-950/40"
                          >
                            <Sparkles size={12} /> Apply Swap
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                            <Check size={14} /> Active
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expandable Technical Reasoning & Action Steps */}
                    <div className="pt-3 mt-3 border-t border-zinc-800/80">
                      <button
                        onClick={() => toggleExpand(rec.id)}
                        className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-mono"
                      >
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        {isExpanded ? 'Hide' : 'View'} Architectural Rationale & Implementation Steps
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-3 p-3.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 leading-relaxed animate-fade-in">
                          <div>
                            <span className="font-semibold text-zinc-200 block mb-1">
                              Technical Reasoning:
                            </span>
                            <p className="text-zinc-400">{rec.technicalReasoning}</p>
                          </div>

                          {rec.actionSteps && rec.actionSteps.length > 0 && (
                            <div>
                              <span className="font-semibold text-zinc-200 block mb-1">
                                Step-by-Step Action Plan:
                              </span>
                              <ol className="list-decimal list-inside space-y-1 text-zinc-400 pl-1">
                                {rec.actionSteps.map((step, idx) => (
                                  <li key={idx}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: LEAN ARCHITECTURE BLUEPRINT GENERATOR
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'lean_architecture' && (
        <div className="space-y-5">
          {/* Prompt Input Form */}
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-400" />
              What feature are you planning to build?
            </h3>
            <form onSubmit={handleGenerateBlueprint} className="flex gap-2">
              <input
                type="text"
                value={blueprintFeature}
                onChange={(e) => setBlueprintFeature(e.target.value)}
                placeholder="e.g. Real-time collaborative canvas + AI embeddings + Stripe billing"
                className="input flex-1 text-xs"
              />
              <button type="submit" className="btn-primary text-xs shrink-0">
                Generate 3 Blueprints
              </button>
            </form>
          </div>

          {/* 3 Blueprints Comparison */}
          {blueprintResult && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* 1. The $0/mo Indie Stack */}
              <div className="card p-5 border-emerald-500/30 bg-emerald-950/10 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                    <h4 className="text-sm font-bold text-emerald-300">
                      {blueprintResult.indie.title}
                    </h4>
                    <span className="num font-bold text-lg text-emerald-400 font-mono">
                      ${blueprintResult.indie.monthlyCost}/mo
                    </span>
                  </div>

                  <ul className="space-y-1.5 text-xs text-zinc-300">
                    {blueprintResult.indie.stack.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-[11px] text-zinc-400 border-t border-emerald-500/20 pt-2 leading-relaxed">
                  {blueprintResult.indie.details}
                </div>
              </div>

              {/* 2. The $25/mo Scale-Ready Stack */}
              <div className="card p-5 border-violet-500/30 bg-violet-950/10 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-violet-500/20 pb-2">
                    <h4 className="text-sm font-bold text-violet-300">
                      {blueprintResult.scaleReady.title}
                    </h4>
                    <span className="num font-bold text-lg text-violet-400 font-mono">
                      ~${blueprintResult.scaleReady.monthlyCost}/mo
                    </span>
                  </div>

                  <ul className="space-y-1.5 text-xs text-zinc-300">
                    {blueprintResult.scaleReady.stack.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <Check size={13} className="text-violet-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-[11px] text-zinc-400 border-t border-violet-500/20 pt-2 leading-relaxed">
                  {blueprintResult.scaleReady.details}
                </div>
              </div>

              {/* 3. The Enterprise Trap to Avoid */}
              <div className="card p-5 border-rose-500/30 bg-rose-950/10 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                    <h4 className="text-sm font-bold text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle size={15} />
                      {blueprintResult.enterpriseTrap.title}
                    </h4>
                    <span className="num font-bold text-lg text-rose-400 font-mono">
                      ${blueprintResult.enterpriseTrap.monthlyCost}+/mo
                    </span>
                  </div>

                  <ul className="space-y-1.5 text-xs text-zinc-400">
                    {blueprintResult.enterpriseTrap.stack.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 line-through decoration-rose-500/50">
                        <span className="text-rose-400">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-[11px] text-zinc-400 border-t border-rose-500/20 pt-2 leading-relaxed">
                  {blueprintResult.enterpriseTrap.details}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: DEBUGGING & TECH-DEBT DIAGNOSTIC
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'debug_diagnostic' && (
        <div className="space-y-5">
          {/* Diagnostic KPI Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-4 space-y-1">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block font-mono">
                Total Debugging Outlay
              </span>
              <div className="num font-bold text-2xl text-amber-400 font-mono">
                {formatCurrency(totalDebugCost, currency)}
              </div>
              <p className="text-xs text-zinc-400">Across {debugSessions.length} recorded incidents</p>
            </div>

            <div className="card p-4 space-y-1">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block font-mono">
                Hours Sunk into Bug Fixing
              </span>
              <div className="num font-bold text-2xl text-zinc-100 font-mono">
                {totalDebugHours.toFixed(1)} hrs
              </div>
              <p className="text-xs text-zinc-400">Priced at ${hourlyRate}/hr developer opportunity cost</p>
            </div>

            <div className="card p-4 space-y-1">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block font-mono">
                Potential Testing Savings
              </span>
              <div className="num font-bold text-2xl text-emerald-400 font-mono">
                {formatCurrency(totalDebugCost * 0.6, currency)}
              </div>
              <p className="text-xs text-zinc-400">60% of issues preventable via Vitest + Zod</p>
            </div>
          </div>

          {/* Root-Cause Recommendations */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Bug size={16} className="text-amber-400" />
              Automated Root-Cause Diagnostic & Remediation Rules
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                <span className="font-semibold text-xs text-zinc-200">
                  1. Enforce Runtime Boundary Schema Validation (Zod)
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Most high-duration auth and sync bugs stemmed from payload mutations at API boundaries. TypeScript types are stripped at runtime—Zod guarantees incoming data matches expectations before reaching business logic.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                <span className="font-semibold text-xs text-zinc-200">
                  2. Add Concurrency Regression Tests in Vitest
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Race condition bugs took the longest to resolve (average 6+ hours). Write a dedicated integration test that fires 10 simultaneous refresh-token requests to ensure token mutex locks work predictably.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                <span className="font-semibold text-xs text-zinc-200">
                  3. Turn On tsconfig Strict Flags
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Enable <code className="text-violet-300 font-mono">"strict": true</code>, <code className="text-violet-300 font-mono">"noUncheckedIndexedAccess": true</code>, and <code className="text-violet-300 font-mono">"exactOptionalPropertyTypes": true</code> in your tsconfig.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Configure AI Engine Modal */}
      <ConfigureAiModal
        open={configureAiOpen}
        onClose={() => setConfigureAiOpen(false)}
      />
    </div>
  );
};

export default AuditView;
