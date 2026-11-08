// ============================================================
// DevSpend — Add & Edit Revenue / Funds Modal
// Supports MRR, contracts, grants, and founder capital additions
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Sparkles,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building,
  Tag,
  Calendar,
  Layers,
  Check,
} from 'lucide-react';
import { useActiveProject, useSpendStore } from '../../store/useSpendStore';
import { useAuthStore } from '../../store/useAuthStore';
import { RevenueCategory, BillingCycle, RevenueItem, RevenuePreset } from '../../types';
import {
  formatCurrency,
  REVENUE_CATEGORY_META,
  REVENUE_PRESETS,
  safeNum,
} from '../../utils/formatters';

interface AddRevenueModalProps {
  open: boolean;
  onClose: () => void;
  editingRevenue?: RevenueItem | null;
}

export const AddRevenueModal: React.FC<AddRevenueModalProps> = ({
  open,
  onClose,
  editingRevenue,
}) => {
  const activeProject = useActiveProject();
  const { addRevenue, updateRevenue } = useSpendStore();
  const { currentUser } = useAuthStore();

  const currency = activeProject?.currency ?? 'USD';

  // Form State
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('Stripe');
  const [category, setCategory] = useState<RevenueCategory>('mrr_subscriptions');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [amount, setAmount] = useState<number>(0);
  const [feePercent, setFeePercent] = useState<number>(2.9);
  const [feeDeducted, setFeeDeducted] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(true);
  const [notes, setNotes] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (editingRevenue) {
      setTitle(editingRevenue.title);
      setSource(editingRevenue.source);
      setCategory(editingRevenue.category);
      setBillingCycle(editingRevenue.billingCycle);
      setAmount(editingRevenue.amount);
      setFeeDeducted(editingRevenue.feeDeducted ?? 0);
      setFeePercent(
        editingRevenue.amount > 0 && editingRevenue.feeDeducted
          ? Math.round((editingRevenue.feeDeducted / editingRevenue.amount) * 1000) / 10
          : 0
      );
      setDate(editingRevenue.date ? editingRevenue.date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setIsRecurring(editingRevenue.isRecurring);
      setNotes(editingRevenue.notes ?? '');
    } else {
      // Default initial state
      setTitle('');
      setSource('Stripe');
      setCategory('mrr_subscriptions');
      setBillingCycle('monthly');
      setAmount(1000);
      setFeePercent(2.9);
      setFeeDeducted(29.0);
      setDate(new Date().toISOString().split('T')[0]);
      setIsRecurring(true);
      setNotes('');
    }
  }, [editingRevenue, open]);

  if (!open) return null;

  // Auto calculate fee when amount or feePercent changes
  const handleAmountChange = (val: number) => {
    const safeVal = Math.max(0, val);
    setAmount(safeVal);
    if (feePercent > 0) {
      setFeeDeducted(Math.round((safeVal * (feePercent / 100)) * 100) / 100);
    }
  };

  const handleFeePercentChange = (pct: number) => {
    setFeePercent(pct);
    setFeeDeducted(Math.round((amount * (pct / 100)) * 100) / 100);
  };

  const netAmount = Math.max(0, safeNum(amount) - safeNum(feeDeducted));

  const applyPreset = (preset: RevenuePreset) => {
    setTitle(preset.label);
    setSource(preset.source);
    setCategory(preset.category);
    setBillingCycle(preset.billingCycle);
    setAmount(preset.typicalAmount);
    const pct = preset.typicalFeePercent ?? 0;
    setFeePercent(pct);
    setFeeDeducted(Math.round((preset.typicalAmount * (pct / 100)) * 100) / 100);
    setIsRecurring(preset.billingCycle !== 'one_time');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !source.trim() || amount <= 0) return;

    if (editingRevenue) {
      updateRevenue(editingRevenue.id, {
        title: title.trim(),
        source: source.trim(),
        category,
        billingCycle,
        amount: Number(amount),
        feeDeducted: Number(feeDeducted),
        netAmount,
        date: new Date(date).toISOString(),
        isRecurring,
        notes: notes.trim(),
      });
    } else {
      addRevenue({
        projectId: activeProject?.id ?? '',
        ownerUserId: currentUser?.id || activeProject?.ownerUserId || 'user_demo',
        title: title.trim(),
        source: source.trim(),
        category,
        billingCycle,
        amount: Number(amount),
        feeDeducted: Number(feeDeducted),
        netAmount,
        date: new Date(date).toISOString(),
        isRecurring,
        notes: notes.trim(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-[#121215] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-zinc-100">
                {editingRevenue ? 'Edit Revenue Entry' : 'Log Inflow & Capital Addition'}
              </h2>
              <p className="text-[11px] text-zinc-400 font-mono">
                Project: {activeProject?.name || 'Active Workspace'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Quick presets */}
          {!editingRevenue && (
            <div className="space-y-1.5 pb-2 border-b border-zinc-800/80">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <Sparkles size={11} className="text-emerald-400" /> Inflow Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {REVENUE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="px-2 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>{p.label}</span>
                    <span className="text-emerald-400 font-bold">${p.typicalAmount}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-zinc-400 mb-1">Inflow Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Stripe SaaS Subscriptions"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-mono text-zinc-400 mb-1">Source / Channel *</label>
              <input
                type="text"
                required
                placeholder="e.g. Stripe, Paddle, Wire, AWS"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="input text-xs font-mono"
              />
            </div>
          </div>

          {/* Category & Billing Cycle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-zinc-400 mb-1">Inflow Category</label>
              <select
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as RevenueCategory;
                  setCategory(cat);
                  if (cat === 'capital_addition' || cat === 'grants_credits') {
                    setBillingCycle('one_time');
                    setIsRecurring(false);
                    setFeePercent(0);
                    setFeeDeducted(0);
                  }
                }}
                className="select text-xs font-mono"
              >
                {Object.entries(REVENUE_CATEGORY_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono text-zinc-400 mb-1">Cycle / Frequency</label>
              <select
                value={billingCycle}
                onChange={(e) => {
                  const cycle = e.target.value as BillingCycle;
                  setBillingCycle(cycle);
                  setIsRecurring(cycle !== 'one_time');
                }}
                className="select text-xs font-mono"
              >
                <option value="monthly">Monthly Recurring (MRR)</option>
                <option value="annual">Annual Recurring (ARR)</option>
                <option value="one_time">One-Time / Invoiced</option>
              </select>
            </div>
          </div>

          {/* Gross Amount, Fee & Net Amount strip */}
          <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/70 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-mono text-zinc-400 mb-1">
                  Gross Amount ({currency}) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={amount}
                    onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                    className="input pl-7 font-mono text-xs font-bold text-zinc-100"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">
                    $
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-mono text-zinc-400 mb-1">
                  Processor Fee %
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={feePercent}
                  onChange={(e) => handleFeePercentChange(parseFloat(e.target.value) || 0)}
                  className="input font-mono text-xs text-zinc-300"
                  placeholder="2.9"
                />
              </div>

              <div>
                <label className="block font-mono text-zinc-400 mb-1">Fee Deducted ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={feeDeducted}
                  onChange={(e) => setFeeDeducted(parseFloat(e.target.value) || 0)}
                  className="input font-mono text-xs text-zinc-400"
                />
              </div>
            </div>

            {/* Calculated Net Revenue Summary Banner */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
              <span className="font-mono text-zinc-400 text-[11px]">
                Net Inflow Credited to Treasury:
              </span>
              <span className="num font-bold font-mono text-emerald-400 text-sm">
                +{formatCurrency(netAmount, currency)}
              </span>
            </div>
          </div>

          {/* Date & Recurring Checkbox */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block font-mono text-zinc-400 mb-1">Effective Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input text-xs font-mono"
              />
            </div>

            <div className="pt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="isRecurring" className="font-mono text-zinc-300 text-xs cursor-pointer">
                Recurring SaaS Revenue (Count in MRR)
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-mono text-zinc-400 mb-1">Notes & Contract Memo</label>
            <textarea
              rows={2}
              placeholder="e.g. Customer Stripe Account, Invoice #1024, or non-dilutive grant terms..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="textarea text-xs font-mono"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>{editingRevenue ? 'Update Revenue' : 'Record Inflow'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRevenueModal;
