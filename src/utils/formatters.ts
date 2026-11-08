// ============================================================
// DevSpend — Utility Formatters (Division-by-Zero immune)
// ============================================================

import {
  Currency,
  ExchangeRates,
  ExpenseCategory,
  RevenueCategory,
  StakeholderRole,
  EquityInstrument,
  RevenuePreset,
} from '../types';

// Static fallback exchange rates (1 USD = X)
export const EXCHANGE_RATES: ExchangeRates = {
  USD: 1,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
};

// ============================================================
// Safe arithmetic helpers
// ============================================================
export function safeDiv(numerator: number, denominator: number, fallback = 0): number {
  if (!isFinite(denominator) || denominator === 0 || isNaN(denominator)) return fallback;
  if (!isFinite(numerator) || isNaN(numerator)) return fallback;
  const result = numerator / denominator;
  return isFinite(result) ? result : fallback;
}

export function safeNum(value: number, fallback = 0): number {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) return fallback;
  return value;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(safeNum(value), min), max);
}

// ============================================================
// Currency formatting
// ============================================================
export function formatCurrency(
  amount: number,
  currency: Currency = 'USD',
  compact = false
): string {
  const safe = safeNum(amount);
  const symbol = CURRENCY_SYMBOLS[currency];
  const converted = safe * EXCHANGE_RATES[currency];

  if (compact) {
    if (converted >= 1_000_000) return `${symbol}${(converted / 1_000_000).toFixed(1)}M`;
    if (converted >= 1_000) return `${symbol}${(converted / 1_000).toFixed(1)}K`;
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted).replace(/^/, symbol);
}

