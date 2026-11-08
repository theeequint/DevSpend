// ============================================================
// DevSpend — Edit Project Details & Economics Modal
// Contextual configuration for currency, budget cap, cash reserve & rate
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Check,
  Trash2,
  FolderEdit,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { useSpendStore, useActiveProject } from '../../store/useSpendStore';
import { Currency, Project, ProjectStatus } from '../../types';

interface EditProjectModalProps {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  open,
  onClose,
  project,
}) => {
  const activeProjectFromStore = useActiveProject();
  const targetProject = project || activeProjectFromStore;

  const { updateProject, setDeleteProjectModal } = useSpendStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [budgetCap, setBudgetCap] = useState(1000);
  const [cashReserve, setCashReserve] = useState(15000);
  const [hourlyRate, setHourlyRate] = useState(60);
  const [status, setStatus] = useState<ProjectStatus>('scaling');
  const [monthlyUsers, setMonthlyUsers] = useState(1000);
  const [monthlyRevenue, setMonthlyRevenue] = useState(2000);
  const [techStackInput, setTechStackInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (targetProject) {
      setName(targetProject.name || '');
      setDescription(targetProject.description || '');
      setCurrency(targetProject.currency || 'USD');
      setBudgetCap(targetProject.monthlyBudgetCap ?? 1000);
      setCashReserve(targetProject.totalCashReserve ?? 15000);
      setHourlyRate(targetProject.hourlyDevRate ?? 60);
      setStatus(targetProject.status || 'scaling');
      setMonthlyUsers(targetProject.expectedMonthlyUsers ?? 1000);
      setMonthlyRevenue(targetProject.expectedMonthlyRevenue ?? 2000);
      setTechStackInput(targetProject.techStack?.join(', ') || '');
    }
  }, [targetProject, open]);

  if (!open || !targetProject) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedTechStack = techStackInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    updateProject(targetProject.id, {
      name: name.trim(),
      description: description.trim(),
      currency,
      monthlyBudgetCap: Number(budgetCap),
      totalCashReserve: Number(cashReserve),
      hourlyDevRate: Number(hourlyRate),
      status,
      expectedMonthlyUsers: Number(monthlyUsers),
      expectedMonthlyRevenue: Number(monthlyRevenue),
      techStack: parsedTechStack,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleDelete = () => {
    onClose();
    setDeleteProjectModal(true, targetProject.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="bg-[#121215] border border-zinc-700/80 rounded-t-3xl sm:rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[88dvh] sm:max-h-[90vh] animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 pb-[env(safe-area-inset-bottom)] sm:pb-0">
        <div className="w-12 h-1.5 rounded-full bg-zinc-600/50 mx-auto my-2.5 sm:hidden shrink-0" />
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FolderEdit size={16} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                Edit Workspace Project & Economics
              </h3>
              <p className="text-[11px] text-zinc-400">
                Calibrate currency, budget ceiling, cash reserve, and engineering burn rate.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Project Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
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
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input text-xs"
              placeholder="What does this workspace build?"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Monthly Budget Cap ({currency})
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
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Cash Reserve ({currency})
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
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Dev Hourly Rate ({currency}/hr)
              </label>
              <input
                type="number"
                min="0"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                className="input num text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Lifecycle Status
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

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Expected MAU
              </label>
              <input
                type="number"
                min="0"
                value={monthlyUsers}
                onChange={(e) => setMonthlyUsers(parseInt(e.target.value) || 0)}
                className="input num text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Expected MRR ({currency})
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
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Tech Stack Tags (comma separated)
            </label>
            <input
              type="text"
              value={techStackInput}
              onChange={(e) => setTechStackInput(e.target.value)}
              placeholder="Next.js, Supabase, Tailwind, Gemini, Stripe"
              className="input text-xs font-mono"
            />
          </div>

          {/* Delete Danger Zone */}
          <div className="pt-3 mt-4 border-t border-zinc-800/80 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Delete This Project</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-xs py-1.5 px-4 cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check size={13} />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal;
