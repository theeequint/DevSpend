// ============================================================
// DevSpend — Add / Edit Stakeholder Modal
// Captures Equity Holders, SAFEs, ESOP Pool & Investments
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  PieChart,
  UserCheck,
  DollarSign,
  Layers,
  Award,
  Calendar,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  useActiveProject,
  useSpendStore,
  useCapTableSummary,
} from '../../store/useSpendStore';
import {
  Stakeholder,
  StakeholderRole,
  EquityInstrument,
} from '../../types';
import {
  STAKEHOLDER_ROLE_META,
  EQUITY_INSTRUMENT_META,
  formatCurrency,
} from '../../utils/formatters';

interface AddStakeholderModalProps {
  open: boolean;
  onClose: () => void;
  editingStakeholder?: Stakeholder | null;
}

const ROLES: { id: StakeholderRole; label: string }[] = [
  { id: 'founder', label: 'Founder' },
  { id: 'co_founder', label: 'Co-Founder' },
  { id: 'angel_investor', label: 'Angel Investor' },
  { id: 'vc_fund', label: 'Venture Capital Fund' },
  { id: 'employee', label: 'Employee / Key Hire' },
  { id: 'esop_pool', label: 'ESOP / Option Pool' },
  { id: 'advisor', label: 'Advisor' },
  { id: 'strategic_partner', label: 'Strategic Partner' },
];

const INSTRUMENTS: { id: EquityInstrument; label: string }[] = [
  { id: 'common_stock', label: 'Common Stock' },
  { id: 'preferred_stock', label: 'Preferred Stock' },
  { id: 'safe', label: 'SAFE (Simple Agreement for Future Equity)' },
  { id: 'convertible_note', label: 'Convertible Promissory Note' },
  { id: 'options_esop', label: 'Stock Options / ESOP' },
  { id: 'warrants', label: 'Warrants' },
];

