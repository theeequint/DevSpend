import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit2,
  Copy,
  Star,
  Trash2,
  Filter,
  Check,
  Plus,
  Sparkles,
} from 'lucide-react';
import {
  useActiveProject,
  useProjectExpenses,
  useSpendStore,
} from '../../store/useSpendStore';
import {
  formatCurrency,
  formatDate,
  normalizeToMonthly,
  billingCycleLabel,
  CATEGORY_META,
} from '../../utils/formatters';
import { ExpenseCategory, BillingCycle, ExpenseItem } from '../../types';
import CategoryBadge from '../ui/CategoryBadge';

interface ExpenseTableProps {
  onEditExpense: (expense: ExpenseItem) => void;
}

type SortField = 'date' | 'amount' | 'vendor' | 'title';
type SortDirection = 'asc' | 'desc';

const ALL_CATEGORIES: ExpenseCategory[] = [
  'apis_llms',
  'cloud_infra',
  'debugging_tech_debt',
  'salaries_contractors',
  'devtools_saas',
  'domains_legal_misc',
];

export const ExpenseTable: React.FC<ExpenseTableProps> = ({ onEditExpense }) => {
  const activeProject = useActiveProject();
  const expenses = useProjectExpenses(activeProject?.id ?? '');
  const { deleteExpense, duplicateExpense, updateExpense, setAddExpenseModalOpen } =
    useSpendStore();

  const currency = activeProject?.currency ?? 'USD';

  // Filters & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<ExpenseCategory[]>([]);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Toggle category in multi-select
  const toggleCategory = (cat: ExpenseCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // Filtered and sorted data
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((item) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = item.title.toLowerCase().includes(q);
          const matchesVendor = item.vendor.toLowerCase().includes(q);
          const matchesNotes = item.notes?.toLowerCase().includes(q);
          if (!matchesTitle && !matchesVendor && !matchesNotes) return false;
        }

        // Category filter
        if (
          selectedCategories.length > 0 &&
          !selectedCategories.includes(item.category)
        ) {
          return false;
        }

        // Billing cycle filter
        if (
          selectedBillingCycle !== 'all' &&
          item.billingCycle !== selectedBillingCycle
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'date') {
          diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        } else if (sortField === 'amount') {
          diff =
            normalizeToMonthly(a.amount, a.billingCycle) -
            normalizeToMonthly(b.amount, b.billingCycle);
        } else if (sortField === 'vendor') {
          diff = a.vendor.localeCompare(b.vendor);
        } else if (sortField === 'title') {
          diff = a.title.localeCompare(b.title);
        }
        return sortDir === 'asc' ? diff : -diff;
      });
  }, [expenses, searchQuery, selectedCategories, selectedBillingCycle, sortField, sortDir]);

  // Pagination
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="card space-y-4 p-5">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            placeholder="Search by vendor, title, or notes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="input pl-9 text-xs"
          />
        </div>

        {/* Billing cycle & quick actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Filter size={13} />
            <select
              value={selectedBillingCycle}
              onChange={(e) => {
                setSelectedBillingCycle(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="all">All Cycles</option>
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
              <option value="usage_based">Usage Based</option>
              <option value="one_time">One-Time</option>
              <option value="time_logged">Time Logged</option>
            </select>
          </div>

          <button
            onClick={() => setAddExpenseModalOpen(true)}
            className="btn-primary text-xs py-1.5 px-3"
          >
            <Plus size={14} /> Add Item
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <button
          onClick={() => setSelectedCategories([])}
          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
            selectedCategories.length === 0
              ? 'bg-zinc-700/80 text-zinc-100 border-zinc-600'
              : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
          }`}
        >
          All Categories ({expenses.length})
        </button>

        {ALL_CATEGORIES.map((cat) => {
          const isSelected = selectedCategories.includes(cat);
          const meta = CATEGORY_META[cat];
          const count = expenses.filter((e) => e.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                isSelected
                  ? 'border-violet-500/60 bg-violet-500/20 text-violet-200'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: meta?.color || '#a1a1aa' }}
              />
              {meta?.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Table Data Grid */}
      <div className="overflow-x-auto rounded-lg border border-zinc-800/80">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-900/90 border-b border-zinc-800 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3 w-8">
                <span className="sr-only">Essential</span>
              </th>
              <th
                onClick={() => handleSort('title')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-200"
              >
                <div className="flex items-center gap-1">
                  <span>Item & Notes</span>
                  {sortField === 'title' ? (
                    sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  ) : (
                    <ArrowUpDown size={12} className="opacity-40" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('vendor')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-200"
              >
                <div className="flex items-center gap-1">
                  <span>Vendor</span>
                  {sortField === 'vendor' ? (
                    sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  ) : (
                    <ArrowUpDown size={12} className="opacity-40" />
                  )}
                </div>
              </th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Billing Cycle</th>
              <th
                onClick={() => handleSort('amount')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-zinc-200"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Normalized /mo</span>
                  {sortField === 'amount' ? (
                    sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  ) : (
                    <ArrowUpDown size={12} className="opacity-40" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('date')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-zinc-200"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Date</span>
                  {sortField === 'date' ? (
                    sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  ) : (
                    <ArrowUpDown size={12} className="opacity-40" />
                  )}
                </div>
              </th>
              <th className="py-2.5 px-3 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 bg-[#121215]">
            {paginatedExpenses.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-zinc-500">
                  <p className="text-sm">No expenses found matching the current criteria.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategories([]);
                      setSelectedBillingCycle('all');
                    }}
                    className="mt-2 text-xs text-violet-400 hover:underline"
                  >
                    Clear all filters
                  </button>
                </td>
              </tr>
            ) : (
              paginatedExpenses.map((item) => {
                const monthly = normalizeToMonthly(item.amount, item.billingCycle);
                return (
                  <tr
                    key={item.id}
                    className="group hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* Star toggle essential */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() =>
                          updateExpense(item.id, { isEssential: !item.isEssential })
                        }
                        title={item.isEssential ? 'Essential expense' : 'Nice-to-have'}
                        className={`p-1 rounded transition-colors ${
                          item.isEssential
                            ? 'text-amber-400'
                            : 'text-zinc-600 hover:text-zinc-400'
                        }`}
                      >
                        <Star
                          size={13}
                          fill={item.isEssential ? 'currentColor' : 'none'}
                        />
                      </button>
                    </td>

                    {/* Title + notes */}
                    <td className="py-2.5 px-3 max-w-xs">
                      <div className="font-medium text-zinc-200 truncate flex items-center gap-1.5">
                        <span>{item.title}</span>
                        {item.isAiOptimized && (
                          <span
                            title="Optimized via AI FinOps recommendation"
                            className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-0.5 shrink-0"
                          >
                            <Sparkles size={9} /> Opt
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                          {item.notes}
                        </div>
                      )}
                      {item.usageMetric && (
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          Metric: {item.usageMetric}
                        </div>
                      )}
                    </td>

                    {/* Vendor */}
                    <td className="py-2.5 px-3 text-zinc-300 font-medium">
                      {item.vendor}
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-3">
                      <CategoryBadge category={item.category} size="sm" />
                    </td>

                    {/* Billing cycle */}
                    <td className="py-2.5 px-3 text-zinc-400 font-mono text-[11px]">
                      {billingCycleLabel(item.billingCycle)}
                    </td>

                    {/* Monthly normalized cost */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="num font-bold text-zinc-100">
                        {formatCurrency(monthly, currency)}
                      </div>
                      {item.billingCycle !== 'monthly' && (
                        <div className="num text-[10px] text-zinc-500 font-mono">
                          base: {formatCurrency(item.amount, currency)}
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-2.5 px-3 text-right text-zinc-400 font-mono text-[11px]">
                      {formatDate(item.date)}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditExpense(item)}
                          title="Edit expense"
                          className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60 rounded"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => duplicateExpense(item.id)}
                          title="Duplicate expense"
                          className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60 rounded"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={() => deleteExpense(item.id)}
                          title="Delete expense"
                          className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded"
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

      {/* Footer & Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
        <div>
          Showing {paginatedExpenses.length} of {filteredExpenses.length} entries
          {filteredExpenses.length !== expenses.length && ` (filtered from ${expenses.length} total)`}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-700 font-medium"
            >
              Prev
            </button>
            <span className="font-mono px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-700 font-medium"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseTable;
