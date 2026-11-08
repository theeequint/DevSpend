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

export type AppView =
  | 'home'
  | 'dashboard'
  | 'ledger'
  | 'ownership'
  | 'simulator'
  | 'audit'
  | 'settings';

// ============================================================
// Authentication & User Model (Strict Username + Password Only)
// ============================================================
export type AuthProvider = 'password' | 'demo';

export interface User {
  id: string;
  username: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
  authProvider: AuthProvider;
  createdAt: string;
}

export interface UserDataSnapshot {
  projects: Project[];
  expenses: ExpenseItem[];
  revenues: RevenueItem[];
  stakeholders: Stakeholder[];
  fundingRounds: FundingRound[];
  lastSyncedAt: string;
}

export interface StoredUserRecord {
  id: string;
  username: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
  authProvider: AuthProvider;
  passwordHash: string;
  salt: string;
  createdAt: string;
  updatedAt?: string;
  userDataSnapshot?: UserDataSnapshot;
}

export interface AuthSession {
  userId: string;
  username: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
  authProvider: AuthProvider;
  issuedAt: number;
  expiresAt: number;
  token: string;
}

// ============================================================
// GitHub-Backed Sharded User Database (Max 200 Users Per Shard)
// ============================================================
export interface ShardMeta {
  fileName: string;
  userCount: number;
  updatedAt: string;
}

export interface ShardManifest {
  schemaVersion: string;
  maxUsersPerFile: number;
  totalRegisteredUsers: number;
  activeWriteShard: string;
  shards: ShardMeta[];
}

export interface UserShardFile {
  shardId: string;
  userCount: number;
  createdAt: string;
  updatedAt: string;
  users: StoredUserRecord[];
}

export interface PasswordStrength {
  isValid: boolean;
  score: number; // 0 - 5
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  checks: {
    length: boolean;     // >= 10 chars
    uppercase: boolean;  // at least 1 uppercase
    lowercase: boolean;  // at least 1 lowercase
    number: boolean;     // at least 1 digit
    special: boolean;    // at least 1 special char
  };
}

// ============================================================
// Multi-Tenant Project
// ============================================================
export interface Project {
  id: string;
  ownerUserId: string;
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
// Multi-Tenant Expense Item
// ============================================================
export interface ExpenseItem {
  id: string;
  projectId: string;
  ownerUserId: string;
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
// Multi-Tenant Revenue Item (Earnings & Capital Additions)
// ============================================================
export type RevenueCategory =
  | 'mrr_subscriptions'
  | 'one_time_sales'
  | 'client_services'
  | 'grants_credits'
  | 'capital_addition'
  | 'other_income';

export interface RevenueItem {
  id: string;
  projectId: string;
  ownerUserId: string;
  title: string;
  source: string;
  category: RevenueCategory;
  billingCycle: BillingCycle;
  amount: number;
  feeDeducted?: number;
  processingFee?: number;
  netAmount: number;
  date: string;
  isRecurring: boolean;
  notes?: string;
}

// ============================================================
// Multi-Tenant Ownership & Cap-Table Entities
// ============================================================
export type StakeholderRole =
  | 'founder'
  | 'co_founder'
  | 'angel_investor'
  | 'vc_fund'
  | 'employee'
  | 'esop_pool'
  | 'advisor'
  | 'strategic_partner';

export type EquityInstrument =
  | 'common_stock'
  | 'preferred_stock'
  | 'preferred_equity'
  | 'safe'
  | 'safe_note'
  | 'convertible_note'
  | 'options_esop'
  | 'revenue_share'
  | 'warrants';

export interface Stakeholder {
  id: string;
  projectId: string;
  ownerUserId: string;
  name: string;
  role: StakeholderRole;
  sharesOwned: number;
  ownershipPercentage?: number;
  totalInvestedAmount: number;
  investmentDate?: string;
  dateJoined?: string;
  roundName?: string;
  investmentRound?: string;
  instrumentType?: EquityInstrument;
  instrument?: EquityInstrument;
  valuationCap?: number;
  votingRights?: boolean;
  hasVotingRights?: boolean;
  vestingSchedule?: string;
  notes?: string;
}

export interface FundingRound {
  id: string;
  projectId: string;
  ownerUserId?: string;
  roundName: string;
  amountRaised: number;
  preMoneyValuation: number;
  postMoneyValuation: number;
  equityDilutedPercent?: number;
  dilutionPercentage?: number;
  sharePrice?: number;
  sharesIssued?: number;
  date: string;
  leadInvestor?: string;
  addToCashReserve?: boolean;
  notes?: string;
}

// Unified Cashflow Item for 3-Tab Ledger
export interface CashflowItem {
  id: string;
  type: 'revenue' | 'expense';
  date: string;
  title: string;
  entity: string; // vendor or source
  categoryKey: string;
  categoryLabel: string;
  billingCycle: BillingCycle;
  grossAmount: number;
  netAmount: number; // positive for revenue, negative for expense
  feeDeducted?: number;
  notes: string;
  originalItem: RevenueItem | ExpenseItem;
}

// ============================================================
// Multi-Tenant Debug Session
// ============================================================
export interface DebugSession {
  id: string;
  projectId: string;
  ownerUserId: string;
  bugDescription: string;
  relatedComponent: string;
  durationMinutes: number;
  calculatedCost: number;
  timestamp: string;
  severity: DebugSeverity;
}

// ============================================================
// Multi-Tenant AI Audit
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
  ownerUserId: string;
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
  | 'home'
  | 'new_project'
  | 'delete_project'
  | 'new_expense'
  | 'new_revenue'
  | 'ownership'
  | 'new_stakeholder'
  | 'new_funding_round'
  | 'toggle_debug_timer'
  | 'switch_project'
  | 'run_ai_audit'
  | 'toggle_theme'
  | 'export_ledger'
  | 'sign_out';

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

export interface RevenuePreset {
  label: string;
  source: string;
  category: RevenueCategory;
  billingCycle: BillingCycle;
  typicalAmount: number;
  typicalFeePercent?: number;
}

// ============================================================
// Exchange rates (static fallback)
// ============================================================
export type ExchangeRates = Record<Currency, number>;