export const AddStakeholderModal: React.FC<AddStakeholderModalProps> = ({
  open,
  onClose,
  editingStakeholder,
}) => {
  const activeProject = useActiveProject();
  const { addStakeholder, updateStakeholder, updateProject } = useSpendStore();
  const { totalShares } = useCapTableSummary(activeProject?.id);

  const currency = activeProject?.currency ?? 'USD';

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState<StakeholderRole>('founder');
  const [instrument, setInstrument] = useState<EquityInstrument>('common_stock');
  const [sharesOwned, setSharesOwned] = useState<string>('1000000');
  const [totalInvestedAmount, setTotalInvestedAmount] = useState<string>('0');
  const [investmentRound, setInvestmentRound] = useState('Founding');
  const [hasVotingRights, setHasVotingRights] = useState(true);
  const [vestingSchedule, setVestingSchedule] = useState('4-year monthly with 1-year cliff');
  const [valuationCap, setValuationCap] = useState<string>('');
  const [dateJoined, setDateJoined] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [addToCashReserve, setAddToCashReserve] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when editing or opening
  useEffect(() => {
    if (editingStakeholder) {
      setName(editingStakeholder.name);
      setRole(editingStakeholder.role);
      setInstrument(editingStakeholder.instrument ?? editingStakeholder.instrumentType ?? 'common_stock');
      setSharesOwned(editingStakeholder.sharesOwned.toString());
      setTotalInvestedAmount(editingStakeholder.totalInvestedAmount.toString());
      setInvestmentRound(editingStakeholder.investmentRound ?? editingStakeholder.roundName ?? '');
      setHasVotingRights(editingStakeholder.hasVotingRights ?? editingStakeholder.votingRights ?? true);
      setVestingSchedule(editingStakeholder.vestingSchedule ?? '');
      setValuationCap(
        editingStakeholder.valuationCap ? editingStakeholder.valuationCap.toString() : ''
      );
      const dt = editingStakeholder.dateJoined ?? editingStakeholder.investmentDate ?? new Date().toISOString();
      setDateJoined(dt.split('T')[0]);
      setNotes(editingStakeholder.notes ?? '');
      setAddToCashReserve(false);
    } else {
      setName('');
      setRole('founder');
      setInstrument('common_stock');
      setSharesOwned('1000000');
      setTotalInvestedAmount('0');
      setInvestmentRound('Founding');
      setHasVotingRights(true);
      setVestingSchedule('4-year monthly with 1-year cliff');
      setValuationCap('');
      setDateJoined(new Date().toISOString().split('T')[0]);
      setNotes('');
      setAddToCashReserve(false);
    }
    setError(null);
  }, [editingStakeholder, open]);

  if (!open) return null;

  // Calculate live ownership preview
  const numShares = Math.max(0, parseInt(sharesOwned, 10) || 0);
  const currentTotal = totalShares - (editingStakeholder?.sharesOwned ?? 0);
  const newTotal = currentTotal + numShares;
  const ownershipPercent = newTotal > 0 ? (numShares / newTotal) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a stakeholder or entity name.');
      return;
    }

    if (!activeProject) {
      setError('No active project selected.');
      return;
    }

    const investedNum = Math.max(0, parseFloat(totalInvestedAmount) || 0);
    const capNum = valuationCap ? parseFloat(valuationCap) : undefined;

    const payload = {
      projectId: activeProject.id,
      ownerUserId: activeProject.ownerUserId || 'user_demo',
      name: name.trim(),
      role,
      instrument,
      instrumentType: instrument,
      sharesOwned: numShares,
      totalInvestedAmount: investedNum,
      ownershipPercentage: ownershipPercent,
      hasVotingRights,
      votingRights: hasVotingRights,
      vestingSchedule: vestingSchedule.trim() || undefined,
      investmentRound: investmentRound.trim() || undefined,
      roundName: investmentRound.trim() || 'Founding',
      valuationCap: capNum,
      notes: notes.trim() || '',
      dateJoined: new Date(dateJoined).toISOString(),
      investmentDate: new Date(dateJoined).toISOString(),
    };

    if (editingStakeholder) {
      updateStakeholder(editingStakeholder.id, payload);
    } else {
      addStakeholder(payload);

      // Auto-credit cash reserve if checked
      if (addToCashReserve && investedNum > 0) {
        updateProject(activeProject.id, {
          totalCashReserve: (activeProject.totalCashReserve ?? 0) + investedNum,
        });
      }
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
              <PieChart size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                {editingStakeholder ? 'Edit Stakeholder' : 'Add Stakeholder / Investor'}
              </h2>
              <p className="text-xs text-zinc-400">
                Record equity stakes, SAFEs, ESOP, and cap table participants
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

          {/* Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Stakeholder / Entity Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Elena Rostova or Sequoia Scout"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Role Classification *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StakeholderRole)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Instrument & Round */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Equity Instrument *
              </label>
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value as EquityInstrument)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                {INSTRUMENTS.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Investment Round / Tag
              </label>
              <input
                type="text"
                placeholder="e.g. Founding, Seed, Angel"
                value={investmentRound}
                onChange={(e) => setInvestmentRound(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Shares Owned & Total Investment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Shares / Units Issued *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="1000000"
                value={sharesOwned}
                onChange={(e) => setSharesOwned(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Total Capital Invested ({currency})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={totalInvestedAmount}
                  onChange={(e) => setTotalInvestedAmount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Live Ownership Indicator Card */}
          <div className="bg-zinc-950/70 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-zinc-400 block">
                Calculated Equity Ownership
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {ownershipPercent.toFixed(2)}%
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  ({numShares.toLocaleString()} / {newTotal.toLocaleString()} shares)
                </span>
              </div>
            </div>
            <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${Math.min(100, ownershipPercent)}%` }}
              />
            </div>
          </div>

          {/* Vesting Schedule & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Vesting Schedule (Optional)
              </label>
              <input
                type="text"
                placeholder="4-year monthly with 1-year cliff"
                value={vestingSchedule}
                onChange={(e) => setVestingSchedule(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Date Joined / Issued
              </label>
              <input
                type="date"
                value={dateJoined}
                onChange={(e) => setDateJoined(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Valuation Cap (for SAFE) & Voting Rights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {(instrument === 'safe' || instrument === 'safe_note' || instrument === 'convertible_note') ? (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Valuation Cap ($)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 5000000"
                  value={valuationCap}
                  onChange={(e) => setValuationCap(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            ) : (
              <div />
            )}

            <div className="pt-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasVotingRights}
                  onChange={(e) => setHasVotingRights(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-800 text-emerald-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-zinc-300">
                  Holds voting rights / board observer status
                </span>
              </label>
            </div>
          </div>

          {/* Checkbox: Add investment to cash reserves */}
          {!editingStakeholder && (parseFloat(totalInvestedAmount) || 0) > 0 && (
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
                    Credit {formatCurrency(parseFloat(totalInvestedAmount) || 0, currency)} directly to Cash Reserves
                  </span>
                  <span className="text-zinc-400 text-[11px]">
                    Increases project treasury and extends total runway immediately.
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Internal Legal / Investor Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Standard Delaware C-Corp founder common stock agreement."
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
              {editingStakeholder ? 'Save Changes' : 'Record Stakeholder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStakeholderModal;
