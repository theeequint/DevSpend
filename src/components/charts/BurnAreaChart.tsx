import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useActiveProject, useProjectExpenses } from '../../store/useSpendStore';
import {
  formatCurrency,
  normalizeToMonthly,
  CATEGORY_COLORS,
  monthLabel,
  safeNum,
} from '../../utils/formatters';
import { BurnChartPoint } from '../../types';
import { useActiveTheme } from '../../hooks/useActiveTheme';

export const BurnAreaChart: React.FC = () => {
  const activeProject = useActiveProject();
  const expenses = useProjectExpenses(activeProject?.id ?? '');
  const currency = activeProject?.currency ?? 'USD';
  const budgetCap = activeProject?.monthlyBudgetCap ?? 1000;
  const { chartColors, activeTheme } = useActiveTheme();

  // Calculate current baseline monthly burn by category
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {
      cloud_infra: 0,
      apis_llms: 0,
      salaries_contractors: 0,
      debugging_tech_debt: 0,
      devtools_saas: 0,
      domains_legal_misc: 0,
    };

    expenses.forEach((e) => {
      const monthly = normalizeToMonthly(e.amount, e.billingCycle);
      if (totals[e.category] !== undefined) {
        totals[e.category] += monthly;
      }
    });

    return totals;
  }, [expenses]);

  // Generate 6 historical months + current + 2 projected months
  const chartData: BurnChartPoint[] = useMemo(() => {
    const points: BurnChartPoint[] = [];

    // Historical variations multipliers
    const multipliers = [
      { offset: -5, infra: 0.55, apis: 0.35, salaries: 0.8, debug: 0.3, saas: 0.7, misc: 0.5 },
      { offset: -4, infra: 0.65, apis: 0.45, salaries: 0.8, debug: 0.4, saas: 0.8, misc: 0.6 },
      { offset: -3, infra: 0.75, apis: 0.60, salaries: 0.9, debug: 0.6, saas: 0.9, misc: 0.8 },
      { offset: -2, infra: 0.85, apis: 0.75, salaries: 0.9, debug: 1.4, saas: 1.0, misc: 1.0 }, // debug spike
      { offset: -1, infra: 0.95, apis: 0.90, salaries: 1.0, debug: 1.1, saas: 1.0, misc: 1.0 },
      { offset: 0,  infra: 1.00, apis: 1.00, salaries: 1.0, debug: 1.0, saas: 1.0, misc: 1.0 }, // current
      { offset: 1,  infra: 1.12, apis: 1.18, salaries: 1.0, debug: 0.8, saas: 1.0, misc: 1.0 }, // proj +1
      { offset: 2,  infra: 1.25, apis: 1.35, salaries: 1.0, debug: 0.7, saas: 1.0, misc: 1.0 }, // proj +2
    ];

    multipliers.forEach((m) => {
      const infra = Math.round(categoryTotals.cloud_infra * m.infra);
      const apis = Math.round(categoryTotals.apis_llms * m.apis);
      const salaries = Math.round(categoryTotals.salaries_contractors * m.salaries);
      const debugging = Math.round(categoryTotals.debugging_tech_debt * m.debug);
      const saas = Math.round(categoryTotals.devtools_saas * m.saas);
      const misc = Math.round(categoryTotals.domains_legal_misc * m.misc);
      const total = infra + apis + salaries + debugging + saas + misc;

      points.push({
        month: monthLabel(m.offset) + (m.offset > 0 ? ' (Proj)' : ''),
        infra,
        apis,
        salaries,
        debugging,
        saas,
        misc,
        total,
        budget: budgetCap,
      });
    });

    return points;
  }, [categoryTotals, budgetCap]);

  return (
    <div className="card p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-zinc-100">Historical & Projected Burn</h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60">
              6M History + 2M Proj
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Stack breakdown against monthly budget ceiling ({formatCurrency(budgetCap, currency)})
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS.cloud_infra }} />
            <span className="text-zinc-400">Infra</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS.apis_llms }} />
            <span className="text-zinc-400">APIs/LLMs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS.debugging_tech_debt }} />
            <span className="text-zinc-400">Debugging</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS.salaries_contractors }} />
            <span className="text-zinc-400">Salaries</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS.devtools_saas }} />
            <span className="text-zinc-400">DevTools</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-rose-500" />
            <span className="text-rose-400">Budget Cap</span>
          </div>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="infraGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors[0] || CATEGORY_COLORS.cloud_infra} stopOpacity={0.7} />
                <stop offset="95%" stopColor={chartColors[0] || CATEGORY_COLORS.cloud_infra} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="apisGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors[1] || CATEGORY_COLORS.apis_llms} stopOpacity={0.7} />
                <stop offset="95%" stopColor={chartColors[1] || CATEGORY_COLORS.apis_llms} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="debugGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors[3] || CATEGORY_COLORS.debugging_tech_debt} stopOpacity={0.7} />
                <stop offset="95%" stopColor={chartColors[3] || CATEGORY_COLORS.debugging_tech_debt} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="salariesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors[4] || CATEGORY_COLORS.salaries_contractors} stopOpacity={0.7} />
                <stop offset="95%" stopColor={chartColors[4] || CATEGORY_COLORS.salaries_contractors} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="saasGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors[2] || CATEGORY_COLORS.devtools_saas} stopOpacity={0.7} />
                <stop offset="95%" stopColor={chartColors[2] || CATEGORY_COLORS.devtools_saas} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(63, 63, 70, 0.25)" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={{ stroke: 'rgba(63, 63, 70, 0.4)' }}
              tick={{ fill: '#71717a', fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: 'rgba(63, 63, 70, 0.4)' }}
              tick={{ fill: '#71717a', fontSize: 11 }}
              tickFormatter={(v: number) => `$${v}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const total = payload.reduce((acc, p) => acc + safeNum(p.value as number), 0);
                return (
                  <div className="bg-[#18181C] border border-zinc-700 p-3 rounded-lg shadow-xl text-xs space-y-1.5 min-w-[170px]">
                    <div className="font-semibold text-zinc-200 border-b border-zinc-800 pb-1 flex justify-between">
                      <span>{label}</span>
                      <span className="num font-bold text-zinc-100">{formatCurrency(total, currency)}</span>
                    </div>
                    {payload.map((entry, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 text-zinc-300">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="capitalize">{entry.name}</span>
                        </span>
                        <span className="num font-mono text-zinc-100">
                          {formatCurrency(safeNum(entry.value as number), currency)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-zinc-800 pt-1 mt-1 flex justify-between text-zinc-400">
                      <span>Budget Limit</span>
                      <span className="num text-rose-400 font-medium">
                        {formatCurrency(budgetCap, currency)}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <ReferenceLine
              y={budgetCap}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="infra"
              name="Infra"
              stackId="1"
              stroke={chartColors[0] || CATEGORY_COLORS.cloud_infra}
              fill="url(#infraGrad)"
            />
            <Area
              type="monotone"
              dataKey="apis"
              name="APIs"
              stackId="1"
              stroke={chartColors[1] || CATEGORY_COLORS.apis_llms}
              fill="url(#apisGrad)"
            />
            <Area
              type="monotone"
              dataKey="saas"
              name="DevTools"
              stackId="1"
              stroke={chartColors[2] || CATEGORY_COLORS.devtools_saas}
              fill="url(#saasGrad)"
            />
            <Area
              type="monotone"
              dataKey="debugging"
              name="Debugging"
              stackId="1"
              stroke={chartColors[3] || CATEGORY_COLORS.debugging_tech_debt}
              fill="url(#debugGrad)"
            />
            <Area
              type="monotone"
              dataKey="salaries"
              name="Salaries"
              stackId="1"
              stroke={chartColors[4] || CATEGORY_COLORS.salaries_contractors}
              fill="url(#salariesGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BurnAreaChart;
