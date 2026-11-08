import React, { useMemo } from 'react';
import {
  Wallet,
  Flame,
  Hourglass,
  Bug,
  Users,
  Sparkles,
} from 'lucide-react';
import {
  useActiveProject,
  useProjectExpenses,
  useProjectRevenues,
  useProjectAudit,
  useNetMonthlyBurn,
} from '../../store/useSpendStore';
import {
  formatCurrency,
  formatPercent,
  normalizeToMonthly,
  calcRunway,
  safeDiv,
  safeNum,
} from '../../utils/formatters';
import KpiCard from '../ui/KpiCard';

export const KpiRibbon: React.FC = () => {
  const activeProject = useActiveProject();
  const expenses = useProjectExpenses(activeProject?.id ?? '');
  const auditReport = useProjectAudit(activeProject?.id ?? '');

  const currency = activeProject?.currency ?? 'USD';
  const cashReserve = activeProject?.totalCashReserve ?? 0;
  const budgetCap = activeProject?.monthlyBudgetCap ?? 1000;
  const expectedUsers = activeProject?.expectedMonthlyUsers ?? 1;

  const {
    grossBurn,
    monthlyRevenue,
    netBurn,
    isDefaultAlive,
    runwayMonths,
    runwayDays,
  } = useNetMonthlyBurn(activeProject?.id);

  const metrics = useMemo(() => {
    // 1. Total spent to date (sum of raw expense amounts)
    const totalSpent = expenses.reduce((sum, e) => sum + safeNum(e.amount), 0);

    // 4. Hidden Debugging Tax
    const debugExpenses = expenses.filter((e) => e.category === 'debugging_tech_debt');
    const debugTotal = debugExpenses.reduce(
      (sum, e) => sum + normalizeToMonthly(e.amount, e.billingCycle),
      0
    );
    const debugTaxPercent = safeDiv(debugTotal * 100, grossBurn, 0);

    // 5. Unit Economics
    const costPerUser = safeDiv(grossBurn, Math.max(expectedUsers, 1), 0);
    const grossProfit = monthlyRevenue - grossBurn;
    const grossMarginPercent = safeDiv(grossProfit * 100, Math.max(monthlyRevenue, 1), 0);

    // 6. AI Optimization Potential
    const monthlySavings = auditReport
      ? auditReport.recommendations
          .filter((r) => !r.applied)
          .reduce((sum, r) => sum + r.monthlySavings, 0)
      : 0;
    const yearlySavings = monthlySavings * 12;

    return {
      totalSpent,
      debugTotal,
      debugTaxPercent,
      costPerUser,
      grossMarginPercent,
      monthlySavings,
      yearlySavings,
    };
  }, [expenses, grossBurn, monthlyRevenue, expectedUsers, auditReport]);

  // Determine runway urgency color
  const runwayColorType = isDefaultAlive
    ? 'emerald'
    : runwayMonths >= 12
    ? 'emerald'
    : runwayMonths >= 6
    ? 'amber'
    : 'rose';

  // Burn comparison with budget cap
  const burnRatio = safeDiv(netBurn * 100, budgetCap, 0);
  const burnColorType = isDefaultAlive
    ? 'emerald'
    : burnRatio <= 85
    ? 'emerald'
    : burnRatio <= 100
    ? 'amber'
    : 'rose';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
      {/* 1. Total Spent to Date */}
      <KpiCard
        title="Total Spent"
        value={formatCurrency(metrics.totalSpent, currency)}
        subvalue={`Lifetime ${expenses.length} ledger items`}
        icon={<Wallet size={16} />}
        color="default"
        tooltip="Cumulative total of all historical expenses and one-time setups recorded in this project."
      />

      {/* 2. Normalized Net Monthly Burn */}
      <KpiCard
        title={isDefaultAlive ? 'Net Cashflow' : 'Net Monthly Burn'}
        value={
          isDefaultAlive
            ? `+${formatCurrency(monthlyRevenue - grossBurn, currency)}/mo`
            : `${formatCurrency(netBurn, currency)}/mo`
        }
        subvalue={
          isDefaultAlive
            ? `Inflows: +${formatCurrency(monthlyRevenue, currency)}/mo`
            : `Gross: ${formatCurrency(grossBurn, currency)} | Inflows: +${formatCurrency(monthlyRevenue, currency)}`
        }
        icon={<Flame size={16} />}
        color={burnColorType}
        trend={{
          direction: isDefaultAlive ? 'up' : burnRatio > 100 ? 'down' : 'up',
          label: isDefaultAlive ? 'DEFAULT ALIVE' : burnRatio > 100 ? 'Over budget cap' : 'Within budget',
        }}
        tooltip="Net monthly cash burn = Total Monthly Expenses minus Recurring Monthly Revenue."
      />

      {/* 3. Runway Counter */}
      <KpiCard
        title="Runway Remaining"
        value={
          isDefaultAlive
            ? '∞ Infinite'
            : `${runwayMonths}m ${runwayDays}d`
        }
        subvalue={
          isDefaultAlive
            ? `Self-sustaining (${formatCurrency(cashReserve, currency)} in bank)`
            : `Cash reserve: ${formatCurrency(cashReserve, currency)}`
        }
        icon={<Hourglass size={16} />}
        color={runwayColorType}
        trend={{
          direction: isDefaultAlive || runwayMonths >= 12 ? 'up' : 'down',
          label: isDefaultAlive
            ? 'DEFAULT ALIVE (PROFITABLE)'
            : runwayMonths >= 12
            ? 'Healthy runway'
            : runwayMonths >= 6
            ? 'Warning zone'
            : 'Critical runway!',
        }}
        tooltip="Calculated by Cash Reserve / Net Monthly Burn. When recurring revenue exceeds burn, the project is Default Alive."
      />

      {/* 4. Hidden Debugging Tax */}
      <KpiCard
        title="Debugging Tax"
        value={formatCurrency(metrics.debugTotal, currency)}
        subvalue={`${formatPercent(metrics.debugTaxPercent)} of monthly burn`}
        icon={<Bug size={16} />}
        color={metrics.debugTaxPercent > 20 ? 'rose' : metrics.debugTaxPercent > 10 ? 'amber' : 'default'}
        trend={{
          direction: metrics.debugTaxPercent > 15 ? 'down' : 'neutral',
          label: `${(metrics.debugTotal / (activeProject?.hourlyDevRate || 60)).toFixed(1)} hrs dev time`,
        }}
        tooltip="True financial cost of developer time lost to debugging, outages, and tech-debt bug fixes based on your hourly rate."
      />

      {/* 5. Unit Economics */}
      <KpiCard
        title="Cost / Active User"
        value={formatCurrency(metrics.costPerUser, currency)}
        subvalue={`Gross Margin: ${formatPercent(metrics.grossMarginPercent)}`}
        icon={<Users size={16} />}
        color={metrics.grossMarginPercent >= 70 ? 'emerald' : metrics.grossMarginPercent >= 40 ? 'amber' : 'rose'}
        tooltip={`Monthly Burn / Expected Monthly Users (${expectedUsers.toLocaleString()}). Gross Margin = (Revenue - Burn) / Revenue.`}
      />

      {/* 6. AI Optimization Potential */}
      <KpiCard
        title="AI Savings Idled"
        value={`${formatCurrency(metrics.monthlySavings, currency)}/mo`}
        subvalue={`${formatCurrency(metrics.yearlySavings, currency)} / year savings`}
        icon={<Sparkles size={16} />}
        color={metrics.monthlySavings > 0 ? 'violet' : 'emerald'}
        trend={{
          direction: 'up',
          label: auditReport ? `${auditReport.recommendations.filter(r => !r.applied).length} swaps available` : 'Audit ready',
        }}
        tooltip="Immediate monthly and annual savings discovered by the AI FinOps Auditor across your infrastructure and SaaS stack."
      />
    </div>
  );
};

export default KpiRibbon;
