// ============================================================
// DevSpend — Revenue & Earnings Table Component
// Granular Inflow Ledger with Net Calculation & Category Badges
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
  TrendingUp,
  Tag,
  DollarSign,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  useActiveProject,
  useProjectRevenues,
  useSpendStore,
} from '../../store/useSpendStore';
import {
  formatCurrency,
  formatDate,
  normalizeToMonthly,
  billingCycleLabel,
  REVENUE_CATEGORY_META,
} from '../../utils/formatters';
import { RevenueCategory, RevenueItem } from '../../types';

interface RevenueTableProps {
  onEditRevenue: (revenue: RevenueItem) => void;
}

type SortField = 'date' | 'amount' | 'source' | 'title';
type SortDirection = 'asc' | 'desc';

const ALL_REVENUE_CATEGORIES: RevenueCategory[] = [
  'mrr_subscriptions',
  'one_time_sales',
  'client_services',
  'grants_credits',
  'capital_addition',
  'other_income',
];

export const RevenueTable: React.FC<RevenueTableProps> = ({ onEditRevenue }) => {
  const activeProject = useActiveProject();
  const revenues = useProjectRevenues(activeProject?.id ?? '');
  const {
    deleteRevenue,
    deleteRevenues,
    clearProjectRevenues,
    setAddRevenueModalOpen,
  } = useSpendStore();

  const currency = activeProject?.currency ?? 'USD';

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<RevenueCategory[]>([]);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Multi-row selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const toggleCategory = (cat: RevenueCategory) => {
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

  const filteredRevenues = useMemo(() => {
    return revenues
      .filter((item) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = item.title.toLowerCase().includes(q);
          const matchesSource = item.source.toLowerCase().includes(q);
          const matchesNotes = item.notes?.toLowerCase().includes(q);
          if (!matchesTitle && !matchesSource && !matchesNotes) return false;
        }

        if (
          selectedCategories.length > 0 &&
          !selectedCategories.includes(item.category)
        ) {
          return false;
        }

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
          diff = a.netAmount - b.netAmount;
        } else if (sortField === 'source') {
          diff = a.source.localeCompare(b.source);
        } else if (sortField === 'title') {
          diff = a.title.localeCompare(b.title);
        }
        return sortDir === 'asc' ? diff : -diff;
      });
  }, [revenues, searchQuery, selectedCategories, selectedBillingCycle, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredRevenues.length / itemsPerPage));
  const paginatedRevenues = filteredRevenues.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleToggleSelectAll = () => {
    if (selectedIds.size === paginatedRevenues.length && paginatedRevenues.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedRevenues.map((r) => r.id)));
    }
  };

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    deleteRevenues(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleClearAll = () => {
    if (!activeProject) return;
    clearProjectRevenues(activeProject.id);
    setSelectedIds(new Set());
    setConfirmClearAll(false);
  };

  return (
    <div className="card space-y-4 p-5 font-sans">
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
            placeholder="Search inflows by source, title, or notes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="input pl-9 text-xs font-mono"
          />
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Filter size={13} />
            <select
              value={selectedBillingCycle}
              onChange={(e) => {
                setSelectedBillingCycle(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none font-mono"
            >
              <option value="all">All Cycles</option>
              <option value="monthly">Monthly (MRR)</option>
              <option value="annual">Annual (ARR)</option>
              <option value="one_time">One-Time / Invoiced</option>
            </select>
          </div>

          <button
            onClick={() => setAddRevenueModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-md shadow-emerald-950/40"
          >
            <Plus size={14} /> Add Revenue
          </button>
        </div>
      </div>

      {/* Category Pills & Bulk Action */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCategories([])}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              selectedCategories.length === 0
                ? 'bg-zinc-700/80 text-zinc-100 border-zinc-600'
                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            All Inflows ({revenues.length})
          </button>

          {ALL_REVENUE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategories.includes(cat);
            const count = revenues.filter((r) => r.category === cat).length;
            if (count === 0 && !isSelected) return null;

            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-zinc-800 text-zinc-100 border-zinc-600 shadow-sm'
                    : 'bg-zinc-900/40 text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
                }`}
              >
                <span>{REVENUE_CATEGORY_META[cat].label}</span>
                <span className="text-[10px] font-mono opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Bulk Action Controls */}
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-2.5 py-1 rounded-md bg-rose-600/20 border border-rose-500/40 hover:bg-rose-600/30 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors animate-in fade-in cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
          )}

          {revenues.length > 0 && (
            <div>
              {confirmClearAll ? (
                <div className="flex items-center gap-1.5 animate-in fade-in">
                  <span className="text-[11px] text-rose-300 font-mono">Confirm purge all?</span>
                  <button
                    onClick={handleClearAll}
                    className="px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-500 transition-colors cursor-pointer"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmClearAll(false)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px] hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClearAll(true)}
                  className="px-2.5 py-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 text-xs transition-colors cursor-pointer font-mono"
                  title="Purge all revenues for this project"
                >
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-zinc-800/80">
        <table className="w-full text-left text-xs border-collapse font-sans">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3 w-8 text-center">
                <input
                  type="checkbox"
                  checked={
                    paginatedRevenues.length > 0 &&
                    selectedIds.size === paginatedRevenues.length
                  }
                  onChange={handleToggleSelectAll}
                  className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0 cursor-pointer"
                />
              </th>
              <th
                onClick={() => handleSort('title')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-200"
              >
                <div className="flex items-center gap-1">
                  <span>Inflow & Source</span>
                  {sortField === 'title' ? (
                    sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  ) : (
                    <ArrowUpDown size={12} className="opacity-40" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('source')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-200"
              >
                <div className="flex items-center gap-1">
                  <span>Channel</span>
                  {sortField === 'source' ? (
                    sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  ) : (
                    <ArrowUpDown size={12} className="opacity-40" />
                  )}
                </div>
              </th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Frequency</th>
              <th
                onClick={() => handleSort('amount')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-zinc-200"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Net Inflow</span>
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
              <th className="py-2.5 px-3 text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 bg-[#121215]">
            {paginatedRevenues.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-zinc-500 font-mono">
                  <p className="text-sm">No revenue entries found matching current criteria.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategories([]);
                      setSelectedBillingCycle('all');
                    }}
                    className="mt-2 text-xs text-emerald-400 hover:underline cursor-pointer"
                  >
                    Clear all filters
                  </button>
                </td>
              </tr>
            ) : (
              paginatedRevenues.map((item) => {
                const isSelected = selectedIds.has(item.id);
                const meta = REVENUE_CATEGORY_META[item.category];

                return (
                  <tr
                    key={item.id}
                    className={`group transition-colors ${
                      isSelected ? 'bg-zinc-800/60' : 'hover:bg-zinc-800/40'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(item.id)}
                        className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Title */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                        <span>{item.title}</span>
                        {item.isRecurring && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            MRR
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <div className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5 font-mono">
                          {item.notes}
                        </div>
                      )}
                    </td>

                    {/* Channel */}
                    <td className="py-2.5 px-3 text-zinc-300 font-mono text-xs">
                      {item.source}
                    </td>

                    {/* Category Badge */}
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border ${meta.bgColor} ${meta.textColor} ${meta.borderColor}`}
                      >
                        {meta.label}
                      </span>
                    </td>

                    {/* Frequency */}
                    <td className="py-2.5 px-3 text-zinc-400 font-mono text-[11px]">
                      {billingCycleLabel(item.billingCycle)}
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="num font-bold text-emerald-400 font-mono tabular-nums">
                        +{formatCurrency(item.netAmount, currency)}
                      </div>
                      {item.feeDeducted ? (
                        <div className="num text-[10px] text-zinc-500 font-mono tabular-nums">
                          gross: {formatCurrency(item.amount, currency)} (-{formatCurrency(item.feeDeducted, currency)})
                        </div>
                      ) : null}
                    </td>

                    {/* Date */}
                    <td className="py-2.5 px-3 text-right text-zinc-400 font-mono text-[11px]">
                      {formatDate(item.date)}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditRevenue(item)}
                          title="Edit inflow"
                          className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60 rounded cursor-pointer"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => deleteRevenue(item.id)}
                          title="Delete inflow"
                          className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer"
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400 pt-2 border-t border-zinc-800/80 font-mono">
        <div>
          Showing {paginatedRevenues.length} of {filteredRevenues.length} entries
          {filteredRevenues.length !== revenues.length && ` (filtered from ${revenues.length} total)`}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-700 font-medium cursor-pointer"
            >
              Prev
            </button>
            <span className="font-mono px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-700 font-medium cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueTable;
