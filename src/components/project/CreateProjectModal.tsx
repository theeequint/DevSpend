import React, { useState } from 'react';
import {
  X,
  Plus,
  FolderPlus,
  Sparkles,
  Layers,
  DollarSign,
  Users,
  Clock,
  Check,
  Zap,
} from 'lucide-react';
import { useSpendStore } from '../../store/useSpendStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Currency, ProjectStatus } from '../../types';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

const POPULAR_STACKS = [
  'Next.js',
  'React',
  'TypeScript',
  'Supabase',
  'PostgreSQL',
  'OpenAI',
  'Anthropic',
  'Gemini',
  'Vercel',
  'AWS',
  'Cloudflare',
  'Stripe',
  'Redis',
  'Tailwind CSS',
  'Docker',
  'Python',
  'FastAPI',
];

interface StarterTemplate {
  name: string;
  desc: string;
  techStack: string[];
  budget: number;
  reserve: number;
  mau: number;
  mrr: number;
  rate: number;
  status: ProjectStatus;
}

const TEMPLATES: StarterTemplate[] = [
  {
    name: 'AI Agent SaaS',
    desc: 'LLM-powered automation tool with subscriptions and RAG vectors',
    techStack: ['Next.js', 'TypeScript', 'Supabase', 'OpenAI', 'Vercel', 'Stripe'],
    budget: 1000,
    reserve: 15000,
    mau: 1000,
    mrr: 2500,
    rate: 65,
    status: 'scaling',
  },
  {
    name: 'Lean Micro-SaaS',
    desc: 'Solo developer utility tool on free/budget serverless tier',
    techStack: ['Next.js', 'Tailwind CSS', 'PostgreSQL', 'Stripe', 'Cloudflare'],
    budget: 250,
    reserve: 5000,
    mau: 300,
    mrr: 800,
    rate: 50,
    status: 'mvp',
  },
  {
    name: 'Mobile App Backend',
    desc: 'Cross-platform app backend with edge APIs and object storage',
    techStack: ['React', 'Cloudflare', 'Anthropic', 'Supabase', 'Redis'],
    budget: 500,
    reserve: 8000,
    mau: 600,
    mrr: 1200,
    rate: 60,
    status: 'mvp',
  },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  open,
  onClose,
}) => {
  const { addProject, setCreateProjectModalOpen } = useSpendStore();
  const { currentUser } = useAuthStore();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [status, setStatus] = useState<ProjectStatus>('mvp');
  const [selectedTech, setSelectedTech] = useState<string[]>([
    'Next.js',
    'TypeScript',
    'Tailwind CSS',
  ]);
  const [customTechInput, setCustomTechInput] = useState('');

  // Financial metrics
  const [monthlyBudgetCap, setMonthlyBudgetCap] = useState<number>(800);
  const [totalCashReserve, setTotalCashReserve] = useState<number>(10000);
  const [expectedMonthlyUsers, setExpectedMonthlyUsers] = useState<number>(500);
  const [expectedMonthlyRevenue, setExpectedMonthlyRevenue] = useState<number>(1500);
  const [hourlyDevRate, setHourlyDevRate] = useState<number>(60);

  if (!open) return null;

  // Auto-fill slug from name if user hasn't explicitly customized slug
  const handleNameChange = (val: string) => {
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(generatedSlug);
  };

  const applyTemplate = (t: StarterTemplate) => {
    setName(t.name);
    handleNameChange(t.name);
    setDescription(t.desc);
    setSelectedTech(t.techStack);
    setMonthlyBudgetCap(t.budget);
    setTotalCashReserve(t.reserve);
    setExpectedMonthlyUsers(t.mau);
    setExpectedMonthlyRevenue(t.mrr);
    setHourlyDevRate(t.rate);
    setStatus(t.status);
  };

  const toggleTech = (tech: string) => {
    setSelectedTech((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  const handleAddCustomTech = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTechInput.trim()) {
      e.preventDefault();
      const val = customTechInput.trim();
      if (!selectedTech.includes(val)) {
        setSelectedTech([...selectedTech, val]);
      }
      setCustomTechInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addProject({
      ownerUserId: currentUser?.id || 'user_demo',
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: description.trim() || 'Software engineering project on DevSpend',
      techStack: selectedTech,
      currency,
      monthlyBudgetCap: Number(monthlyBudgetCap),
      totalCashReserve: Number(totalCashReserve),
      expectedMonthlyUsers: Number(expectedMonthlyUsers),
      expectedMonthlyRevenue: Number(expectedMonthlyRevenue),
      hourlyDevRate: Number(hourlyDevRate),
      status,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121215] border border-zinc-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <FolderPlus size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Create New Project Workspace
              </h2>
              <p className="text-xs text-zinc-400">
                Initialize tracking, unit economics, and AI FinOps for your software product.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Quick Starter Templates */}
          <div className="space-y-2 border-b border-zinc-800/80 pb-3">
            <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
              <Zap size={12} className="text-amber-400" /> Or pick a quick starter template:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  type="button"
                  onClick={() => applyTemplate(tmpl)}
                  className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 text-left transition-colors space-y-1 group"
                >
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-violet-300">
                    {tmpl.name}
                  </div>
                  <div className="text-[10px] text-zinc-500 line-clamp-1">
                    {tmpl.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Project Name & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Audio AI"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Project Slug
              </label>
              <input
                type="text"
                required
                placeholder="acme-audio-ai"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="input text-xs font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Description / Architecture Purpose
            </label>
            <input
              type="text"
              placeholder="e.g. Real-time audio transcription SaaS with Stripe billing"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input text-xs"
            />
          </div>

          {/* Currency & Lifecycle Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Primary Financial Currency
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

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Lifecycle Stage
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="select text-xs capitalize"
              >
                <option value="mvp">MVP (Early Stage)</option>
                <option value="scaling">Scaling (Traffic Growth)</option>
                <option value="production">Production (High Availability)</option>
                <option value="maintenance">Maintenance (Stable Cash-flow)</option>
              </select>
            </div>
          </div>

          {/* Tech Stack Chips */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              Technology Stack ({selectedTech.length} selected)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-zinc-900/60 border border-zinc-800 rounded-lg">
              {POPULAR_STACKS.map((tech) => {
                const isSelected = selectedTech.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleTech(tech)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors flex items-center gap-1 ${
                      isSelected
                        ? 'bg-violet-600/20 border-violet-500/50 text-violet-200'
                        : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {isSelected && <Check size={10} />}
                    <span>{tech}</span>
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              placeholder="Type custom tech & press Enter to add..."
              value={customTechInput}
              onChange={(e) => setCustomTechInput(e.target.value)}
              onKeyDown={handleAddCustomTech}
              className="input text-xs font-mono"
            />
          </div>

          {/* Financial Calibration Metrics */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <DollarSign size={14} className="text-emerald-400" />
              Financial Baseline & Unit Economics Parameters
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Monthly Budget Cap ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={monthlyBudgetCap}
                  onChange={(e) => setMonthlyBudgetCap(parseFloat(e.target.value) || 0)}
                  className="input num text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Total Cash Reserve ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={totalCashReserve}
                  onChange={(e) => setTotalCashReserve(parseFloat(e.target.value) || 0)}
                  className="input num text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Developer Rate ({currency}/hr)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={hourlyDevRate}
                  onChange={(e) => setHourlyDevRate(parseFloat(e.target.value) || 0)}
                  className="input num text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-zinc-800/80">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Expected Monthly Users (MAU)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={expectedMonthlyUsers}
                  onChange={(e) => setExpectedMonthlyUsers(parseInt(e.target.value) || 1)}
                  className="input num text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Expected Monthly Revenue ({currency} MRR)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={expectedMonthlyRevenue}
                  onChange={(e) => setExpectedMonthlyRevenue(parseFloat(e.target.value) || 0)}
                  className="input num text-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs flex items-center gap-1.5">
              <Plus size={14} /> Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