export function formatUSD(amount: number): string {
  const safe = safeNum(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

// ============================================================
// Percentage formatting
// ============================================================
export function formatPercent(value: number, decimals = 1): string {
  const safe = safeNum(value);
  return `${safe.toFixed(decimals)}%`;
}

// ============================================================
// Runway calculation
// ============================================================
export function calcRunway(
  cashReserve: number,
  monthlyBurn: number
): { months: number; days: number } {
  if (monthlyBurn <= 0 || !isFinite(monthlyBurn)) {
    return { months: 999, days: 0 };
  }
  const months = safeDiv(safeNum(cashReserve), monthlyBurn);
  const wholeMonths = Math.floor(months);
  const days = Math.round((months - wholeMonths) * 30);
  return { months: wholeMonths, days };
}

// ============================================================
// Monthly normalizer (annual → monthly amortization)
// ============================================================
export function normalizeToMonthly(amount: number, billingCycle: string): number {
  const safe = safeNum(amount);
  switch (billingCycle) {
    case 'annual': return safeDiv(safe, 12);
    case 'one_time': return safeDiv(safe, 12); // amortize over 12 months
    case 'monthly':
    case 'usage_based':
    case 'time_logged':
    default:
      return safe;
  }
}

// ============================================================
// Duration / timer formatting
// ============================================================
export function formatDuration(seconds: number): string {
  const s = Math.floor(safeNum(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${sec.toString().padStart(2, '0')}s`;
  return `${m.toString().padStart(2, '0')}m ${sec.toString().padStart(2, '0')}s`;
}

export function formatMinutes(minutes: number): string {
  const safe = safeNum(minutes);
  if (safe < 60) return `${safe.toFixed(0)}m`;
  return `${(safe / 60).toFixed(1)}h`;
}

// ============================================================
// Category metadata
// ============================================================
export const CATEGORY_META: Record<
  string,
  { label: string; color: string; bgColor: string; textColor: string }
> = {
  apis_llms: {
    label: 'APIs & LLMs',
    color: '#8b5cf6',
    bgColor: 'bg-violet-500/10',
    textColor: 'text-violet-400',
  },
  cloud_infra: {
    label: 'Cloud & Infra',
    color: '#3b82f6',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
  },
  debugging_tech_debt: {
    label: 'Debugging & Tech Debt',
    color: '#f59e0b',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
  },
  salaries_contractors: {
    label: 'Salaries & Contractors',
    color: '#10b981',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
  },
  devtools_saas: {
    label: 'DevTools & SaaS',
    color: '#06b6d4',
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-400',
  },
  domains_legal_misc: {
    label: 'Domains, Legal & Misc',
    color: '#f43f5e',
    bgColor: 'bg-rose-500/10',
    textColor: 'text-rose-400',
  },
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  apis_llms: '#8b5cf6',
  cloud_infra: '#3b82f6',
  debugging_tech_debt: '#f59e0b',
  salaries_contractors: '#10b981',
  devtools_saas: '#06b6d4',
  domains_legal_misc: '#f43f5e',
};

// ============================================================
// Revenue category metadata & colors
// ============================================================
export const REVENUE_CATEGORY_META: Record<
  RevenueCategory,
  { label: string; color: string; bgColor: string; textColor: string; borderColor: string }
> = {
  mrr_subscriptions: {
    label: 'MRR Subscriptions',
    color: '#10b981',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
  one_time_sales: {
    label: 'One-Time Sales',
    color: '#3b82f6',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
  },
  client_services: {
    label: 'Client Services',
    color: '#8b5cf6',
    bgColor: 'bg-violet-500/10',
    textColor: 'text-violet-400',
    borderColor: 'border-violet-500/30',
  },
  grants_credits: {
    label: 'Grants & Credits',
    color: '#06b6d4',
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
  },
  capital_addition: {
    label: 'Capital Additions',
    color: '#f59e0b',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
  },
  other_income: {
    label: 'Other Income',
    color: '#ec4899',
    bgColor: 'bg-pink-500/10',
    textColor: 'text-pink-400',
    borderColor: 'border-pink-500/30',
  },
};

// ============================================================
// Stakeholder role metadata
// ============================================================
export const STAKEHOLDER_ROLE_META: Record<
  StakeholderRole,
  { label: string; color: string; badge: string }
> = {
  founder: {
    label: 'Founder',
    color: '#10b981',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  co_founder: {
    label: 'Co-Founder',
    color: '#059669',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  },
  angel_investor: {
    label: 'Angel Investor',
    color: '#3b82f6',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  },
  vc_fund: {
    label: 'VC Fund',
    color: '#8b5cf6',
    badge: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  },
  employee: {
    label: 'Employee / Key Hire',
    color: '#0ea5e9',
    badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  },
  advisor: {
    label: 'Advisor',
    color: '#f59e0b',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
  esop_pool: {
    label: 'ESOP Pool',
    color: '#06b6d4',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  },
  strategic_partner: {
    label: 'Strategic Partner',
    color: '#ec4899',
    badge: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  },
};

export const EQUITY_INSTRUMENT_META: Record<
  EquityInstrument,
  { label: string; short: string }
> = {
  common_stock: { label: 'Common Stock', short: 'Common' },
  preferred_stock: { label: 'Preferred Stock', short: 'Preferred' },
  preferred_equity: { label: 'Preferred Equity', short: 'Preferred' },
  safe: { label: 'SAFE', short: 'SAFE' },
  safe_note: { label: 'SAFE Note', short: 'SAFE' },
  convertible_note: { label: 'Convertible Note', short: 'Conv. Note' },
  options_esop: { label: 'Stock Options / ESOP', short: 'ESOP' },
  revenue_share: { label: 'Revenue Share Agreement', short: 'Rev-Share' },
  warrants: { label: 'Warrants', short: 'Warrants' },
};

// Quick presets for revenue additions
export const REVENUE_PRESETS: RevenuePreset[] = [
  {
    label: 'Stripe MRR Payout',
    source: 'Stripe',
    category: 'mrr_subscriptions',
    billingCycle: 'monthly',
    typicalAmount: 2340,
    typicalFeePercent: 2.9,
  },
  {
    label: 'Enterprise Annual Contract',
    source: 'Direct Wire',
    category: 'one_time_sales',
    billingCycle: 'annual',
    typicalAmount: 12000,
    typicalFeePercent: 0,
  },
  {
    label: 'App Store Proceeds',
    source: 'Apple App Store',
    category: 'mrr_subscriptions',
    billingCycle: 'monthly',
    typicalAmount: 850,
    typicalFeePercent: 15,
  },
  {
    label: 'Custom Client Engineering',
    source: 'Client Direct',
    category: 'client_services',
    billingCycle: 'one_time',
    typicalAmount: 3500,
    typicalFeePercent: 0,
  },
  {
    label: 'AWS Activate Cloud Grant',
    source: 'AWS',
    category: 'grants_credits',
    billingCycle: 'one_time',
    typicalAmount: 5000,
    typicalFeePercent: 0,
  },
  {
    label: 'Founder Treasury Cash Injection',
    source: 'Founder Personal',
    category: 'capital_addition',
    billingCycle: 'one_time',
    typicalAmount: 10000,
    typicalFeePercent: 0,
  },
];

// ============================================================
// Runway urgency color
// ============================================================
export function runwayColor(months: number): string {
  if (months >= 12) return 'text-emerald-400';
  if (months >= 6) return 'text-amber-400';
  return 'text-rose-400';
}

// ============================================================
// Health score color
// ============================================================
export function healthScoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-rose-400';
}

// ============================================================
// Date helpers
// ============================================================
export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function isoNow(): string {
  return new Date().toISOString();
}

export function monthLabel(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

// ============================================================
// UUID generator
// ============================================================
export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() :
    Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ============================================================
// CSV export helper
// ============================================================
export function exportToCSV(rows: Record<string, string | number | boolean>[], filename: string): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h];
        const str = String(val ?? '');
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// JSON export / import helpers
// ============================================================
export function exportToJSON(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function readJSONFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        resolve(JSON.parse(e.target?.result as string));
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// ============================================================
// Billing cycle label
// ============================================================
export function billingCycleLabel(cycle: string): string {
  const map: Record<string, string> = {
    one_time: 'One-time',
    monthly: 'Monthly',
    annual: 'Annual',
    usage_based: 'Usage-based',
    time_logged: 'Time logged',
  };
  return map[cycle] ?? cycle;
}

// ============================================================
// Status badge config
// ============================================================
export function projectStatusMeta(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    mvp: { label: 'MVP', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    scaling: { label: 'Scaling', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    production: { label: 'Production', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    maintenance: { label: 'Maintenance', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  };
  return map[status] ?? { label: status, color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' };
}
