// ============================================================
// DevSpend — Ownership & Cap Table Management Module
// 5 KPI Cards, Cap Table Grid, Funding Ledger, Charts & Dilution
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  PieChart as PieChartIcon,
  TrendingUp,
  DollarSign,
  Users,
  Award,
  Layers,
  Plus,
  Download,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Building,
  Shield,
  FileText,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  useActiveProject,
  useProjectStakeholders,
  useProjectFundingRounds,
  useCapTableSummary,
  useSpendStore,
} from '../../store/useSpendStore';
import {
  formatCurrency,
  formatDate,
  exportToCSV,
  exportToJSON,
  STAKEHOLDER_ROLE_META,
  EQUITY_INSTRUMENT_META,
  safeDiv,
} from '../../utils/formatters';
import { Stakeholder, FundingRound, EquityInstrument } from '../../types';
import DilutionSimulatorWidget from './DilutionSimulatorWidget';
import AddStakeholderModal from './AddStakeholderModal';
import AddFundingRoundModal from './AddFundingRoundModal';

const PIE_COLORS = [
  '#10B981', // emerald (founders)
  '#3B82F6', // blue (investors)
  '#8B5CF6', // purple (esop)
  '#F59E0B', // amber (advisors)
  '#EC4899', // pink (strategic)
  '#6366F1', // indigo
];

