import React, { useState } from 'react';
import { Plus, Download, Sparkles, Filter, Layers } from 'lucide-react';
import { useActiveProject, useProjectExpenses, useSpendStore } from '../../store/useSpendStore';
import { formatCurrency, normalizeToMonthly, exportToCSV } from '../../utils/formatters';
import { ExpenseItem } from '../../types';
import DebugTimerWidget from './DebugTimerWidget';
import ExpenseTable from './ExpenseTable';
import AddExpenseModal from './AddExpenseModal';

export const LedgerView: React.FC = () => {
  const activeProject = useActiveProject();
  const expenses = useProjectExpenses(activeProject?.id ?? '');
  const { addExpenseModalOpen, setAddExpenseModalOpen } = useSpendStore();

  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

  const currency = activeProject?.currency ?? 'USD';

  // Compute quick summary
  const totalMonthlyBurn = expenses.reduce(
    (sum, e) => sum + normalizeToMonthly(e.amount, e.billingCycle),
    0
  );

  const essentialMonthly = expenses
    .filter((e) => e.isEssential)
    .reduce((sum, e) => sum + normalizeToMonthly(e.amount, e.billingCycle), 0);

  const nonEssentialMonthly = totalMonthlyBurn - essentialMonthly;

  const handleEdit = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setAddExpenseModalOpen(true);
  };

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
      HoursLogged: e.hoursLogged ?? 0,
      UsageMetric: e.usageMetric ?? '',
      Date: e.date,
      IsEssential: e.isEssential,
      IsAiOptimized: e.isAiOptimized,
      Notes: e.notes ?? '',
    }));
    exportToCSV(rows, `${activeProject?.slug || 'devspend'}-ledger.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Ledger Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            Expense Ledger & Tech-Debt Tracker
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time granular cost accounting for <span className="text-zinc-200 font-semibold">{activeProject?.name}</span>
          </p>
        </div>

        {/* Quick summary numbers & export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-4 bg-zinc-900/90 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block font-mono">Net Burn</span>
              <span className="num font-bold text-zinc-100">
                {formatCurrency(totalMonthlyBurn, currency)}/mo
              </span>
            </div>
            <div className="w-px h-6 bg-zinc-800" />
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block font-mono">Essential</span>
              <span className="num font-medium text-emerald-400">
                {formatCurrency(essentialMonthly, currency)}
              </span>
            </div>
            <div className="w-px h-6 bg-zinc-800" />
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block font-mono">Non-Essential</span>
              <span className="num font-medium text-amber-400">
                {formatCurrency(nonEssentialMonthly, currency)}
              </span>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium border border-zinc-700 transition-colors flex items-center gap-1.5"
            title="Download CSV spreadsheet"
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Live Debugging & Tech-Debt Tracker */}
      <DebugTimerWidget />

      {/* Main Expense Table */}
      <ExpenseTable onEditExpense={handleEdit} />

      {/* Add / Edit Modal */}
      <AddExpenseModal
        open={addExpenseModalOpen}
        onClose={() => {
          setAddExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        editingExpense={editingExpense}
      />
    </div>
  );
};

export default LedgerView;
