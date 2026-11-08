// ============================================================
// DevSpend — Unified Cashflow Table (Overall Statement)
// Merged Chronological Inflow & Outflow Accounting Grid
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Sparkles,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import {
  useActiveProject,
  useProjectExpenses,
  useProjectRevenues,
  useSpendStore,
} from '../../store/useSpendStore';
import {
  formatCurrency,
  formatDate,
  normalizeToMonthly,
  billingCycleLabel,
  CATEGORY_META,
  REVENUE_CATEGORY_META,
} from '../../utils/formatters';
import { ExpenseItem, RevenueItem } from '../../types';

interface CashflowRow {
  id: string;
  type: 'revenue' | 'expense';
  date: string;
  title: string;
  entity: string; // source (revenue) or vendor (expense)
  category: string;
  categoryLabel: string;
  categoryColor: string;
  billingCycle: string;
  rawAmount: number;
  netAmount: number; // For revenue: amount - fee; For expense: amount
  normalizedMonthly: number;
  isRecurring: boolean;
  notes?: string;
  originalRevenue?: RevenueItem;
  originalExpense?: ExpenseItem;
}

interface CashflowTableProps {
  onEditExpense: (expense: ExpenseItem) => void;
  onEditRevenue: (revenue: RevenueItem) => void;
}

type TypeFilter = 'all' | 'inflow' | 'outflow';
type SortField = 'date' | 'amount' | 'entity' | 'title';
type SortDirection = 'asc' | 'desc';