export const OwnershipView: React.FC = () => {
  const activeProject = useActiveProject();
  const stakeholders = useProjectStakeholders(activeProject?.id ?? '');
  const fundingRounds = useProjectFundingRounds(activeProject?.id ?? '');
  const capSummary = useCapTableSummary(activeProject?.id);

  const {
    addStakeholderModalOpen,
    setAddStakeholderModalOpen,
    addFundingRoundModalOpen,
    setAddFundingRoundModalOpen,
    editingStakeholder,
    setEditingStakeholder,
    editingFundingRound,
    setEditingFundingRound,
    deleteStakeholder,
    deleteFundingRound,
  } = useSpendStore();

  const [stakeholderToDelete, setStakeholderToDelete] = useState<Stakeholder | null>(null);
  const [roundToDelete, setRoundToDelete] = useState<FundingRound | null>(null);

  const currency = activeProject?.currency ?? 'USD';

  // ── Prepare Equity Donut Data ──
  const equityDistributionData = useMemo(() => {
    if (capSummary.totalShares === 0) return [];

    const data = [
      {
        name: 'Founders',
        value: capSummary.founderShares,
        percent: capSummary.founderPercent,
        color: '#10B981', // emerald
      },
      {
        name: 'Investors (VC & Angels)',
        value: capSummary.investorShares,
        percent: capSummary.investorPercent,
        color: '#3B82F6', // blue
      },
      {
        name: 'ESOP / Option Pool',
        value: capSummary.esopShares,
        percent: capSummary.esopPercent,
        color: '#8B5CF6', // purple
      },
      {
        name: 'Advisors & Strategic',
        value: capSummary.advisorShares,
        percent: capSummary.advisorPercent,
        color: '#F59E0B', // amber
      },
    ].filter((d) => d.value > 0);

    return data;
  }, [capSummary]);

  // ── Prepare Treasury Comparison Bar Data ──
  const treasuryComparisonData = useMemo(() => {
    const totalRaised = capSummary.totalCapitalRaised;
    const cashReserve = activeProject?.totalCashReserve ?? 0;
    const capitalDeployed = Math.max(0, totalRaised - cashReserve);

    return [
      {
        metric: 'Total Raised',
        amount: totalRaised,
        fill: '#10B981',
      },
      {
        metric: 'In Treasury (Bank)',
        amount: cashReserve,
        fill: '#3B82F6',
      },
      {
        metric: 'Capital Deployed',
        amount: capitalDeployed,
        fill: '#6B7280',
      },
    ];
  }, [capSummary.totalCapitalRaised, activeProject?.totalCashReserve]);

  // ── Exports ──
  const handleExportCSV = () => {
    if (stakeholders.length === 0) return;
    const rows = stakeholders.map((s) => ({
      ID: s.id,
      Name: s.name,
      Role: s.role,
      Instrument: s.instrument || s.instrumentType || 'common_stock',
      SharesOwned: s.sharesOwned,
      OwnershipPercent: (
        (s.sharesOwned / (capSummary.totalShares || 1)) *
        100
      ).toFixed(2),
      TotalInvested: s.totalInvestedAmount,
      HasVotingRights: s.hasVotingRights ?? s.votingRights ?? true,
      VestingSchedule: s.vestingSchedule ?? '',
      Round: s.investmentRound ?? s.roundName ?? '',
      DateJoined: s.dateJoined ?? s.investmentDate ?? '',
      Notes: s.notes ?? '',
    }));
    exportToCSV(rows, `${activeProject?.slug || 'devspend'}-cap-table.csv`);
  };

  const handleExportJSON = () => {
    exportToJSON(
      {
        project: activeProject?.name,
        capSummary,
        stakeholders,
        fundingRounds,
      },
      `${activeProject?.slug || 'devspend'}-ownership-data.json`
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header Banner with Action Buttons ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              <PieChartIcon size={20} className="text-emerald-400" />
              Ownership & Cap Table Architecture
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Institutional Grade
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Track equity capitalization, funding milestones, investor registry, and dilution waterfalls for{' '}
            <span className="text-zinc-200 font-semibold">{activeProject?.name}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setEditingStakeholder(null);
              setAddStakeholderModalOpen(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-950/40 border border-emerald-500/30 transition-all flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>+ Add Stakeholder / Investment</span>
          </button>

          <button
            onClick={() => {
              setEditingFundingRound(null);
              setAddFundingRoundModalOpen(true);
            }}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
          >
            <TrendingUp size={14} className="text-emerald-400" />
            <span>+ Record Funding Round</span>
          </button>

          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded text-xs transition-colors flex items-center gap-1"
              title="Export Cap Table to CSV"
            >
              <Download size={12} /> CSV
            </button>
            <button
              onClick={handleExportJSON}
              className="px-2.5 py-1.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded text-xs transition-colors flex items-center gap-1"
              title="Export Cap Table & Financing to JSON"
            >
              <FileText size={12} /> JSON
            </button>
          </div>
        </div>
      </div>

      {/* ── 5 Monospace KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1: Total Capital Raised */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Total Capital Raised
          </span>
          <div className="mt-2">
            <span className="text-lg font-bold font-mono text-emerald-400">
              {formatCurrency(capSummary.totalCapitalRaised, currency)}
            </span>
            <span className="block text-[10px] text-zinc-500 mt-0.5">
              {capSummary.fundingRoundCount} financing rounds
            </span>
          </div>
        </div>

        {/* 2: Implied Post-Money Valuation */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Implied Post-Money
          </span>
          <div className="mt-2">
            <span className="text-lg font-bold font-mono text-zinc-100">
              {formatCurrency(capSummary.postMoneyValuation, currency)}
            </span>
            <span className="block text-[10px] text-zinc-500 mt-0.5">
              Based on latest equity round
            </span>
          </div>
        </div>

        {/* 3: Founder Ownership % */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Founder Ownership
          </span>
          <div className="mt-2">
            <span className="text-lg font-bold font-mono text-emerald-300">
              {capSummary.founderPercent.toFixed(1)}%
            </span>
            <span className="block text-[10px] text-zinc-500 mt-0.5">
              {capSummary.founderShares.toLocaleString()} founder shares
            </span>
          </div>
        </div>

        {/* 4: Investor & Advisor Stake % */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Investor & Advisors
          </span>
          <div className="mt-2">
            <span className="text-lg font-bold font-mono text-blue-400">
              {(capSummary.investorPercent + capSummary.advisorPercent).toFixed(1)}%
            </span>
            <span className="block text-[10px] text-zinc-500 mt-0.5">
              ESOP Pool: {capSummary.esopPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* 5: Total Issued Shares & Share Price */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Total Issued Shares
          </span>
          <div className="mt-2">
            <span className="text-lg font-bold font-mono text-zinc-200">
              {capSummary.totalShares.toLocaleString()}
            </span>
            <span className="block text-[10px] text-zinc-400 font-mono mt-0.5">
              ${capSummary.pricePerShare.toFixed(3)} / share
            </span>
          </div>
        </div>
      </div>

      {/* ── Recharts Visualizations (Donut + Treasury Bar) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Equity Distribution Donut */}
        <div className="lg:col-span-7 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <PieChartIcon size={16} className="text-emerald-400" />
                Equity Distribution by Stakeholder Class
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">
                100% Fully Diluted
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Breakdown of total issued capital stock, stock options, and institutional ownership.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-4">
            <div className="sm:col-span-7 h-52">
              {equityDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={equityDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {equityDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(val: any, name: any, item: any) => [
                        `${item.payload.percent.toFixed(1)}% (${Number(val).toLocaleString()} sh)`,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: '#f4f4f5',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                  No equity data logged
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="sm:col-span-5 space-y-2">
              {equityDistributionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-zinc-300 text-[11px]">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-zinc-200">
                    {item.percent.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Capital Raised vs. Treasury Bar */}
        <div className="lg:col-span-5 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Building size={16} className="text-blue-400" />
                Capital Inflow vs. Treasury Reserves
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Comparison of cumulative capital raised against remaining liquid bank treasury.
            </p>
          </div>

          <div className="h-52 my-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={treasuryComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="metric" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <RechartsTooltip
                  formatter={(val: any) => [formatCurrency(Number(val), currency), 'Amount']}
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f4f4f5',
                  }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {treasuryComparisonData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-2 border-t border-zinc-800/60 font-mono">
            <span>Treasury Balance:</span>
            <span className="text-blue-400 font-bold">
              {formatCurrency(activeProject?.totalCashReserve ?? 0, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Interactive Cap Table & Stakeholder Registry ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Users size={17} className="text-emerald-400" />
              Cap Table & Stakeholder Registry
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Comprehensive registry of equity stakes, voting power, and investment amounts.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {stakeholders.length} Stakeholders Registered
          </span>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3">Stakeholder</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Instrument</th>
                  <th className="py-3 px-3 text-right">Invested Capital</th>
                  <th className="py-3 px-3 text-right">Shares Owned</th>
                  <th className="py-3 px-3 text-right w-44">Ownership %</th>
                  <th className="py-3 px-3 text-center">Voting / Status</th>
                  <th className="py-3 px-3 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {stakeholders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users size={28} className="text-zinc-700" />
                        <p className="text-zinc-400 font-medium text-sm">
                          No stakeholders recorded yet
                        </p>
                        <p className="text-xs text-zinc-600 max-w-sm">
                          Register your founders, angel investors, option pool, or advisors to populate the cap table.
                        </p>
                        <button
                          onClick={() => {
                            setEditingStakeholder(null);
                            setAddStakeholderModalOpen(true);
                          }}
                          className="mt-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Plus size={13} /> Add First Stakeholder
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  stakeholders.map((s) => {
                    const pct =
                      capSummary.totalShares > 0
                        ? (s.sharesOwned / capSummary.totalShares) * 100
                        : 0;
                    const roleMeta = STAKEHOLDER_ROLE_META[s.role] || {
                      label: s.role,
                      color: 'zinc',
                    };
                    const instKey = (s.instrument || s.instrumentType || 'common_stock') as EquityInstrument;
                    const instrumentMeta =
                      (EQUITY_INSTRUMENT_META as Record<string, { label: string; short: string }>)[instKey] || {
                        label: instKey,
                        short: instKey,
                      };
                    const hasVoting = s.hasVotingRights ?? s.votingRights ?? true;

                    return (
                      <tr key={s.id} className="hover:bg-zinc-900/50 transition-colors group">
                        {/* Stakeholder Name */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-zinc-100 group-hover:text-emerald-300 transition-colors">
                            {s.name}
                          </div>
                          {s.vestingSchedule && (
                            <div className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">
                              {s.vestingSchedule}
                            </div>
                          )}
                        </td>

                        {/* Role Badge */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-900 border border-zinc-800 text-zinc-300">
                            {roleMeta.label}
                          </span>
                        </td>

                        {/* Equity Instrument */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-900 border border-zinc-800 text-zinc-400">
                            {instrumentMeta.label}
                          </span>
                        </td>

                        {/* Invested Capital */}
                        <td className="py-3 px-3 text-right font-mono text-zinc-300 font-semibold">
                          {formatCurrency(s.totalInvestedAmount, currency)}
                        </td>

                        {/* Shares Owned */}
                        <td className="py-3 px-3 text-right font-mono text-zinc-200">
                          {s.sharesOwned.toLocaleString()}
                        </td>

                        {/* Ownership % + Progress Bar */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2.5">
                            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-emerald-400 text-xs w-14 text-right">
                              {pct.toFixed(2)}%
                            </span>
                          </div>
                        </td>

                        {/* Voting Rights / Status */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {hasVoting ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                              <CheckCircle2 size={12} /> Voting
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                              Non-Voting
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                            <button
                              onClick={() => {
                                setEditingStakeholder(s);
                                setAddStakeholderModalOpen(true);
                              }}
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
                              title="Edit Stakeholder"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => setStakeholderToDelete(s)}
                              className="p-1 hover:bg-rose-950/40 rounded text-zinc-500 hover:text-rose-400 transition-colors"
                              title="Delete Stakeholder"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Funding Rounds & Investment History Ledger ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <TrendingUp size={17} className="text-emerald-400" />
              Financing Milestones & Funding Rounds
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Historical record of equity rounds, pre/post money valuations, and dilution events.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingFundingRound(null);
              setAddFundingRoundModalOpen(true);
            }}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors flex items-center gap-1"
          >
            <Plus size={13} /> Add Round
          </button>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3">Round Name</th>
                  <th className="py-3 px-3">Closing Date</th>
                  <th className="py-3 px-3 text-right">Amount Raised</th>
                  <th className="py-3 px-3 text-right">Pre-Money Valuation</th>
                  <th className="py-3 px-3 text-right">Post-Money Valuation</th>
                  <th className="py-3 px-3 text-right">Dilution %</th>
                  <th className="py-3 px-3">Lead Investor</th>
                  <th className="py-3 px-3 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {fundingRounds.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-zinc-500">
                      No funding rounds recorded yet. Use &ldquo;Record Funding Round&rdquo; to add financing history.
                    </td>
                  </tr>
                ) : (
                  fundingRounds.map((f) => (
                    <tr key={f.id} className="hover:bg-zinc-900/50 transition-colors group">
                      <td className="py-2.5 px-3 font-semibold text-zinc-100">
                        {f.roundName}
                        {f.notes && (
                          <div className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">
                            {f.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400">
                        {formatDate(f.date)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(f.amountRaised, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-zinc-400">
                        {formatCurrency(f.preMoneyValuation, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-200">
                        {formatCurrency(f.postMoneyValuation, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-400 font-semibold">
                        {(f.dilutionPercentage ?? f.equityDilutedPercent ?? 0).toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300 font-medium">
                        {f.leadInvestor || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() => {
                              setEditingFundingRound(f);
                              setAddFundingRoundModalOpen(true);
                            }}
                            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
                            title="Edit Round"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => setRoundToDelete(f)}
                            className="p-1 hover:bg-rose-950/40 rounded text-zinc-500 hover:text-rose-400 transition-colors"
                            title="Delete Round"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Next Round Dilution & Exit Valuation Simulator ── */}
      <DilutionSimulatorWidget />

      {/* ── Modals ── */}
      <AddStakeholderModal
        open={addStakeholderModalOpen}
        onClose={() => {
          setAddStakeholderModalOpen(false);
          setEditingStakeholder(null);
        }}
        editingStakeholder={editingStakeholder}
      />

      <AddFundingRoundModal
        open={addFundingRoundModalOpen}
        onClose={() => {
          setAddFundingRoundModalOpen(false);
          setEditingFundingRound(null);
        }}
        editingFundingRound={editingFundingRound}
      />

      {/* ── Stakeholder Delete Confirmation ── */}
      {stakeholderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-9 h-9 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <AlertTriangle size={18} />
              </div>
              <h3 className="font-semibold text-zinc-100">Remove Stakeholder?</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Are you sure you want to remove{' '}
              <span className="text-zinc-200 font-semibold">
                &ldquo;{stakeholderToDelete.name}&rdquo;
              </span>{' '}
              ({stakeholderToDelete.sharesOwned.toLocaleString()} shares) from the cap table?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setStakeholderToDelete(null)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteStakeholder(stakeholderToDelete.id);
                  setStakeholderToDelete(null);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-lg font-medium transition-colors"
              >
                Remove Stakeholder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Funding Round Delete Confirmation ── */}
      {roundToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-9 h-9 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <AlertTriangle size={18} />
              </div>
              <h3 className="font-semibold text-zinc-100">Delete Funding Round?</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Are you sure you want to delete the{' '}
              <span className="text-zinc-200 font-semibold">
                &ldquo;{roundToDelete.roundName}&rdquo;
              </span>{' '}
              funding round record ({formatCurrency(roundToDelete.amountRaised, currency)})?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRoundToDelete(null)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteFundingRound(roundToDelete.id);
                  setRoundToDelete(null);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-lg font-medium transition-colors"
              >
                Delete Round
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnershipView;
