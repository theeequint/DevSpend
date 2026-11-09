// ============================================================
// DevSpend — Unified Triple-Section Financial Ledger View
// Sub-Tabs: [ Overall Cashflow ] [ Revenue / Inflows ] [ Expenses / Outflows ]
// Dual Primary Actions: [+ Add Revenue / Funds] [+ Add Expense]
// 4-Card Real-Time Financial Summary Ribbon
// ============================================================

import React, { useState } from 'react';
import {
  Plus,
  Download,
  TrendingUp,
  TrendingDown,
  Scale,
  Sparkles,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import {
  useActiveProject,
  useProjectExpenses,
  useProjectRevenues,
  useNetMonthlyBurn,
  useSpendStore,
} from '../../store/useSpendStore';
import {
  formatCurrency,
  normalizeToMonthly,
  exportToCSV,
} from '../../utils/formatters';
import { ExpenseItem, RevenueItem } from '../../types';
import DebugTimerWidget from './DebugTimerWidget';
import ExpenseTable from './ExpenseTable';
import RevenueTable from './RevenueTable';
import CashflowTable from './CashflowTable';
import AddExpenseModal from './AddExpenseModal';
import AddRevenueModal from './AddRevenueModal';

export const LedgerView: React.FC = () => {
  const activeProject = useActiveProject();
  const expenses = useProjectExpenses(activeProject?.id ?? '');
  const revenues = useProjectRevenues(activeProject?.id ?? '');

  const {
    ledgerTab,
    setLedgerTab,
    addExpenseModalOpen,
    setAddExpenseModalOpen,
    addRevenueModalOpen,
    setAddRevenueModalOpen,
    editingRevenue,
    setEditingRevenue,
  } = useSpendStore();

  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

  const currency = activeProject?.currency ?? 'USD';
  const {
    grossBurn,
    monthlyRevenue,
    netBurn,
    isDefaultAlive,
    runwayMonths,
    runwayDays,
  } = useNetMonthlyBurn(activeProject?.id);

  // Edit Handlers
  const handleEditExpense = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setAddExpenseModalOpen(true);
  };

  const handleEditRevenue = (revenue: RevenueItem) => {
    setEditingRevenue(revenue);
    setAddRevenueModalOpen(true);
  };

  // Contextual CSV Exporter
  const handleExportCSV = () => {
    const slug = activeProject?.slug || 'devspend';

    if (ledgerTab === 'revenue') {
      if (revenues.length === 0) return;
      const rows = revenues.map((r) => ({
        ID: r.id,
        Title: r.title,
        Source: r.source,
        Category: r.category,
        BillingCycle: r.billingCycle,
        GrossAmount: r.amount,
        ProcessingFee: r.processingFee || 0,
        NetAmount: r.netAmount ?? (r.amount - (r.processingFee || 0)),
        NormalizedMonthly: normalizeToMonthly(
          r.netAmount ?? (r.amount - (r.processingFee || 0)),
          r.billingCycle
        ).toFixed(2),
        Date: r.date,
        IsRecurring: r.isRecurring,
        Notes: r.notes ?? '',
      }));
      exportToCSV(rows, `${slug}-revenue-ledger.csv`);
    } else if (ledgerTab === 'expenses') {
      if (expenses.length === 0) return;
      const rows = expenses.map((e) => ({
        ID: e.id,
        Title: e.title,
        Vendor: e.vendor,
        Category: e.category,
        BillingCycle: e.billingCycle,
        Amount: e.amount,
        NormalizedMonthly: normalizeToMonthly(e.amount, e.billingCycle).toFixed(2),
        HoursLogged: e.hoursLogged ?? 0,
        UsageMetric: e.usageMetric ?? '',
        Date: e.date,
        IsEssential: e.isEssential,
        IsAiOptimized: e.isAiOptimized,
        Notes: e.notes ?? '',
      }));
      exportToCSV(rows, `${slug}-expense-ledger.csv`);
    } else {
      // Overall Cashflow Export
      const revRows = revenues.map((r) => ({
        Type: 'INFLOW',
        ID: r.id,
        Date: r.date,
        Title: r.title,
        Entity: r.source,
        Category: r.category,
        BillingCycle: r.billingCycle,
        Amount: r.netAmount ?? (r.amount - (r.processingFee || 0)),
        MonthlyImpact: normalizeToMonthly(
          r.netAmount ?? (r.amount - (r.processingFee || 0)),
          r.billingCycle
        ).toFixed(2),
        Notes: r.notes ?? '',
      }));

      const expRows = expenses.map((e) => ({
        Type: 'OUTFLOW',
        ID: e.id,
        Date: e.date,
        Title: e.title,
        Entity: e.vendor,
        Category: e.category,
        BillingCycle: e.billingCycle,
        Amount: -e.amount,
        MonthlyImpact: (-normalizeToMonthly(e.amount, e.billingCycle)).toFixed(2),
        Notes: e.notes ?? '',
      }));

      const combined = [...revRows, ...expRows].sort(
        (a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()
      );
      exportToCSV(combined, `${slug}-cashflow-statement.csv`);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header Banner with Dual Actions ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">
              Corporate Financial Ledger
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60">
              v2.5 Full Spectrum
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time cashflow accounting, revenue tracking, and tech-debt ledger for{' '}
            <span className="text-zinc-200 font-semibold">
              {activeProject?.name}
            </span>
          </p>
        </div>

        {/* Dual Primary Action Buttons + Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Revenue / Funds Button */}
          <button
            onClick={() => {
              setEditingRevenue(null);
              setAddRevenueModalOpen(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-950/40 border border-emerald-500/30 transition-all flex items-center gap-1.5 active:scale-[0.98]"
          >
            <ArrowDownRight size={14} className="stroke-[2.5]" />
            <span>+ Add Revenue / Funds</span>
          </button>

          {/* Add Expense Button */}
          <button
            onClick={() => {
              setEditingExpense(null);
              setAddExpenseModalOpen(true);
            }}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
          >
            <ArrowUpRight size={14} className="stroke-[2.5] text-rose-400" />
            <span>+ Add Expense</span>
          </button>

          {/* Contextual Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-medium border border-zinc-800 transition-colors flex items-center gap-1.5"
            title={`Export ${
              ledgerTab === 'revenue'
                ? 'Revenue'
                : ledgerTab === 'expenses'
                ? 'Expenses'
                : 'Overall Cashflow'
            } to CSV`}
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── 4-Card Live Financial Summary Ribbon ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Gross Inflows */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-mono text-[11px] uppercase tracking-wider">
              Gross Inflows
            </span>
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-400">
              <TrendingUp size={13} />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold font-mono text-emerald-400">
              +{formatCurrency(monthlyRevenue, currency)}
              <span className="text-[11px] font-normal text-zinc-500">/mo</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              {revenues.length} active inflow streams
            </div>
          </div>
        </div>

        {/* Total Outflows */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-mono text-[11px] uppercase tracking-wider">
              Total Outflows
            </span>
            <span className="p-1 rounded bg-rose-500/10 text-rose-400">
              <TrendingDown size={13} />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold font-mono text-red-400 font-semibold">
              -{formatCurrency(grossBurn, currency)}
              <span className="text-[11px] font-normal text-zinc-500">/mo</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              {expenses.length} expense line items
            </div>
          </div>
        </div>

        {/* Net Monthly Cashflow */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-mono text-[11px] uppercase tracking-wider">
              Net Cashflow
            </span>
            <span
              className={`p-1 rounded ${
                isDefaultAlive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-red-500/10 text-red-400'
              }`}
            >
              <Scale size={13} />
            </span>
          </div>
          <div className="mt-2">
            <div
              className={`text-lg font-bold font-mono ${
                isDefaultAlive ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'
              }`}
            >
              {isDefaultAlive ? '+' : '-'}
              {formatCurrency(Math.abs(monthlyRevenue - grossBurn), currency)}
              <span className="text-[11px] font-normal text-zinc-500">/mo</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              {isDefaultAlive
                ? 'Profitable / Default Alive'
                : `Net Burn: ${formatCurrency(netBurn, currency)}/mo`}
            </div>
          </div>
        </div>

        {/* Effective Runway Impact */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-mono text-[11px] uppercase tracking-wider">
              Effective Runway
            </span>
            <span className="p-1 rounded bg-zinc-800 text-zinc-300">
              {isDefaultAlive ? (
                <ShieldCheck size={13} className="text-emerald-400" />
              ) : (
                <Clock size={13} />
              )}
            </span>
          </div>
          <div className="mt-2">
            {isDefaultAlive ? (
              <div>
                <div className="text-lg font-bold font-mono text-emerald-400 flex items-center gap-1">
                  <span>∞</span>
                  <span className="text-xs font-semibold">Self-Sustaining</span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Cash reserves not depleting
                </div>
              </div>
            ) : (
              <div>
                <div className="text-lg font-bold font-mono text-amber-400">
                  {runwayMonths}m {runwayDays}d
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Treasury: {formatCurrency(activeProject?.totalCashReserve ?? 0, currency)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Segmented Control Sub-Tabs (Sticky on mobile) ── */}
      <div className="sticky top-14 z-20 bg-[#09090B]/95 backdrop-blur-md py-2 -mx-3 px-3 sm:mx-0 sm:px-0 border-b border-zinc-800/80">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
        <button
          onClick={() => setLedgerTab('overall')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            ledgerTab === 'overall'
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Layers size={14} />
          <span>Overall Cashflow</span>
          <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
            {revenues.length + expenses.length}
          </span>
        </button>

        <button
          onClick={() => setLedgerTab('revenue')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            ledgerTab === 'revenue'
              ? 'bg-emerald-500/15 text-emerald-300 shadow-sm border border-emerald-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <ArrowDownRight size={14} className="text-emerald-400" />
          <span>Revenue / Inflows</span>
          <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-900 text-emerald-400 border border-emerald-900/50">
            {revenues.length}
          </span>
        </button>

        <button
          onClick={() => setLedgerTab('expenses')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            ledgerTab === 'expenses'
              ? 'bg-rose-500/15 text-rose-300 shadow-sm border border-rose-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <ArrowUpRight size={14} className="text-rose-400" />
          <span>Expenses / Outflows</span>
          <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-900 text-rose-400 border border-rose-900/50">
            {expenses.length}
          </span>
        </button>
        </div>
      </div>

      {/* ── Sub-Tab Contents ── */}
      {ledgerTab === 'overall' && (
        <CashflowTable
          onEditExpense={handleEditExpense}
          onEditRevenue={handleEditRevenue}
        />
      )}

      {ledgerTab === 'revenue' && (
        <RevenueTable onEditRevenue={handleEditRevenue} />
      )}

      {ledgerTab === 'expenses' && (
        <div className="space-y-6">
          {/* Live Debugging & Tech-Debt Tracker */}
          <DebugTimerWidget />
          {/* Main Expense Table */}
          <ExpenseTable onEditExpense={handleEditExpense} />
        </div>
      )}

      {/* ── Add / Edit Expense Modal ── */}
      <AddExpenseModal
        open={addExpenseModalOpen}
        onClose={() => {
          setAddExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        editingExpense={editingExpense}
      />

      {/* ── Add / Edit Revenue Modal ── */}
      <AddRevenueModal
        open={addRevenueModalOpen}
        onClose={() => {
          setAddRevenueModalOpen(false);
          setEditingRevenue(null);
        }}
        editingRevenue={editingRevenue}
      />
    </div>
  );
};

export default LedgerView;