export const CashflowTable: React.FC<CashflowTableProps> = ({
  onEditExpense,
  onEditRevenue,
}) => {
  const activeProject = useActiveProject();
  const expenses = useProjectExpenses(activeProject?.id ?? '');
  const revenues = useProjectRevenues(activeProject?.id ?? '');
  const {
    deleteExpense,
    deleteRevenue,
    deleteExpenses,
    deleteRevenues,
    setAddExpenseModalOpen,
    setAddRevenueModalOpen,
  } = useSpendStore();

  const currency = activeProject?.currency ?? 'USD';

  // Filters & Search
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [itemToDelete, setItemToDelete] = useState<CashflowRow | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Merge into unified cashflow rows
  const rows: CashflowRow[] = useMemo(() => {
    const revenueRows: CashflowRow[] = revenues.map((r) => {
      const net = r.netAmount ?? (r.amount - (r.processingFee || 0));
      const monthly = normalizeToMonthly(net, r.billingCycle);
      const meta = REVENUE_CATEGORY_META[r.category] || {
        label: r.category,
        color: 'emerald',
      };
      return {
        id: `rev-${r.id}`,
        type: 'revenue',
        date: r.date,
        title: r.title,
        entity: r.source,
        category: r.category,
        categoryLabel: meta.label,
        categoryColor: meta.color,
        billingCycle: r.billingCycle,
        rawAmount: r.amount,
        netAmount: net,
        normalizedMonthly: monthly,
        isRecurring: r.isRecurring,
        notes: r.notes,
        originalRevenue: r,
      };
    });

    const expenseRows: CashflowRow[] = expenses.map((e) => {
      const monthly = normalizeToMonthly(e.amount, e.billingCycle);
      const meta = CATEGORY_META[e.category] || {
        label: e.category,
        color: 'zinc',
      };
      return {
        id: `exp-${e.id}`,
        type: 'expense',
        date: e.date,
        title: e.title,
        entity: e.vendor,
        category: e.category,
        categoryLabel: meta.label,
        categoryColor: meta.color,
        billingCycle: e.billingCycle,
        rawAmount: e.amount,
        netAmount: e.amount,
        normalizedMonthly: monthly,
        isRecurring: e.billingCycle !== 'one_time',
        notes: e.notes,
        originalExpense: e,
      };
    });

    return [...revenueRows, ...expenseRows];
  }, [revenues, expenses]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      // Type filter
      if (typeFilter === 'inflow' && item.type !== 'revenue') return false;
      if (typeFilter === 'outflow' && item.type !== 'expense') return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesEntity = item.entity.toLowerCase().includes(q);
        const matchesCat = item.categoryLabel.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q) ?? false;
        if (!matchesTitle && !matchesEntity && !matchesCat && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [rows, typeFilter, search]);

  // Sorted rows
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') {
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        cmp = a.netAmount - b.netAmount;
      } else if (sortField === 'entity') {
        cmp = a.entity.localeCompare(b.entity);
      } else if (sortField === 'title') {
        cmp = a.title.localeCompare(b.title);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredRows, sortField, sortDir]);

  // Paginated
  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedRows.map((r) => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const executeDeleteOne = (item: CashflowRow) => {
    if (item.type === 'revenue' && item.originalRevenue) {
      deleteRevenue(item.originalRevenue.id);
    } else if (item.type === 'expense' && item.originalExpense) {
      deleteExpense(item.originalExpense.id);
    }
    setItemToDelete(null);
  };

  const executeBulkDelete = () => {
    const expenseIds: string[] = [];
    const revenueIds: string[] = [];

    rows.forEach((r) => {
      if (selectedIds.has(r.id)) {
        if (r.type === 'expense' && r.originalExpense) {
          expenseIds.push(r.originalExpense.id);
        } else if (r.type === 'revenue' && r.originalRevenue) {
          revenueIds.push(r.originalRevenue.id);
        }
      }
    });

    if (expenseIds.length > 0) deleteExpenses(expenseIds);
    if (revenueIds.length > 0) deleteRevenues(revenueIds);

    setSelectedIds(new Set());
    setBulkDeleteConfirm(false);
  };

  const allSelectedOnPage =
    paginatedRows.length > 0 &&
    paginatedRows.every((r) => selectedIds.has(r.id));

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Search title, vendor, customer, notes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-lg pl-9 pr-3 py-2 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs">
            <button
              onClick={() => {
                setTypeFilter('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                typeFilter === 'all'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Cashflow ({rows.length})
            </button>
            <button
              onClick={() => {
                setTypeFilter('inflow');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                typeFilter === 'inflow'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-emerald-300'
              }`}
            >
              <ArrowDownRight size={13} className="text-emerald-400" />
              Inflows ({revenues.length})
            </button>
            <button
              onClick={() => {
                setTypeFilter('outflow');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                typeFilter === 'outflow'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  : 'text-zinc-400 hover:text-rose-300'
              }`}
            >
              <ArrowUpRight size={13} className="text-rose-400" />
              Outflows ({expenses.length})
            </button>
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 bg-rose-950/30 border border-rose-800/50 px-3 py-1.5 rounded-lg text-xs text-rose-300">
            <span>{selectedIds.size} selected</span>
            <button
              onClick={() => setBulkDeleteConfirm(true)}
              className="ml-2 px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium transition-colors flex items-center gap-1"
            >
              <Trash2 size={12} /> Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Desktop Table (>= 768px) */}
      <div className="hidden md:block rounded-xl border border-zinc-800/80 bg-zinc-950/70 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/40 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={allSelectedOnPage}
                    onChange={handleSelectAll}
                    className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th
                  onClick={() => toggleSort('date')}
                  className="py-3 px-3 cursor-pointer hover:text-zinc-200 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span>Date</span>
                    {sortField === 'date' &&
                      (sortDir === 'asc' ? (
                        <ArrowUp size={12} />
                      ) : (
                        <ArrowDown size={12} />
                      ))}
                  </div>
                </th>
                <th className="py-3 px-3">Type</th>
                <th
                  onClick={() => toggleSort('title')}
                  className="py-3 px-3 cursor-pointer hover:text-zinc-200 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Title & Details</span>
                    {sortField === 'title' &&
                      (sortDir === 'asc' ? (
                        <ArrowUp size={12} />
                      ) : (
                        <ArrowDown size={12} />
                      ))}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('entity')}
                  className="py-3 px-3 cursor-pointer hover:text-zinc-200 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Customer / Vendor</span>
                    {sortField === 'entity' &&
                      (sortDir === 'asc' ? (
                        <ArrowUp size={12} />
                      ) : (
                        <ArrowDown size={12} />
                      ))}
                  </div>
                </th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Cadence / Monthly</th>
                <th
                  onClick={() => toggleSort('amount')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-zinc-200 select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Net Amount</span>
                    {sortField === 'amount' &&
                      (sortDir === 'asc' ? (
                        <ArrowUp size={12} />
                      ) : (
                        <ArrowDown size={12} />
                      ))}
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Layers size={28} className="text-zinc-700" />
                      <p className="text-zinc-400 font-medium text-sm">
                        No cashflow records found
                      </p>
                      <p className="text-xs text-zinc-600 max-w-sm">
                        {search || typeFilter !== 'all'
                          ? 'Try clearing your search query or type filter.'
                          : 'Get started by recording your first revenue inflow or expense outflow.'}
                      </p>
                      {!search && typeFilter === 'all' && (
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() => setAddRevenueModalOpen(true)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Plus size={13} /> Add Revenue / Funds
                          </button>
                          <button
                            onClick={() => setAddExpenseModalOpen(true)}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-zinc-700"
                          >
                            <Plus size={13} /> Add Expense
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const isSelected = selectedIds.has(row.id);
                  const isRev = row.type === 'revenue';

                  return (
                    <tr
                      key={row.id}
                      className={`group transition-colors ${
                        isSelected
                          ? 'bg-zinc-800/40'
                          : 'hover:bg-zinc-900/50'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(row.id)}
                          className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-zinc-400">
                        {formatDate(row.date)}
                      </td>

                      {/* Type Badge */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isRev ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            INFLOW
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            OUTFLOW
                          </span>
                        )}
                      </td>

                      {/* Title & Details */}
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-zinc-200 group-hover:text-white transition-colors">
                          {row.title}
                        </div>
                        {row.notes && (
                          <div className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                            {row.notes}
                          </div>
                        )}
                      </td>

                      {/* Customer / Vendor */}
                      <td className="py-2.5 px-3 text-zinc-300 font-mono text-xs">
                        {row.entity}
                      </td>

                      {/* Category Badge */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {row.categoryLabel}
                        </span>
                      </td>

                      {/* Cadence / Normalized Monthly */}
                      <td className="py-2.5 px-3 text-right font-mono text-[11px] whitespace-nowrap">
                        <div className="text-zinc-400">
                          {billingCycleLabel(row.billingCycle as any)}
                        </div>
                        <div
                          className={`font-semibold ${
                            isRev ? 'text-emerald-400/90' : 'text-zinc-400'
                          }`}
                        >
                          {isRev ? '+' : '-'}
                          {formatCurrency(row.normalizedMonthly, currency)}/mo
                        </div>
                      </td>

                      {/* Net Amount */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono text-xs">
                        <span
                          className={`font-bold ${
                            isRev ? 'text-emerald-400' : 'text-zinc-100'
                          }`}
                        >
                          {isRev ? '+' : '-'}
                          {formatCurrency(row.netAmount, currency)}
                        </span>
                        {isRev && row.rawAmount !== row.netAmount && (
                          <div className="text-[10px] text-zinc-500">
                            gross {formatCurrency(row.rawAmount, currency)}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() => {
                              if (isRev && row.originalRevenue) {
                                onEditRevenue(row.originalRevenue);
                              } else if (!isRev && row.originalExpense) {
                                onEditExpense(row.originalExpense);
                              }
                            }}
                            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => setItemToDelete(row)}
                            className="p-1 hover:bg-rose-950/40 rounded text-zinc-500 hover:text-rose-400 transition-colors"
                            title="Delete"
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

        {/* Pagination & Footer */}
        {sortedRows.length > 0 && (
          <div className="p-3 border-t border-zinc-800/70 bg-zinc-900/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400">
            <div>
              Showing{' '}
              <span className="font-mono text-zinc-200 font-semibold">
                {Math.min(
                  (page - 1) * pageSize + 1,
                  sortedRows.length
                )}
              </span>{' '}
              to{' '}
              <span className="font-mono text-zinc-200 font-semibold">
                {Math.min(page * pageSize, sortedRows.length)}
              </span>{' '}
              of{' '}
              <span className="font-mono text-zinc-200 font-semibold">
                {sortedRows.length}
              </span>{' '}
              entries
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:hover:bg-zinc-800 text-zinc-300 rounded font-medium border border-zinc-700 transition-colors"
              >
                Prev
              </button>
              <span className="font-mono text-zinc-400">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:hover:bg-zinc-800 text-zinc-300 rounded font-medium border border-zinc-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Single Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-9 h-9 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <AlertTriangle size={18} />
              </div>
              <h3 className="font-semibold text-zinc-100">
                Delete {itemToDelete.type === 'revenue' ? 'Revenue' : 'Expense'}?
              </h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Are you sure you want to delete{' '}
              <span className="text-zinc-200 font-semibold">
                &ldquo;{itemToDelete.title}&rdquo;
              </span>{' '}
              ({formatCurrency(itemToDelete.netAmount, currency)})? This action
              cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => executeDeleteOne(itemToDelete)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-lg font-medium transition-colors"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-9 h-9 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <AlertTriangle size={18} />
              </div>
              <h3 className="font-semibold text-zinc-100">Bulk Deletion</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Are you sure you want to delete{' '}
              <span className="text-rose-400 font-semibold font-mono">
                {selectedIds.size}
              </span>{' '}
              selected cashflow records across revenues and expenses? This will
              permanently adjust your ledger.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setBulkDeleteConfirm(false)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeBulkDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-lg font-medium transition-colors"
              >
                Delete All {selectedIds.size} Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashflowTable;
