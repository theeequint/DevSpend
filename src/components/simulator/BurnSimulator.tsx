import React, { useState, useMemo } from 'react';
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
import {
  Users,
  Cpu,
  UserCheck,
  Bug,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useActiveProject, useProjectExpenses } from '../../store/useSpendStore';
import {
  formatCurrency,
  formatPercent,
  normalizeToMonthly,
  safeDiv,
  monthLabel,
  safeNum,
} from '../../utils/formatters';
import { FreeTierWarning, SimulatorProjection } from '../../types';
import { useActiveTheme } from '../../hooks/useActiveTheme';

export const BurnSimulator: React.FC = () => {
  const activeProject = useActiveProject();
  const expenses = useProjectExpenses(activeProject?.id ?? '');

  const currency = activeProject?.currency ?? 'USD';
  const hourlyRate = activeProject?.hourlyDevRate ?? 60;
  const currentBudget = activeProject?.monthlyBudgetCap ?? 1000;
  const { chartColors, activeTheme } = useActiveTheme();

  // Simulator Sliders State
  const [mau, setMau] = useState<number>(5000);
  const [tokensPerUser, setTokensPerUser] = useState<number>(10000); // 10k tokens/mo
  const [headcount, setHeadcount] = useState<number>(1);
  const [debugPercent, setDebugPercent] = useState<number>(15); // 15% time bugfixing
  const [customerPrice, setCustomerPrice] = useState<number>(29); // $29/mo SaaS pricing

  // Baseline fixed monthly burn from active project
  const baselineFixedSpend = useMemo(() => {
    return expenses.reduce((sum, e) => {
      // exclude usage based, we will simulate it
      if (e.billingCycle === 'usage_based') return sum;
      return sum + normalizeToMonthly(e.amount, e.billingCycle);
    }, 0);
  }, [expenses]);

  // Dynamic monthly burn calculations based on sliders
  const simulationMetrics = useMemo(() => {
    // 1. LLM API cost: total tokens = mau * tokensPerUser
    // Assuming blended rate of $0.15 per million tokens (Gemini Flash / Claude Haiku / GPT-4o-mini tier)
    const totalMonthlyTokens = mau * tokensPerUser;
    const llmSpend = (totalMonthlyTokens / 1_000_000) * 0.15;

    // 2. Infra scaling & Free Tier Cliff step-ups
    let infraAddon = 0;
    const warnings: FreeTierWarning[] = [];

    // Vercel tier cliff
    if (mau > 2000) {
      infraAddon += 20; // Vercel Pro jump
      warnings.push({
        vendor: 'Vercel',
        threshold: 2000,
        currentValue: mau,
        additionalCostPerMonth: 20,
        description:
          'At 2,000+ MAU, edge function invocations and egress exceed Hobby tier limits. Automatic +$20/mo Vercel Pro required.',
      });
    }
    if (mau > 40000) {
      infraAddon += 80; // Additional bandwidth overage
      warnings.push({
        vendor: 'Vercel Bandwidth',
        threshold: 40000,
        currentValue: mau,
        additionalCostPerMonth: 80,
        description: 'Heavy bandwidth egress beyond 1TB Pro allowance requires additional data packs.',
      });
    }

    // Database tier cliff (Supabase / Postgres)
    if (mau > 5000) {
      infraAddon += 25; // Supabase Pro
      warnings.push({
        vendor: 'Supabase / Postgres',
        threshold: 5000,
        currentValue: mau,
        additionalCostPerMonth: 25,
        description:
          'Free 500MB DB & 200 concurrent connections maxed out. Requires Supabase Pro ($25/mo) to prevent downtime.',
      });
    }
    if (mau > 25000) {
      infraAddon += 50; // Compute add-on
      warnings.push({
        vendor: 'Database Compute',
        threshold: 25000,
        currentValue: mau,
        additionalCostPerMonth: 50,
        description: 'Connection pooling (PgBouncer) & 4GB RAM compute add-on needed for high concurrency.',
      });
    }

    // 3. Headcount cost (each developer working 160 hrs/mo at hourlyDevRate)
    // For solo devs or contractors
    const devCost = headcount > 1 ? (headcount - 1) * (hourlyRate * 80) : 0; // part-time/contractor additions

    // 4. Debugging tax
    // Assuming a 160 hr work month, X% spent on debugging multiplied by hourlyDevRate
    const monthlyDebugHours = 160 * (debugPercent / 100);
    const debugCost = monthlyDebugHours * hourlyRate;

    // Total monthly simulated burn
    const totalSimulatedBurn =
      baselineFixedSpend + llmSpend + infraAddon + devCost + debugCost;

    // Break-even calculation
    const customersNeeded = Math.ceil(
      safeDiv(totalSimulatedBurn, Math.max(customerPrice, 1), 0)
    );
    const breakEvenPercentOfMau = safeDiv(customersNeeded * 100, Math.max(mau, 1), 0);

    return {
      llmSpend,
      infraAddon,
      devCost,
      debugCost,
      totalSimulatedBurn,
      customersNeeded,
      breakEvenPercentOfMau,
      warnings,
    };
  }, [mau, tokensPerUser, headcount, debugPercent, customerPrice, baselineFixedSpend, hourlyRate]);

  // 12-Month Cumulative Projections
  const projectionData: SimulatorProjection[] = useMemo(() => {
    const data: SimulatorProjection[] = [];
    let cumulative = 0;
    const monthly = simulationMetrics.totalSimulatedBurn;

    for (let i = 1; i <= 12; i++) {
      // Simulate 3% organic monthly growth in traffic and spend
      const monthBurn = monthly * Math.pow(1.025, i - 1);
      cumulative += monthBurn;

      data.push({
        month: i,
        label: monthLabel(i - 1),
        cumulative: Math.round(cumulative),
        monthly: Math.round(monthBurn),
        breakEvenCustomers: simulationMetrics.customersNeeded,
      });
    }
    return data;
  }, [simulationMetrics]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          Interactive "What-If" Burn Simulator & Scaling Forecaster
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Stress-test your architecture. Drag traffic and staffing levers to expose hidden tier cliffs and calculate break-even velocity.
        </p>
      </div>

      {/* Top Controls Grid: 4 Range Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Slider 1: MAU */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <Users size={14} className="text-violet-400" /> Monthly Active Users
            </span>
            <span className="num font-bold text-violet-300 font-mono">
              {mau.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="100000"
            step="100"
            value={mau}
            onChange={(e) => setMau(parseInt(e.target.value))}
            className="w-full accent-violet-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>100</span>
            <span>25k</span>
            <span>50k</span>
            <span>100k</span>
          </div>
        </div>

        {/* Slider 2: AI Tokens per user */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <Cpu size={14} className="text-cyan-400" /> Avg AI Tokens / User
            </span>
            <span className="num font-bold text-cyan-300 font-mono">
              {tokensPerUser >= 1000 ? `${(tokensPerUser / 1000).toFixed(0)}k` : tokensPerUser}
            </span>
          </div>
          <input
            type="range"
            min="500"
            max="50000"
            step="500"
            value={tokensPerUser}
            onChange={(e) => setTokensPerUser(parseInt(e.target.value))}
            className="w-full accent-cyan-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>500</span>
            <span>15k</span>
            <span>30k</span>
            <span>50k</span>
          </div>
        </div>

        {/* Slider 3: Headcount */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <UserCheck size={14} className="text-emerald-400" /> Team Headcount
            </span>
            <span className="num font-bold text-emerald-300 font-mono">
              {headcount} {headcount === 1 ? 'Solo dev' : 'Engineers'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={headcount}
            onChange={(e) => setHeadcount(parseInt(e.target.value))}
            className="w-full accent-emerald-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>1 (Solo)</span>
            <span>3</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>

        {/* Slider 4: Bug / Debugging Frequency */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <Bug size={14} className="text-amber-400" /> Debugging Tax %
            </span>
            <span className="num font-bold text-amber-300 font-mono">
              {debugPercent}% time
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="5"
            value={debugPercent}
            onChange={(e) => setDebugPercent(parseInt(e.target.value))}
            className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>0% (Lean)</span>
            <span>20%</span>
            <span>40%</span>
            <span>60% (Debt)</span>
          </div>
        </div>
      </div>

      {/* Free-Tier Cliff Warnings Ribbon */}
      {simulationMetrics.warnings.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <ShieldAlert size={14} /> Active Free-Tier Clifflines Triggered ({simulationMetrics.warnings.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {simulationMetrics.warnings.map((w, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3"
              >
                <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-200">{w.vendor} Cliff</span>
                    <span className="num font-bold text-xs text-amber-400 font-mono">
                      +${w.additionalCostPerMonth}/mo
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">{w.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Middle Grid: Break-even Calculator & Projected Burn Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Break-even Point Calculator */}
        <div className="card p-5 lg:col-span-5 space-y-4">
          <div className="border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-400" /> Break-Even Velocity Analyzer
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              How many paying customers at your pricing tier covers the full simulated infrastructure stack?
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Target Pricing Tier (SaaS MRR/sub):</span>
              <span className="num font-bold text-zinc-100 font-mono">
                {formatCurrency(customerPrice, currency)}/mo
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="299"
              step="5"
              value={customerPrice}
              onChange={(e) => setCustomerPrice(parseInt(e.target.value))}
              className="w-full accent-emerald-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>$5/mo</span>
              <span>$29/mo</span>
              <span>$99/mo</span>
              <span>$299/mo</span>
            </div>
          </div>

          {/* Results Badge */}
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2 text-center">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">
              Paying Customers Needed for 100% Cost Coverage
            </span>
            <div className="num font-bold text-3xl text-emerald-400 font-mono">
              {simulationMetrics.customersNeeded.toLocaleString()}
            </div>
            <p className="text-xs text-zinc-400">
              Equals <span className="font-mono text-zinc-200 font-bold">{simulationMetrics.breakEvenPercentOfMau.toFixed(1)}%</span> conversion of your {mau.toLocaleString()} MAU
            </p>
          </div>

          {/* Breakdown items */}
          <div className="space-y-2 text-xs divide-y divide-zinc-800/80">
            <div className="flex justify-between pt-1">
              <span className="text-zinc-400">Base Infrastructure & Subscriptions</span>
              <span className="num font-mono text-zinc-200">
                {formatCurrency(baselineFixedSpend, currency)}/mo
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-zinc-400">Simulated AI / Token Egress</span>
              <span className="num font-mono text-zinc-200">
                {formatCurrency(simulationMetrics.llmSpend, currency)}/mo
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-zinc-400">Infra Free-Tier Clifflines</span>
              <span className="num font-mono text-zinc-200">
                {formatCurrency(simulationMetrics.infraAddon, currency)}/mo
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-zinc-400">Simulated Debugging Tax ({debugPercent}%)</span>
              <span className="num font-mono text-amber-400">
                {formatCurrency(simulationMetrics.debugCost, currency)}/mo
              </span>
            </div>
            <div className="flex justify-between pt-2 font-bold text-zinc-100 border-t border-zinc-700">
              <span>Total Simulated Monthly Burn</span>
              <span className="num font-mono text-violet-400">
                {formatCurrency(simulationMetrics.totalSimulatedBurn, currency)}/mo
              </span>
            </div>
          </div>
        </div>

        {/* 12-Month Projected Cumulative Expenditure Chart */}
        <div className="card p-5 lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <TrendingUp size={16} className="text-violet-400" /> 12-Month Cumulative Cash Trajectory
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Total cash outlay over next 12 months under current simulation levers
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">
                12M Total Outlay
              </span>
              <span className="num font-bold text-sm text-violet-300 font-mono">
                {formatCurrency(
                  projectionData[projectionData.length - 1]?.cumulative || 0,
                  currency
                )}
              </span>
            </div>
          </div>

          <div className="h-[220px] sm:h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="cumulGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors[0] || "#8b5cf6"} stopOpacity={0.6} />
                    <stop offset="95%" stopColor={chartColors[0] || "#8b5cf6"} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(63, 63, 70, 0.25)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(63, 63, 70, 0.4)' }}
                  tick={{ fill: '#71717a', fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(63, 63, 70, 0.4)' }}
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const dataPoint = payload[0].payload as SimulatorProjection;
                    return (
                      <div className="bg-[#18181C] border border-zinc-700 p-3 rounded-lg shadow-xl text-xs space-y-1.5 min-w-[180px]">
                        <div className="font-semibold text-zinc-200 border-b border-zinc-800 pb-1 flex justify-between">
                          <span>Month: {label}</span>
                          <span className="num text-zinc-400">M{dataPoint.month}</span>
                        </div>
                        <div className="flex justify-between text-zinc-300">
                          <span>Cumulative Spend:</span>
                          <span className="num font-bold text-violet-300 font-mono">
                            {formatCurrency(dataPoint.cumulative, currency)}
                          </span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Monthly Run-rate:</span>
                          <span className="num font-mono text-zinc-200">
                            {formatCurrency(dataPoint.monthly, currency)}/mo
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  name="Cumulative Spend"
                  stroke={chartColors[0] || "#8b5cf6"}
                  strokeWidth={2}
                  fill="url(#cumulGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BurnSimulator;
