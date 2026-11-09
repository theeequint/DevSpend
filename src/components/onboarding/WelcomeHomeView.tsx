// ============================================================
// DevSpend — Welcome & Project Portfolio View
// Zero-project onboarding + multi-tenant project portfolio hub
// ============================================================

import React from 'react';
import {
  FolderPlus,
  Sparkles,
  Rocket,
  Plus,
  Trash2,
  FolderEdit,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Layers,
  Code2,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useSpendStore, useUserProjects } from '../../store/useSpendStore';
import { formatCurrency } from '../../utils/formatters';
import { StatusBadge } from '../ui/StatusBadge';

export const WelcomeHomeView: React.FC = () => {
  const { currentUser } = useAuthStore();
  const {
    setActiveProject,
    setActiveView,
    setCreateProjectModalOpen,
    setDeleteProjectModal,
    setEditProjectModal,
    addProject,
    addExpense,
    expenses,
  } = useSpendStore();

  const userProjects = useUserProjects(currentUser?.id);

  // Quick 1-click blueprint generator
  const handleLaunchBlueprint = (blueprintType: 'ai_saas' | 'indie_mobile' | 'api_microservice') => {
    if (!currentUser) return;

    if (blueprintType === 'ai_saas') {
      const pId = addProject({
        ownerUserId: currentUser.id,
        name: 'AI Agent Platform',
        slug: 'ai-agent-platform',
        description: 'Multi-model agentic workspace with vector embeddings and pay-per-token API billing.',
        techStack: ['Next.js', 'FastAPI', 'Gemini Flash', 'Supabase', 'Stripe'],
        currency: 'USD',
        monthlyBudgetCap: 500,
        totalCashReserve: 8000,
        expectedMonthlyUsers: 250,
        expectedMonthlyRevenue: 950,
        hourlyDevRate: 65,
        status: 'mvp',
      });

      // Add starter expense presets
      addExpense({
        projectId: pId,
        ownerUserId: currentUser.id,
        title: 'Google Gemini 1.5 Flash API',
        vendor: 'Google Cloud',
        category: 'apis_llms',
        billingCycle: 'usage_based',
        amount: 35.00,
        usageMetric: '~10M tokens/mo',
        date: new Date().toISOString(),
        isEssential: true,
        isAiOptimized: true,
        notes: 'High-throughput LLM for agent reasoning',
      });
      addExpense({
        projectId: pId,
        ownerUserId: currentUser.id,
        title: 'Supabase Database',
        vendor: 'Supabase',
        category: 'cloud_infra',
        billingCycle: 'monthly',
        amount: 25.00,
        date: new Date().toISOString(),
        isEssential: true,
        isAiOptimized: false,
        notes: 'PostgreSQL + pgvector storage',
      });
    } else if (blueprintType === 'indie_mobile') {
      const pId = addProject({
        ownerUserId: currentUser.id,
        name: 'PocketFlow Mobile',
        slug: 'pocketflow',
        description: 'Offline-first habit and focus tracker with Cloudflare R2 backup.',
        techStack: ['React Native', 'Expo', 'Cloudflare Workers', 'RevenueCat'],
        currency: 'USD',
        monthlyBudgetCap: 200,
        totalCashReserve: 3500,
        expectedMonthlyUsers: 500,
        expectedMonthlyRevenue: 400,
        hourlyDevRate: 50,
        status: 'mvp',
      });
      addExpense({
        projectId: pId,
        ownerUserId: currentUser.id,
        title: 'RevenueCat In-App Purchases',
        vendor: 'RevenueCat',
        category: 'devtools_saas',
        billingCycle: 'monthly',
        amount: 0.00,
        date: new Date().toISOString(),
        isEssential: true,
        isAiOptimized: true,
        notes: 'Free tier up to $2.5k MTR',
      });
    } else {
      const pId = addProject({
        ownerUserId: currentUser.id,
        name: 'Event Ingestion Engine',
        slug: 'event-engine',
        description: 'High-throughput webhook processor and Kafka telemetry pipeline.',
        techStack: ['Go', 'Docker', 'Upstash Redis', 'AWS Graviton'],
        currency: 'USD',
        monthlyBudgetCap: 300,
        totalCashReserve: 5000,
        expectedMonthlyUsers: 100,
        expectedMonthlyRevenue: 600,
        hourlyDevRate: 75,
        status: 'scaling',
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* User Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#121215] border border-zinc-800/80 shadow-xl">
        <div className="flex items-center gap-4">
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              className="w-14 h-14 rounded-2xl ring-2 ring-emerald-500/20 object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold text-lg">
              {currentUser?.displayName?.[0]?.toUpperCase() || 'D'}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-100">
                Welcome back, {currentUser?.displayName || currentUser?.username}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {currentUser?.authProvider?.toUpperCase() || 'PASSWORD'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Multi-Tenant FinOps Workspace • {userProjects.length} {userProjects.length === 1 ? 'Project' : 'Projects'} Active
            </p>
          </div>
        </div>

        <button
          onClick={() => setCreateProjectModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Portfolio Section */}
      {userProjects.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                Your Projects & Ledgers
              </h2>
            </div>
            <span className="text-xs text-zinc-500 font-mono">
              Select a project to view metrics & expenses
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userProjects.map((p) => {
              const pExpenses = expenses.filter((e) => e.projectId === p.id);
              const monthlyBurn = pExpenses.reduce((sum, e) => sum + e.amount, 0);
              const runwayMonths =
                monthlyBurn > 0 ? (p.totalCashReserve / monthlyBurn).toFixed(1) : '∞';

              return (
                <div
                  key={p.id}
                  className="bg-[#121215] border border-zinc-800/80 hover:border-zinc-700/90 rounded-xl p-5 flex flex-col justify-between transition-all group shadow-sm hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors text-base">
                        {p.name}
                      </h3>
                      <StatusBadge status={p.status} />
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 mb-4 h-8">
                      {p.description || 'No description provided.'}
                    </p>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800/60 font-mono mb-4 text-center">
                      <div>
                        <span className="block text-[10px] text-zinc-500">Monthly Burn</span>
                        <span className="text-xs font-bold text-red-400 font-semibold tabular-nums">
                          -{formatCurrency(monthlyBurn, p.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-zinc-500">Budget Cap</span>
                        <span className="text-xs font-bold text-zinc-200 tabular-nums">
                          {formatCurrency(p.monthlyBudgetCap, p.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-zinc-500">Runway</span>
                        <span className="text-xs font-bold text-emerald-400 tabular-nums">
                          {runwayMonths} mo
                        </span>
                      </div>
                    </div>

                    {/* Tech Stack Pills */}
                    {p.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {p.techStack.slice(0, 4).map((tech) => (
                          <span
                            key={tech}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800"
                          >
                            {tech}
                          </span>
                        ))}
                        {p.techStack.length > 4 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500">
                            +{p.techStack.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800/70">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditProjectModal(true, p.id)}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                        title="Edit Project Details & Currency"
                      >
                        <FolderEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteProjectModal(true, p.id)}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Project & Ledger"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setActiveProject(p.id);
                        setActiveView('dashboard');
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors py-1 px-2.5 rounded-md hover:bg-emerald-500/10"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Zero-Projects Onboarding Empty State */
        <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-8 text-center max-w-3xl mx-auto shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-4">
            <FolderPlus className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-zinc-100 mb-2">
            No projects in your workspace yet
          </h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6 leading-relaxed">
            DevSpend isolates unit economics and API expense logs on a per-project basis. Create your first project manually or start instantly from a pre-configured architecture blueprint.
          </p>

          {/* Action Pathways */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left mb-6">
            <button
              onClick={() => setCreateProjectModalOpen(true)}
              className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-emerald-500/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-200 mb-3 group-hover:text-emerald-400 transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors mb-1">
                  Custom Project Wizard
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Configure custom currency, tech stack, budget ceiling, and developer hourly rate.
                </p>
              </div>
              <div className="mt-3 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span>Start Blank</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => handleLaunchBlueprint('ai_saas')}
              className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-emerald-500/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors mb-1">
                  AI SaaS Blueprint
                </h3>
                <p className="text-[11px] text-zinc-400">
                  1-Click Next.js + Gemini Flash + Supabase template with initial token spend ledger.
                </p>
              </div>
              <div className="mt-3 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span>1-Click Launch</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => handleLaunchBlueprint('indie_mobile')}
              className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-emerald-500/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3">
                  <Rocket className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-zinc-200 group-hover:text-blue-400 transition-colors mb-1">
                  Indie Mobile App
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Expo + Cloudflare Workers + RevenueCat template with mobile store unit economics.
                </p>
              </div>
              <div className="mt-3 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span>1-Click Launch</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* FinOps Principles Checklist */}
      <div className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-zinc-200 mb-0.5">Unit Economics First</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Every expense is mapped to user scale and token usage so you understand true gross margins.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 flex-shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-zinc-200 mb-0.5">Debugging Tax</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Log developer hours spent resolving bugs to uncover hidden engineering cost sinks.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400 flex-shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-zinc-200 mb-0.5">Zero-Bypass Security</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Cryptographically signed HMAC tokens and multi-tenant scoping keep each account strictly isolated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
