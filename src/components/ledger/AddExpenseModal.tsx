import React, { useState, useEffect } from 'react';
import { X, Sparkles, Clock, DollarSign, Tag, Calendar, FileText } from 'lucide-react';
import { useActiveProject, useSpendStore } from '../../store/useSpendStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ExpenseCategory, BillingCycle, ExpenseItem, ExpensePreset } from '../../types';
import { normalizeToMonthly, formatCurrency, isoNow } from '../../utils/formatters';

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  editingExpense?: ExpenseItem | null;
}

const PRESETS: ExpensePreset[] = [
  { label: 'OpenAI API', vendor: 'OpenAI', category: 'apis_llms', billingCycle: 'usage_based', typicalAmount: 50 },
  { label: 'Anthropic Claude', vendor: 'Anthropic', category: 'apis_llms', billingCycle: 'usage_based', typicalAmount: 35 },
  { label: 'Vercel Pro', vendor: 'Vercel', category: 'cloud_infra', billingCycle: 'monthly', typicalAmount: 20 },
  { label: 'Supabase Pro', vendor: 'Supabase', category: 'cloud_infra', billingCycle: 'monthly', typicalAmount: 25 },
  { label: 'AWS EC2 / S3', vendor: 'AWS', category: 'cloud_infra', billingCycle: 'monthly', typicalAmount: 65 },
  { label: 'Cloudflare Workers', vendor: 'Cloudflare', category: 'cloud_infra', billingCycle: 'monthly', typicalAmount: 5 },
  { label: 'Cursor Pro', vendor: 'Cursor', category: 'devtools_saas', billingCycle: 'monthly', typicalAmount: 20 },
  { label: 'GitHub Copilot', vendor: 'GitHub', category: 'devtools_saas', billingCycle: 'monthly', typicalAmount: 10 },
  { label: 'Sentry Error Track', vendor: 'Sentry', category: 'devtools_saas', billingCycle: 'monthly', typicalAmount: 26 },
  { label: 'Linear Standard', vendor: 'Linear', category: 'devtools_saas', billingCycle: 'monthly', typicalAmount: 8 },
  { label: 'Namecheap Domain', vendor: 'Namecheap', category: 'domains_legal_misc', billingCycle: 'annual', typicalAmount: 15 },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  open,
  onClose,
  editingExpense,
}) => {
  const activeProject = useActiveProject();
  const { addExpense, updateExpense } = useSpendStore();
  const { currentUser } = useAuthStore();

  const hourlyRate = activeProject?.hourlyDevRate ?? 60;
  const currency = activeProject?.currency ?? 'USD';

  // Form State
  const [title, setTitle] = useState('');
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('cloud_infra');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [amount, setAmount] = useState<number>(0);
  const [hoursLogged, setHoursLogged] = useState<number>(0);
  const [usageMetric, setUsageMetric] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isEssential, setIsEssential] = useState(true);
  const [notes, setNotes] = useState('');

  // Prepopulate when editing
  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title);
      setVendor(editingExpense.vendor);
      setCategory(editingExpense.category);
      setBillingCycle(editingExpense.billingCycle);
      setAmount(editingExpense.amount);
      setHoursLogged(editingExpense.hoursLogged ?? 0);
      setUsageMetric(editingExpense.usageMetric ?? '');
      setDate(editingExpense.date ? editingExpense.date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setIsEssential(editingExpense.isEssential);
      setNotes(editingExpense.notes ?? '');
    } else {
      // Reset form
      setTitle('');
      setVendor('');
      setCategory('cloud_infra');
      setBillingCycle('monthly');
      setAmount(0);
      setHoursLogged(0);
      setUsageMetric('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsEssential(true);
      setNotes('');
    }
  }, [editingExpense, open]);

  if (!open) return null;

  // Apply a smart preset
  const applyPreset = (preset: ExpensePreset) => {
    setTitle(preset.label);
    setVendor(preset.vendor);
    setCategory(preset.category);
    setBillingCycle(preset.billingCycle);
    setAmount(preset.typicalAmount);
  };

  // If user enters hours for debugging or salaries, auto-calculate monetary cost
  const handleHoursChange = (hrs: number) => {
    setHoursLogged(hrs);
    if (category === 'debugging_tech_debt' || category === 'salaries_contractors') {
      const calculated = Math.round(hrs * hourlyRate * 100) / 100;
      setAmount(calculated);
      setUsageMetric(`${hrs} hrs @ $${hourlyRate}/hr`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !vendor.trim()) return;

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        title: title.trim(),
        vendor: vendor.trim(),
        category,
        billingCycle,
        amount: Number(amount),
        hoursLogged: hoursLogged > 0 ? Number(hoursLogged) : undefined,
        usageMetric: usageMetric.trim() || undefined,
        date: new Date(date).toISOString(),
        isEssential,
        notes: notes.trim(),
      });
    } else {
      addExpense({
        projectId: activeProject?.id ?? '',
        ownerUserId: currentUser?.id || activeProject?.ownerUserId || 'user_demo',
        title: title.trim(),
        vendor: vendor.trim(),
        category,
        billingCycle,
        amount: Number(amount),
        hoursLogged: hoursLogged > 0 ? Number(hoursLogged) : undefined,
        usageMetric: usageMetric.trim() || undefined,
        date: new Date(date).toISOString(),
        isEssential,
        isAiOptimized: false,
        notes: notes.trim(),
      });
    }

    onClose();
  };

  const normalizedBurn = normalizeToMonthly(amount, billingCycle);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121215] border border-zinc-700/80 rounded-t-3xl sm:rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[88dvh] sm:max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 pb-[env(safe-area-inset-bottom)] sm:pb-0">
        <div className="w-12 h-1.5 rounded-full bg-zinc-600/50 mx-auto my-2.5 sm:hidden shrink-0" />
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <DollarSign size={18} className="text-violet-400" />
              {editingExpense ? 'Edit Expense Item' : 'Log New Expense'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Target Project: <span className="text-zinc-200 font-mono">{activeProject?.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Smart Presets Bar */}
          {!editingExpense && (
            <div className="space-y-1.5 pb-2 border-b border-zinc-800/80">
              <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                <Sparkles size={11} className="text-violet-400" /> Smart Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title & Vendor Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Expense Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Supabase Pro Database"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Vendor / Service *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Supabase, AWS, OpenAI"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Category & Billing Cycle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="select"
              >
                <option value="cloud_infra">Cloud & Infrastructure</option>
                <option value="apis_llms">APIs & LLMs</option>
                <option value="debugging_tech_debt">Debugging & Tech Debt</option>
                <option value="salaries_contractors">Salaries & Contractors</option>
                <option value="devtools_saas">DevTools & SaaS</option>
                <option value="domains_legal_misc">Domains, Legal & Misc</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Billing Cycle
              </label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                className="select"
              >
                <option value="monthly">Monthly Recurring</option>
                <option value="annual">Annual (Amortized to /mo)</option>
                <option value="usage_based">Usage-Based Metered</option>
                <option value="one_time">One-Time Setup / Capital</option>
                <option value="time_logged">Time Logged (Hours)</option>
              </select>
            </div>
          </div>

          {/* Amount & Normalization Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Base Amount ({currency}) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={amount === 0 ? '' : amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="input num font-mono"
                />
              </div>
            </div>

            {/* Effective monthly burn display */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-2.5 space-y-1">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">
                Effective Monthly Impact
              </span>
              <div className="num font-bold text-base text-zinc-100">
                {formatCurrency(normalizedBurn, currency)}/mo
              </div>
              {billingCycle === 'annual' && (
                <span className="text-[10px] text-zinc-400 block">
                  Amortized over 12 months (${amount}/12)
                </span>
              )}
            </div>
          </div>

          {/* Conditional Hours Logged field */}
          {(category === 'debugging_tech_debt' || category === 'salaries_contractors' || billingCycle === 'time_logged') && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Clock size={13} /> Hours Spent (Auto-calculates @ ${hourlyRate}/hr)
                </label>
                <span className="text-xs font-mono text-amber-400">
                  Rate: ${hourlyRate}/hr
                </span>
              </div>
              <input
                type="number"
                step="0.25"
                min="0"
                placeholder="Enter hours (e.g. 4.5)"
                value={hoursLogged === 0 ? '' : hoursLogged}
                onChange={(e) => handleHoursChange(parseFloat(e.target.value) || 0)}
                className="input num font-mono bg-zinc-900/90"
              />
            </div>
          )}

          {/* Usage metric & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Usage Metric / Volume (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. ~15M tokens, 200GB egress"
                value={usageMetric}
                onChange={(e) => setUsageMetric(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Date Incurred
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Essential Toggle */}
          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="isEssential"
              checked={isEssential}
              onChange={(e) => setIsEssential(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 text-violet-600 focus:ring-violet-500 bg-zinc-900"
            />
            <label htmlFor="isEssential" className="text-xs text-zinc-300 cursor-pointer">
              <span className="font-medium text-zinc-200">Mission-Critical / Essential Expense</span>
              <span className="block text-[11px] text-zinc-500">
                Uncheck if this is a "nice-to-have" tool that can be cut during runway crunches
              </span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Notes & Architectural Context
            </label>
            <textarea
              rows={2}
              placeholder="Why was this provisioned? Free-tier limits or upgrade triggers..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              {editingExpense ? 'Save Changes' : 'Append to Ledger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
