import React, { useState } from 'react';
import {
  Key,
  Eye,
  EyeOff,
  Download,
  Upload,
  RotateCcw,
  Save,
  Check,
  AlertTriangle,
  Database,
  Cpu,
  Layers,
  Sparkles,
  DollarSign,
  FolderPlus,
} from 'lucide-react';
import { useActiveProject, useProjectExpenses, useSpendStore } from '../../store/useSpendStore';
import {
  exportToJSON,
  readJSONFile,
  exportToCSV,
  normalizeToMonthly,
} from '../../utils/formatters';
import { testApiConnection } from '../../services/aiService';
import { getGitHubToken, setGitHubToken, getShardManifest } from '../../services/userShardService';
import { useAuthStore } from '../../store/useAuthStore';
import { AiProvider, Currency, ProjectStatus } from '../../types';
import ThemeSelectorStudio from './ThemeSelectorStudio';

export const SettingsView: React.FC = () => {
  const activeProject = useActiveProject();
  const expenses = useProjectExpenses(activeProject?.id ?? '');
  const {
    settings,
    updateSettings,
    updateProject,
    setCreateProjectModalOpen,
    exportFullState,
    importFullState,
    resetToSeedData,
  } = useSpendStore();
  const { shardSyncStatus, syncShards } = useAuthStore();

  // API Key Visibility toggles
  const [showGemini, setShowGemini] = useState(false);
  const [showGroq, setShowGroq] = useState(false);
  const [showOpenRouter, setShowOpenRouter] = useState(false);
  const [githubToken, setGithubTokenState] = useState(getGitHubToken());
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [tokenSaved, setTokenSaved] = useState(false);
  const [activeShardName, setActiveShardName] = useState('users_shard_001.json');
  const [totalUsersCount, setTotalUsersCount] = useState(1);

  // Load manifest stats on mount
  React.useEffect(() => {
    getShardManifest().then((m) => {
      setActiveShardName(m.activeWriteShard);
      setTotalUsersCount(m.totalRegisteredUsers);
    }).catch(() => {});
  }, []);

  // Connection testing feedback
  const [testStatus, setTestStatus] = useState<{
    testing: boolean;
    success?: boolean;
    message?: string;
  }>({ testing: false });

  // Project form fields
  const [projectName, setProjectName] = useState(activeProject?.name ?? '');
  const [projectDesc, setProjectDesc] = useState(activeProject?.description ?? '');
  const [currency, setCurrency] = useState<Currency>(activeProject?.currency ?? 'USD');
  const [budgetCap, setBudgetCap] = useState(activeProject?.monthlyBudgetCap ?? 1000);
  const [cashReserve, setCashReserve] = useState(activeProject?.totalCashReserve ?? 15000);
  const [monthlyUsers, setMonthlyUsers] = useState(activeProject?.expectedMonthlyUsers ?? 1000);
  const [monthlyRevenue, setMonthlyRevenue] = useState(activeProject?.expectedMonthlyRevenue ?? 2000);
  const [hourlyRate, setHourlyRate] = useState(activeProject?.hourlyDevRate ?? 60);
  const [status, setStatus] = useState<ProjectStatus>(activeProject?.status ?? 'scaling');
  const [techStackInput, setTechStackInput] = useState(
    activeProject?.techStack.join(', ') ?? ''
  );
  const [projectSaved, setProjectSaved] = useState(false);

  // Test API key connection
  const handleTestConnection = async (provider: AiProvider, key: string) => {
    if (!key) {
      setTestStatus({ testing: false, success: false, message: 'Please enter an API key first' });
      return;
    }
    setTestStatus({ testing: true });
    const result = await testApiConnection(provider, key);
    setTestStatus({ testing: false, success: result.success, message: result.message });
  };

  // Save Project Settings
  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;

    const parsedTechStack = techStackInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    updateProject(activeProject.id, {
      name: projectName.trim(),
      description: projectDesc.trim(),
      currency,
      monthlyBudgetCap: Number(budgetCap),
      totalCashReserve: Number(cashReserve),
      expectedMonthlyUsers: Number(monthlyUsers),
      expectedMonthlyRevenue: Number(monthlyRevenue),
      hourlyDevRate: Number(hourlyRate),
      status,
      techStack: parsedTechStack,
    });

    setProjectSaved(true);
    setTimeout(() => setProjectSaved(false), 2500);
  };

  // Import JSON File
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = (await readJSONFile(file)) as any;
      if (data && (data.projects || data.expenses)) {
        importFullState(data);
        alert('DevSpend backup imported successfully!');
      } else {
        alert('Invalid DevSpend JSON backup schema.');
      }
    } catch {
      alert('Failed to parse the selected JSON file.');
    }
  };

  // Export Ledger CSV
  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const rows = expenses.map((e) => ({
      ID: e.id,
      Title: e.title,
      Vendor: e.vendor,
      Category: e.category,
      BillingCycle: e.billingCycle,
      Amount: e.amount,
      NormalizedMonthly: normalizeToMonthly(e.amount, e.billingCycle).toFixed(2),
      Date: e.date,
      IsEssential: e.isEssential,
      IsAiOptimized: e.isAiOptimized,
      Notes: e.notes ?? '',
    }));
    exportToCSV(rows, `${activeProject?.slug || 'devspend'}-ledger.csv`);
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      {/* Page Title */}
      <div className="border-b border-zinc-800/80 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          Settings & Data Portability Vault
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Configure visual themes, calibrate project unit economics, and manage GitHub-backed JSON/CSV backups.
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 0: DYNAMIC APPEARANCE & THEME STUDIO (15 THEMES)
      ───────────────────────────────────────────────────────────── */}
      <ThemeSelectorStudio />

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: AI PROVIDER CONFIGURATION
      ───────────────────────────────────────────────────────────── */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Cpu size={16} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                AI FinOps Engine Provider
              </h2>
              <p className="text-xs text-zinc-400">
                Keys are stored locally in your browser's <code className="text-violet-300">localStorage</code>. Never sent to third-party tracking servers.
              </p>
            </div>
          </div>
        </div>

        {/* Provider Radio Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { id: 'deterministic', name: 'Deterministic (Offline)', desc: 'Zero API keys required' },
            { id: 'gemini', name: 'Google Gemini', desc: 'gemini-2.0-flash (Free Tier)' },
            { id: 'groq', name: 'Groq Cloud', desc: 'llama-3.3-70b-versatile' },
            { id: 'openrouter', name: 'OpenRouter', desc: 'llama-3.3-70b free model' },
          ].map((prov) => (
            <label
              key={prov.id}
              onClick={() => updateSettings({ activeProvider: prov.id as AiProvider })}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                settings.activeProvider === prov.id
                  ? 'border-violet-500/80 bg-violet-500/10 text-zinc-100'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="aiProvider"
                  checked={settings.activeProvider === prov.id}
                  onChange={() => {}}
                  className="accent-violet-500"
                />
                <span className="text-xs font-semibold">{prov.name}</span>
              </div>
              <span className="text-[11px] text-zinc-500 block mt-1 pl-5">
                {prov.desc}
              </span>
            </label>
          ))}
        </div>

        {/* API Key Inputs */}
        {settings.activeProvider !== 'deterministic' && (
          <div className="space-y-4 pt-2">
            {settings.activeProvider === 'gemini' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-zinc-300 font-medium">Google Gemini API Key</label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-violet-400 hover:underline text-[11px]"
                  >
                    Get Free Gemini Key ↗
                  </a>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showGemini ? 'text' : 'password'}
                      value={settings.geminiApiKey}
                      onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
                      placeholder="AIzaSy..."
                      className="input pr-10 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGemini(!showGemini)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showGemini ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button
                    onClick={() => handleTestConnection('gemini', settings.geminiApiKey)}
                    disabled={testStatus.testing}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium border border-zinc-700 transition-colors shrink-0"
                  >
                    Test Key
                  </button>
                </div>
              </div>
            )}

            {settings.activeProvider === 'groq' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-zinc-300 font-medium">Groq Cloud API Key</label>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-violet-400 hover:underline text-[11px]"
                  >
                    Get Free Groq Key ↗
                  </a>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showGroq ? 'text' : 'password'}
                      value={settings.groqApiKey}
                      onChange={(e) => updateSettings({ groqApiKey: e.target.value })}
                      placeholder="gsk_..."
                      className="input pr-10 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGroq(!showGroq)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showGroq ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button
                    onClick={() => handleTestConnection('groq', settings.groqApiKey)}
                    disabled={testStatus.testing}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium border border-zinc-700 transition-colors shrink-0"
                  >
                    Test Key
                  </button>
                </div>
              </div>
            )}

            {settings.activeProvider === 'openrouter' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-zinc-300 font-medium">OpenRouter API Key</label>
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-violet-400 hover:underline text-[11px]"
                  >
                    Get OpenRouter Key ↗
                  </a>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showOpenRouter ? 'text' : 'password'}
                      value={settings.openrouterApiKey}
                      onChange={(e) => updateSettings({ openrouterApiKey: e.target.value })}
                      placeholder="sk-or-..."
                      className="input pr-10 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenRouter(!showOpenRouter)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showOpenRouter ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button
                    onClick={() => handleTestConnection('openrouter', settings.openrouterApiKey)}
                    disabled={testStatus.testing}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium border border-zinc-700 transition-colors shrink-0"
                  >
                    Test Key
                  </button>
                </div>
              </div>
            )}

            {/* Test Connection Result message */}
            {testStatus.message && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  testStatus.success
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                }`}
              >
                {testStatus.success ? <Check size={14} /> : <AlertTriangle size={14} />}
                <span>{testStatus.message}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: PROJECT UNIT ECONOMICS CALIBRATOR
      ───────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSaveProject} className="card p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers size={16} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Project Calibration & Unit Economics
              </h2>
              <p className="text-xs text-zinc-400">
                Controls runway forecasters, debug cost multipliers, and unit economics calculations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCreateProjectModalOpen(true)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <FolderPlus size={13} className="text-violet-400" /> + New Project
            </button>
            <button type="submit" className="btn-primary text-xs py-1.5 px-3">
              {projectSaved ? (
                <>
                  <Check size={14} /> Saved!
                </>
              ) : (
                <>
                  <Save size={14} /> Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Display Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="select text-xs"
            >
              <option value="USD">USD ($) — US Dollar</option>
              <option value="EUR">EUR (€) — Euro</option>
              <option value="GBP">GBP (£) — British Pound</option>
              <option value="INR">INR (₹) — Indian Rupee</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Description
          </label>
          <input
            type="text"
            value={projectDesc}
            onChange={(e) => setProjectDesc(e.target.value)}
            className="input text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Monthly Budget Cap ($)
            </label>
            <input
              type="number"
              min="0"
              value={budgetCap}
              onChange={(e) => setBudgetCap(parseFloat(e.target.value) || 0)}
              className="input num text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Total Cash Reserve ($)
            </label>
            <input
              type="number"
              min="0"
              value={cashReserve}
              onChange={(e) => setCashReserve(parseFloat(e.target.value) || 0)}
              className="input num text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Developer Hourly Rate ($/hr)
            </label>
            <input
              type="number"
              min="0"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
              className="input num text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Project Lifecycle Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="select text-xs capitalize"
            >
              <option value="mvp">MVP</option>
              <option value="scaling">Scaling</option>
              <option value="production">Production</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Expected Monthly Users (MAU)
            </label>
            <input
              type="number"
              min="1"
              value={monthlyUsers}
              onChange={(e) => setMonthlyUsers(parseInt(e.target.value) || 1)}
              className="input num text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Expected Monthly Revenue ($ MRR)
            </label>
            <input
              type="number"
              min="0"
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(parseFloat(e.target.value) || 0)}
              className="input num text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Tech Stack Tags (comma separated)
          </label>
          <input
            type="text"
            value={techStackInput}
            onChange={(e) => setTechStackInput(e.target.value)}
            placeholder="Next.js, Supabase, OpenAI, Vercel, Stripe"
            className="input text-xs font-mono"
          />
        </div>
      </form>

      {/* ─────────────────────────────────────────────────────────────
          SECTION: GITHUB-BACKED USER SHARDS DATABASE (PublicUsersData/)
      ───────────────────────────────────────────────────────────── */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database size={16} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                GitHub-Backed Sharded User Database (`PublicUsersData/`)
              </h2>
              <p className="text-xs text-zinc-400">
                Sharded multi-tenant user storage (strictly 200 users max per shard file) with bi-directional Git sync.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => syncShards()}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} className={shardSyncStatus === 'syncing' ? 'animate-spin text-amber-400' : 'text-emerald-400'} />
              <span>{shardSyncStatus === 'syncing' ? 'Syncing...' : 'Force Sync Now'}</span>
            </button>
          </div>
        </div>

        {/* Database Inventory Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 text-center font-mono">
            <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">Repository</span>
            <span className="text-xs font-bold text-zinc-200">theeequint/DevSpend</span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 text-center font-mono">
            <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">Active Write Shard</span>
            <span className="text-xs font-bold text-emerald-400">{activeShardName}</span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 text-center font-mono">
            <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">Total Registered Users</span>
            <span className="text-xs font-bold text-zinc-200">{totalUsersCount} (Max 200/file)</span>
          </div>
        </div>

        {/* GitHub PAT Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setGitHubToken(githubToken);
            setTokenSaved(true);
            setTimeout(() => setTokenSaved(false), 2000);
          }}
          className="space-y-3 pt-2"
        >
          <div className="flex items-center justify-between text-xs">
            <label className="text-zinc-300 font-medium">GitHub Personal Access Token (for auto-commits)</label>
            <span className="text-[11px] text-zinc-500 font-mono">Permissions: repo (contents write)</span>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showGithubToken ? 'text' : 'password'}
                value={githubToken}
                onChange={(e) => setGithubTokenState(e.target.value)}
                placeholder="ghp_..."
                className="input pr-10 text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowGithubToken(!showGithubToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                {showGithubToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              {tokenSaved ? (
                <>
                  <Check size={14} /> Saved!
                </>
              ) : (
                <>
                  <Save size={14} /> Update Token
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: DATA PORTABILITY, BACKUPS & RESTORE
      ───────────────────────────────────────────────────────────── */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Database size={16} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Data Portability & Backup Vault
              </h2>
              <p className="text-xs text-zinc-400">
                Zero lock-in. Full JSON backups, CSV accountant exports, and instant seed restore.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Export JSON */}
          <button
            onClick={() => exportToJSON(exportFullState(), `devspend-backup-${Date.now()}.json`)}
            className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 text-left space-y-1.5 transition-colors group"
          >
            <div className="flex items-center justify-between text-zinc-300 group-hover:text-zinc-100">
              <span className="text-xs font-semibold">Export JSON State</span>
              <Download size={14} className="text-violet-400" />
            </div>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Full timestamped database backup of all projects, expenses, and AI audits.
            </p>
          </button>

          {/* Import JSON */}
          <label className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 text-left space-y-1.5 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between text-zinc-300 group-hover:text-zinc-100">
              <span className="text-xs font-semibold">Import JSON State</span>
              <Upload size={14} className="text-cyan-400" />
            </div>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Restore from a previously saved JSON snapshot. Overwrites existing state.
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 text-left space-y-1.5 transition-colors group"
          >
            <div className="flex items-center justify-between text-zinc-300 group-hover:text-zinc-100">
              <span className="text-xs font-semibold">Export Ledger CSV</span>
              <Download size={14} className="text-emerald-400" />
            </div>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Spreadsheet format ready for accountant review, IRS deduction, or Excel.
            </p>
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={() => {
              if (window.confirm('Reset all DevSpend data to default demo projects? Current edits will be lost.')) {
                resetToSeedData();
              }
            }}
            className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-left space-y-1.5 transition-colors group"
          >
            <div className="flex items-center justify-between text-rose-300 group-hover:text-rose-200">
              <span className="text-xs font-semibold">Reset to Seed Demo</span>
              <RotateCcw size={14} className="text-rose-400" />
            </div>
            <p className="text-[11px] text-rose-400/70 leading-normal">
              Re-populate with rich demo datasets (NexusAI and HyperNote projects).
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
