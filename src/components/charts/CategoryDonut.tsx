import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useActiveProject, useProjectExpenses } from '../../store/useSpendStore';
import {
  formatCurrency,
  normalizeToMonthly,
  safeDiv,
  CATEGORY_META,
  CATEGORY_COLORS,
  safeNum,
} from '../../utils/formatters';
import { ExpenseCategory } from '../../types';
import ProgressBar from '../ui/ProgressBar';

export const CategoryDonut: React.FC = () => {
  const activeProject = useActiveProject();
  const expenses = useProjectExpenses(activeProject?.id ?? '');
  const currency = activeProject?.currency ?? 'USD';

  const { data, totalMonthly } = useMemo(() => {
    const map: Record<string, number> = {
      apis_llms: 0,
      cloud_infra: 0,
      debugging_tech_debt: 0,
      salaries_contractors: 0,
      devtools_saas: 0,
      domains_legal_misc: 0,
    };

    let total = 0;
    expenses.forEach((e) => {
      const monthly = normalizeToMonthly(e.amount, e.billingCycle);
      map[e.category] = (map[e.category] || 0) + monthly;
      total += monthly;
    });

    const chartItems = Object.entries(map)
      .filter(([_, amount]) => amount > 0)
      .map(([cat, amount]) => {
        const category = cat as ExpenseCategory;
        const meta = CATEGORY_META[category];
        return {
          name: meta?.label || cat,
          category,
          amount,
          percent: safeDiv(amount * 100, total, 0),
          color: CATEGORY_COLORS[category] || '#71717a',
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return { data: chartItems, totalMonthly: total };
  }, [expenses]);

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div>
          <h3 className="text-base font-semibold text-zinc-100">Category Allocation</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Distribution of effective monthly burn</p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Monthly Net</span>
          <span className="num font-bold text-sm text-zinc-100">
            {formatCurrency(totalMonthly, currency)}
          </span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-zinc-500">
          No expenses logged yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Donut Chart */}
          <div className="h-44 md:col-span-5 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="amount"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#121215" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as { name: string; amount: number; percent: number; color: string };
                    return (
                      <div className="bg-[#18181C] border border-zinc-700 px-3 py-2 rounded-lg shadow-xl text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="font-semibold text-zinc-200">{item.name}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-zinc-400">
                          <span className="num font-mono text-zinc-100">{formatCurrency(item.amount, currency)}/mo</span>
                          <span className="num text-zinc-300 font-bold">{item.percent.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Top Slice</span>
              <span className="num text-sm font-bold text-zinc-200">
                {data[0]?.percent.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Progress bars list */}
          <div className="space-y-3 md:col-span-7">
            {data.map((item) => (
              <div key={item.category} className="space-y-1">
                <ProgressBar
                  value={item.percent}
                  color={item.color}
                  label={item.name}
                  sublabel={`${formatCurrency(item.amount, currency)}/mo`}
                  showPercent={true}
                  height="sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryDonut;
