// ============================================================
// DevSpend — Dilution & Exit Valuation Simulator Widget
// Interactive Next-Round What-If & Cap Table Waterfall Payout
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  Sliders,
  DollarSign,
  TrendingUp,
  Award,
  Users,
  Layers,
  ArrowRight,
  ShieldAlert,
  Percent,
} from 'lucide-react';
import { useActiveProject, useProjectStakeholders } from '../../store/useSpendStore';
import { formatCurrency, safeDiv } from '../../utils/formatters';

export const DilutionSimulatorWidget: React.FC = () => {
  const activeProject = useActiveProject();
  const stakeholders = useProjectStakeholders(activeProject?.id ?? '');
  const currency = activeProject?.currency ?? 'USD';

  // Total current shares
  const totalShares = useMemo(
    () => stakeholders.reduce((sum, s) => sum + (s.sharesOwned || 0), 0),
    [stakeholders]
  );

  // Sliders State
  const [newCapital, setNewCapital] = useState<number>(1000000); // $1M
  const [preMoney, setPreMoney] = useState<number>(6000000); // $6M
  const [exitValuation, setExitValuation] = useState<number>(30000000); // $30M

  // Calculations
  const postMoney = preMoney + newCapital;
  const newInvestorStake = postMoney > 0 ? (newCapital / postMoney) * 100 : 0;
  const dilutionFactor = postMoney > 0 ? preMoney / postMoney : 1;

  // Compute founder stake before & after
  const founderShares = stakeholders
    .filter((s) => s.role === 'founder' || s.role === 'co_founder')
    .reduce((sum, s) => sum + (s.sharesOwned || 0), 0);

  const initialFounderPercent =
    totalShares > 0 ? (founderShares / totalShares) * 100 : 0;
  const postRoundFounderPercent = initialFounderPercent * dilutionFactor;

  // Per stakeholder diluted stakes & exit payouts
  const stakeholderPayouts = useMemo(() => {
    return stakeholders.map((s) => {
      const currentPercent =
        totalShares > 0 ? ((s.sharesOwned || 0) / totalShares) * 100 : 0;
      const postRoundPercent = currentPercent * dilutionFactor;
      const payout = (postRoundPercent / 100) * exitValuation;
      const multiple =
        s.totalInvestedAmount > 0 ? payout / s.totalInvestedAmount : null;

      return {
        id: s.id,
        name: s.name,
        role: s.role,
        currentPercent,
        postRoundPercent,
        payout,
        invested: s.totalInvestedAmount,
        multiple,
      };
    });
  }, [stakeholders, totalShares, dilutionFactor, exitValuation]);

  return (
    <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 space-y-6">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sliders size={16} />
            </span>
            <h3 className="text-sm font-semibold text-zinc-100">
              Next-Round Dilution & Exit Payout Simulator
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Simulate your next funding round valuation, equity dilution, and terminal exit waterfall payouts.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs">
          <span className="text-zinc-500 font-mono">Dilution Factor:</span>
          <span className="font-mono font-bold text-amber-400">
            {((1 - dilutionFactor) * 100).toFixed(1)}% dilution
          </span>
        </div>
      </div>

      {/* 3 Interactive Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Slider 1: Capital to Raise */}
        <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">New Capital to Raise</span>
            <span className="font-mono font-bold text-emerald-400">
              {formatCurrency(newCapital, currency)}
            </span>
          </div>
          <input
            type="range"
            min="50000"
            max="5000000"
            step="50000"
            value={newCapital}
            onChange={(e) => setNewCapital(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
            <span>$50k</span>
            <span>$2.5M</span>
            <span>$5M</span>
          </div>
        </div>

        {/* Slider 2: Pre-Money Valuation */}
        <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">Pre-Money Valuation</span>
            <span className="font-mono font-bold text-zinc-200">
              {formatCurrency(preMoney, currency)}
            </span>
          </div>
          <input
            type="range"
            min="500000"
            max="30000000"
            step="250000"
            value={preMoney}
            onChange={(e) => setPreMoney(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
            <span>$500k</span>
            <span>$15M</span>
            <span>$30M</span>
          </div>
        </div>

        {/* Slider 3: Target Exit Valuation */}
        <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">Target Exit Valuation</span>
            <span className="font-mono font-bold text-teal-400">
              {formatCurrency(exitValuation, currency)}
            </span>
          </div>
          <input
            type="range"
            min="1000000"
            max="100000000"
            step="1000000"
            value={exitValuation}
            onChange={(e) => setExitValuation(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
            <span>$1M</span>
            <span>$50M</span>
            <span>$100M</span>
          </div>
        </div>
      </div>

      {/* Live Calculated Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">
            Post-Money Valuation
          </span>
          <span className="text-base font-bold font-mono text-zinc-100 mt-1 block">
            {formatCurrency(postMoney, currency)}
          </span>
        </div>

        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">
            New Investor Stake
          </span>
          <span className="text-base font-bold font-mono text-amber-400 mt-1 block">
            {newInvestorStake.toFixed(2)}%
          </span>
        </div>

        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">
            Founder Dilution
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs font-mono text-zinc-400 line-through">
              {initialFounderPercent.toFixed(1)}%
            </span>
            <ArrowRight size={12} className="text-zinc-500" />
            <span className="text-base font-bold font-mono text-emerald-400">
              {postRoundFounderPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">
            New Lead Payout @ Exit
          </span>
          <span className="text-base font-bold font-mono text-teal-300 mt-1 block">
            {formatCurrency((newInvestorStake / 100) * exitValuation, currency)}
          </span>
        </div>
      </div>

      {/* Dynamic Payout Table */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 overflow-hidden">
        <div className="px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-200">
            Waterfall Exit Payouts by Stakeholder
          </span>
          <span className="text-[11px] text-zinc-400 font-mono">
            Exit Basis: {formatCurrency(exitValuation, currency)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/30 text-zinc-500 font-mono text-[10px] uppercase">
                <th className="py-2.5 px-3">Stakeholder</th>
                <th className="py-2.5 px-3 text-right">Current Stake</th>
                <th className="py-2.5 px-3 text-right">Post-Round Stake</th>
                <th className="py-2.5 px-3 text-right">Exit Payout</th>
                <th className="py-2.5 px-3 text-right">ROI Multiple</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {stakeholderPayouts.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-900/40">
                  <td className="py-2 px-3 font-medium text-zinc-200">
                    {row.name}
                    <span className="ml-2 text-[10px] text-zinc-500 font-mono">
                      {row.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-zinc-400">
                    {row.currentPercent.toFixed(2)}%
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-400">
                    {row.postRoundPercent.toFixed(2)}%
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-zinc-100">
                    {formatCurrency(row.payout, currency)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-[11px]">
                    {row.multiple !== null ? (
                      <span className="text-teal-400 font-semibold">
                        {row.multiple.toFixed(1)}x
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              ))}

              {/* Simulated New Investor Row */}
              <tr className="bg-emerald-950/20 font-semibold text-emerald-300">
                <td className="py-2 px-3">
                  ★ Next Round Investor ({formatCurrency(newCapital, currency)} lead)
                </td>
                <td className="py-2 px-3 text-right font-mono text-zinc-500">0.00%</td>
                <td className="py-2 px-3 text-right font-mono text-emerald-300">
                  {newInvestorStake.toFixed(2)}%
                </td>
                <td className="py-2 px-3 text-right font-mono text-emerald-200">
                  {formatCurrency((newInvestorStake / 100) * exitValuation, currency)}
                </td>
                <td className="py-2 px-3 text-right font-mono text-teal-300">
                  {(
                    ((newInvestorStake / 100) * exitValuation) /
                    newCapital
                  ).toFixed(1)}
                  x
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DilutionSimulatorWidget;
