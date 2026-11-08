// ============================================================
// DevSpend — Core TypeScript Type Definitions
// ============================================================

export type Currency = 'USD' | 'INR' | 'EUR' | 'GBP';

export type ProjectStatus = 'mvp' | 'scaling' | 'production' | 'maintenance';

export type ExpenseCategory =
  | 'apis_llms'
  | 'cloud_infra'
  | 'debugging_tech_debt'
  | 'salaries_contractors'
  | 'devtools_saas'
  | 'domains_legal_misc';

export type BillingCycle =
  | 'one_time'
  | 'monthly'
  | 'annual'
  | 'usage_based'
  | 'time_logged';

export type DebugSeverity = 'low' | 'medium' | 'critical';

export type AuditRecommendationCategory =
  | 'stack_swap'
  | 'architecture_change'
  | 'debugging_reduction'
  | 'tier_downgrade';

export type ImplementationEffort = '10 mins' | '2 hours' | '1-2 days';

export type AiProvider = 'gemini' | 'groq' | 'openrouter' | 'deterministic';

export type AuditMode =
  | 'full_cost_reduction'
  | 'lean_architecture'
  | 'debug_diagnostic';

// ============================================================
// Project
// ============================================================
export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  techStack: string[];
  currency: Currency;
  monthlyBudgetCap: number;
  totalCashReserve: number;
  expectedMonthlyUsers: number;
  expectedMonthlyRevenue: number;
  hourlyDevRate: number;
  createdAt: string;
  status: ProjectStatus;
}

// ============================================================
// Expense Item
// ============================================================
export interface ExpenseItem {
  id: string;
  projectId: string;
  title: string;
  vendor: string;
  category: ExpenseCategory;
  billingCycle: BillingCycle;
  amount: number;
  hoursLogged?: number;
  usageMetric?: string;
  date: string;
  isEssential: boolean;
  isAiOptimized: boolean;
  notes: string;
}

// ============================================================
// Debug Session
// ============================================================
export interface DebugSession {
  id: string;
  projectId: string;
  bugDescription: string;
  relatedComponent: string;
  durationMinutes: number;
  calculatedCost: number;
  timestamp: string;
  severity: DebugSeverity;
}

// ============================================================
// AI Audit
// ============================================================
export interface AuditRecommendation {
  id: string;
  targetExpenseId?: string;
  category: AuditRecommendationCategory;
  title: string;
  currentVendor: string;
  currentMonthlyCost: number;
  suggestedVendor: string;
  suggestedMonthlyCost: number;
  monthlySavings: number;
  implementationEffort: ImplementationEffort;
  technicalReasoning: string;
  actionSteps: string[];
  applied: boolean;
}

export interface AiAuditReport {
  id: string;
  projectId: string;
  generatedAt: string;
  modelUsed: string;
  estimatedMonthlySavings: number;
  healthScore: number;
  recommendations: AuditRecommendation[];
}

// ============================================================
// Computed / Derived types
// ============================================================
export interface KpiMetrics {
  totalSpentToDate: number;
  monthlyBurnRate: number;
  runwayMonths: number;
  runwayDays: number;
  debuggingTaxAmount: number;
  debuggingTaxPercent: number;
  costPerUser: number;
  grossMarginPercent: number;
  aiOptimizationMonthlySavings: number;
  aiOptimizationYearlySavings: number;
}

export interface BurnChartPoint {
  month: string;
  infra: number;
  apis: number;
  salaries: number;
  debugging: number;
  saas: number;
  misc: number;
  total: number;
  budget: number;
}

export interface CategoryAllocation {
  category: ExpenseCategory;
  label: string;
  amount: number;
  percent: number;
  color: string;
}

export interface SimulatorParams {
  monthlyActiveUsers: number;
  avgTokensPerUser: number;
  headcount: number;
  debugFrequencyPercent: number;
}

export interface SimulatorProjection {
  month: number;
  label: string;
  cumulative: number;
  monthly: number;
  breakEvenCustomers: number;
}

export interface FreeTierWarning {
  vendor: string;
  threshold: number;
  currentValue: number;
  additionalCostPerMonth: number;
  description: string;
}

export interface AppSettings {
  activeProvider: AiProvider;
  geminiApiKey: string;
  groqApiKey: string;
  openrouterApiKey: string;
  darkMode: boolean;
  activeProjectId: string;
}

// ============================================================
// Command Palette
// ============================================================
export type CommandAction =
  | 'new_expense'
  | 'toggle_debug_timer'
  | 'switch_project'
  | 'run_ai_audit'
  | 'toggle_theme'
  | 'export_ledger';

export interface CommandItem {
  id: string;
  label: string;
  description: string;
  action: CommandAction;
  shortcut?: string;
  icon?: string;
}

// ============================================================
// Quick-add presets
// ============================================================
export interface ExpensePreset {
  label: string;
  vendor: string;
  category: ExpenseCategory;
  billingCycle: BillingCycle;
  typicalAmount: number;
}

// ============================================================
// Exchange rates (static fallback)
// ============================================================
export type ExchangeRates = Record<Currency, number>;
