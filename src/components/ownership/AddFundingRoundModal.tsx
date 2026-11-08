// ============================================================
// DevSpend — Add / Edit Funding Round Modal
// Records Financing Milestones, Valuations & Dilution
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  DollarSign,
  Calendar,
  Check,
  AlertCircle,
  Building,
  Percent,
} from 'lucide-react';
import { useActiveProject, useSpendStore } from '../../store/useSpendStore';
import { FundingRound } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface AddFundingRoundModalProps {
  open: boolean;
  onClose: () => void;
  editingFundingRound?: FundingRound | null;
}

const COMMON_ROUNDS = [
  'Pre-Seed',
  'Seed',
  'SAFE Note Round',
  'Series A',
  'Series B',
  'Government Grant',
  'Founder Capital Infusion',
];

export const AddFundingRoundModal: React.FC<AddFundingRoundModalProps> = ({
  open,
  onClose,
  editingFundingRound,
}) => {
  const activeProject = useActiveProject();
  const { addFundingRound, updateFundingRound, updateProject } = useSpendStore();

  const currency = activeProject?.currency ?? 'USD';

  // Form State
  const [roundName, setRoundName] = useState('Seed');
  const [amountRaised, setAmountRaised] = useState<string>('500000');
  const [preMoneyValuation, setPreMoneyValuation] = useState<string>('4000000');
  const [postMoneyValuation, setPostMoneyValuation] = useState<string>('4500000');
  const [dilutionPercentage, setDilutionPercentage] = useState<string>('11.11');
  const [leadInvestor, setLeadInvestor] = useState('');
  const [sharesIssued, setSharesIssued] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [addToCashReserve, setAddToCashReserve] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto calculate post-money & dilution when amount or pre-money changes
  const handleAmountChange = (val: string) => {
    setAmountRaised(val);
    const amt = parseFloat(val) || 0;
    const pre = parseFloat(preMoneyValuation) || 0;
    const post = pre + amt;
    setPostMoneyValuation(post.toString());
    const dil = post > 0 ? (amt / post) * 100 : 0;
    setDilutionPercentage(dil.toFixed(2));
  };

  const handlePreMoneyChange = (val: string) => {
    setPreMoneyValuation(val);
    const amt = parseFloat(amountRaised) || 0;
    const pre = parseFloat(val) || 0;
    const post = pre + amt;
    setPostMoneyValuation(post.toString());
    const dil = post > 0 ? (amt / post) * 100 : 0;
    setDilutionPercentage(dil.toFixed(2));
  };

  useEffect(() => {
    if (editingFundingRound) {
      setRoundName(editingFundingRound.roundName);
      setAmountRaised(editingFundingRound.amountRaised.toString());
      setPreMoneyValuation(editingFundingRound.preMoneyValuation.toString());
      setPostMoneyValuation(editingFundingRound.postMoneyValuation.toString());
      const dil = editingFundingRound.dilutionPercentage ?? editingFundingRound.equityDilutedPercent ?? 0;
      setDilutionPercentage(dil.toString());
      setLeadInvestor(editingFundingRound.leadInvestor ?? '');
      setSharesIssued(
        editingFundingRound.sharesIssued ? editingFundingRound.sharesIssued.toString() : ''
      );
      setDate(editingFundingRound.date.split('T')[0]);
      setNotes(editingFundingRound.notes ?? '');
      setAddToCashReserve(false);
    } else {
      setRoundName('Seed');
      setAmountRaised('500000');
      setPreMoneyValuation('4000000');
      setPostMoneyValuation('4500000');
      setDilutionPercentage('11.11');
      setLeadInvestor('');
      setSharesIssued('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setAddToCashReserve(true);
    }
    setError(null);
  }, [editingFundingRound, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roundName.trim()) {
      setError('Please provide a round name (e.g. Seed, SAFE).');
      return;
    }

    if (!activeProject) {
      setError('No active project selected.');
      return;
    }

    const raised = Math.max(0, parseFloat(amountRaised) || 0);
    const pre = Math.max(0, parseFloat(preMoneyValuation) || 0);
    const post = Math.max(pre + raised, parseFloat(postMoneyValuation) || (pre + raised));
    const dilution = Math.max(0, parseFloat(dilutionPercentage) || 0);
    const shares = sharesIssued ? parseInt(sharesIssued, 10) : undefined;
    const sharePrice = shares && shares > 0 ? raised / shares : undefined;

    const payload = {
      projectId: activeProject.id,
      ownerUserId: activeProject.ownerUserId || 'user_demo',
      roundName: roundName.trim(),
      amountRaised: raised,
      preMoneyValuation: pre,
      postMoneyValuation: post,
      equityDilutedPercent: dilution,
      dilutionPercentage: dilution,
      leadInvestor: leadInvestor.trim() || undefined,
      sharesIssued: shares,
      sharePrice,
      date: new Date(date).toISOString(),
      notes: notes.trim() || undefined,
      addToCashReserve,
    };

    if (editingFundingRound) {
      updateFundingRound(editingFundingRound.id, payload);
    } else {
      addFundingRound(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <TrendingUp size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                {editingFundingRound ? 'Edit Funding Round' : 'Record Funding Round'}
              </h2>
              <p className="text-xs text-zinc-400">
                Log equity financing, SAFEs, or capital injections
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Round Presets */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Select or Enter Round Name *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_ROUNDS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoundName(r)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg transition-colors border ${
                    roundName === r
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="e.g. Series Seed-2"
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Amount Raised & Pre-Money */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Amount Raised ({currency}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="500000"
                  value={amountRaised}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Pre-Money Valuation ({currency})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="4000000"
                  value={preMoneyValuation}
                  onChange={(e) => handlePreMoneyChange(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Post-Money Valuation & Dilution % */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Post-Money Valuation ({currency})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={postMoneyValuation}
                  onChange={(e) => setPostMoneyValuation(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Implied Dilution %
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={dilutionPercentage}
                  onChange={(e) => setDilutionPercentage(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Lead Investor & Shares Issued */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Lead Investor / Syndicate Lead
              </label>
              <input
                type="text"
                placeholder="e.g. Sequoia Scout or Techstars"
                value={leadInvestor}
                onChange={(e) => setLeadInvestor(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Shares / Units Issued (Optional)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 1250000"
                value={sharesIssued}
                onChange={(e) => setSharesIssued(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Round Closing Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Auto Credit Cash Reserve Checkbox */}
          {!editingFundingRound && (parseFloat(amountRaised) || 0) > 0 && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={addToCashReserve}
                  onChange={(e) => setAddToCashReserve(e.target.checked)}
                  className="mt-0.5 rounded bg-zinc-950 border-zinc-800 text-emerald-500 focus:ring-0 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-semibold text-emerald-300 block">
                    Deposit {formatCurrency(parseFloat(amountRaised) || 0, currency)} directly into Cash Reserves
                  </span>
                  <span className="text-zinc-400 text-[11px]">
                    Instantly increases company treasury and extends runway calculations.
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Round Terms / Legal Summary
            </label>
            <textarea
              rows={2}
              placeholder="e.g. YC Post-Money SAFE with MFN rights and 1x liquidation preference."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-md shadow-emerald-950/30 flex items-center gap-1.5"
            >
              <Check size={14} />
              {editingFundingRound ? 'Save Changes' : 'Record Financing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFundingRoundModal;
