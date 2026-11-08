// ============================================================
// DevSpend — AI Service (Multi-provider + Deterministic fallback)
// ============================================================

import { ExpenseItem, DebugSession, AiAuditReport, AuditRecommendation, AiProvider } from '../types';
import { generateId, isoNow, normalizeToMonthly } from '../utils/formatters';

// ============================================================
// Types
// ============================================================
export interface AuditContext {
  projectId: string;
  ownerUserId?: string;
  projectName: string;
  expenses: ExpenseItem[];
  debugSessions: DebugSession[];
  monthlyBudgetCap: number;
  hourlyDevRate: number;
}

export interface LeanBlueprintResult {
  indie: { title: string; stack: string[]; monthlyCost: number; details: string };
  scaleReady: { title: string; stack: string[]; monthlyCost: number; details: string };
  enterpriseTrap: { title: string; stack: string[]; monthlyCost: number; details: string };
}

// ============================================================
// Deterministic Heuristic Engine
// ============================================================
function runDeterministicAudit(ctx: AuditContext): AiAuditReport {
  const recommendations: AuditRecommendation[] = [];
  const { expenses, debugSessions, hourlyDevRate, projectId } = ctx;

  // Check for high LLM costs
  const llmExpenses = expenses.filter(e => e.category === 'apis_llms');
  const highLlm = llmExpenses.find(e => normalizeToMonthly(e.amount, e.billingCycle) > 100);
  if (highLlm) {
    const monthly = normalizeToMonthly(highLlm.amount, highLlm.billingCycle);
    recommendations.push({
      id: `rec_${generateId()}`,
      targetExpenseId: highLlm.id,
      category: 'tier_downgrade',
      title: `Switch from ${highLlm.vendor} to Gemini Flash for high-volume calls`,
      currentVendor: highLlm.vendor,
      currentMonthlyCost: monthly,
      suggestedVendor: 'Google Gemini Flash',
      suggestedMonthlyCost: Math.round(monthly * 0.15),
      monthlySavings: Math.round(monthly * 0.85),
      implementationEffort: '2 hours',
      technicalReasoning: `Gemini 1.5 Flash is ~10-15x cheaper than ${highLlm.vendor} for most text tasks. Route high-volume, lower-complexity queries to Flash while keeping your current model for complex reasoning.`,
      actionSteps: [
        'Install @google/generative-ai SDK',
        'Classify queries by complexity (simple = retrieval/formatting, complex = multi-step reasoning)',
        'Route simple queries to gemini-1.5-flash-002',
        'Monitor quality parity using LLM evaluation metrics',
      ],
      applied: false,
    });
  }

  // Check for AWS expenses
  const awsExpense = expenses.find(e =>
    e.vendor.toLowerCase().includes('aws') && normalizeToMonthly(e.amount, e.billingCycle) > 30
  );
  if (awsExpense) {
    const monthly = normalizeToMonthly(awsExpense.amount, awsExpense.billingCycle);
    recommendations.push({
      id: `rec_${generateId()}`,
      targetExpenseId: awsExpense.id,
      category: 'stack_swap',
      title: 'Replace AWS with Hetzner VPS + Coolify for 90% cost reduction',
      currentVendor: 'AWS',
      currentMonthlyCost: monthly,
      suggestedVendor: 'Hetzner + Coolify',
      suggestedMonthlyCost: 4.50,
      monthlySavings: Math.round(monthly - 4.50),
      implementationEffort: '1-2 days',
      technicalReasoning: `A Hetzner CX21 (2 vCPU, 4GB RAM) at €3.79/mo can handle most indie/small-scale workloads that you're paying AWS ${monthly.toFixed(2)}/mo for. Coolify provides a Heroku-like UI to deploy Docker apps, manage databases, and set up SSL — all self-hosted. Combine with Cloudflare for DDoS protection and CDN.`,
      actionSteps: [
        'Provision Hetzner CX21 instance (€3.79/mo)',
        'Install Coolify via one-line script on the VPS',
        'Migrate your app services as Docker containers',
        'Set up Cloudflare as CDN + DNS proxy',
        'Terminate AWS resources after 1 week of parallel running',
      ],
      applied: false,
    });
  }

  // Check for excessive debugging cost
  const totalDebugCost = debugSessions
    .filter(d => d.projectId === projectId)
    .reduce((sum, d) => sum + d.calculatedCost, 0);
  if (totalDebugCost > 200) {
    recommendations.push({
      id: `rec_${generateId()}`,
      category: 'debugging_reduction',
      title: `Cut $${Math.round(totalDebugCost * 0.6)}/mo debugging cost with TypeScript strictness + Zod`,
      currentVendor: 'Self-Time',
      currentMonthlyCost: totalDebugCost,
      suggestedVendor: 'TypeScript Strict + Zod + Vitest',
      suggestedMonthlyCost: 0,
      monthlySavings: Math.round(totalDebugCost * 0.6),
      implementationEffort: '1-2 days',
      technicalReasoning: `You've spent $${Math.round(totalDebugCost)} on debugging this month at $${hourlyDevRate}/hr. Studies show TypeScript strict mode + Zod runtime validation eliminates ~60% of runtime type errors. Add integration tests for your top 3 bug-prone components.`,
      actionSteps: [
        'Enable strict: true in tsconfig.json',
        'Add Zod schemas for all API response types',
        'Write Vitest tests for each previously-bugged component',
        'Set up GitHub Actions CI to block PRs with failing tests',
        'Add ESLint rules: no-explicit-any, prefer-nullish-coalescing',
      ],
      applied: false,
    });
  }

  // Check for unused SaaS tools
  const nonEssentialSaas = expenses.filter(e =>
    e.category === 'devtools_saas' && !e.isEssential
  );
  if (nonEssentialSaas.length > 0) {
    const totalSavings = nonEssentialSaas.reduce(
      (sum, e) => sum + normalizeToMonthly(e.amount, e.billingCycle), 0
    );
    recommendations.push({
      id: `rec_${generateId()}`,
      targetExpenseId: nonEssentialSaas[0].id,
      category: 'tier_downgrade',
      title: `Cancel ${nonEssentialSaas.length} non-essential SaaS tool(s) — save $${Math.round(totalSavings)}/mo`,
      currentVendor: nonEssentialSaas.map(e => e.vendor).join(', '),
      currentMonthlyCost: totalSavings,
      suggestedVendor: 'Free / OSS Alternatives',
      suggestedMonthlyCost: 0,
      monthlySavings: Math.round(totalSavings),
      implementationEffort: '10 mins',
      technicalReasoning: `You have ${nonEssentialSaas.length} SaaS tools marked as non-essential (${nonEssentialSaas.map(e => e.title).join(', ')}). Each can be replaced with free or open-source alternatives with minimal migration effort.`,
      actionSteps: nonEssentialSaas.map(e => `Cancel ${e.vendor} (${e.title}) and migrate to free alternative`),
      applied: false,
    });
  }

  // Calculate totals
  const totalSavings = recommendations.reduce((sum, r) => sum + r.monthlySavings, 0);
  const totalBurn = expenses.reduce((sum, e) => sum + normalizeToMonthly(e.amount, e.billingCycle), 0);
  const healthScore = Math.max(0, Math.min(100, Math.round(100 - (totalSavings / Math.max(totalBurn, 1)) * 100)));

  return {
    id: `audit_${generateId()}`,
    projectId,
    ownerUserId: ctx.ownerUserId || 'user_demo',
    generatedAt: isoNow(),
    modelUsed: 'DevSpend Heuristic Engine v1',
    estimatedMonthlySavings: totalSavings,
    healthScore,
    recommendations,
  };
}

// ============================================================
// Lean Blueprint Generator (deterministic)
// ============================================================
export function generateLeanBlueprint(featureDescription: string): LeanBlueprintResult {
  const isRealtime = featureDescription.toLowerCase().includes('realtime') ||
    featureDescription.toLowerCase().includes('real-time') ||
    featureDescription.toLowerCase().includes('live');
  const isAI = featureDescription.toLowerCase().includes('ai') ||
    featureDescription.toLowerCase().includes('llm') ||
    featureDescription.toLowerCase().includes('chatbot') ||
    featureDescription.toLowerCase().includes('rag');
  const isPayment = featureDescription.toLowerCase().includes('payment') ||
    featureDescription.toLowerCase().includes('invoice') ||
    featureDescription.toLowerCase().includes('billing');
  const isFile = featureDescription.toLowerCase().includes('pdf') ||
    featureDescription.toLowerCase().includes('file') ||
    featureDescription.toLowerCase().includes('upload');

  const indieCost = (isRealtime ? 0 : 0) + (isAI ? 0 : 0) + (isPayment ? 0 : 0) + (isFile ? 0 : 0);
  const scaleCost = (isRealtime ? 15 : 5) + (isAI ? 10 : 0) + (isPayment ? 0 : 0) + (isFile ? 5 : 0);

  return {
    indie: {
      title: 'The $0/mo Indie Stack',
      stack: [
        'Next.js App Router (Vercel Hobby — Free)',
        isRealtime ? 'Supabase Realtime (Free: 200 concurrent)' : 'Supabase Free Tier (500MB DB)',
        isAI ? 'Google Gemini 1.5 Flash (Free: 15 RPM, 1M tokens/day)' : '',
        isPayment ? 'Stripe (2.9% + $0.30/transaction, no monthly fee)' : '',
        isFile ? 'Cloudflare R2 (Free: 10GB storage, 1M Class A ops)' : '',
        'Resend (Free: 100 emails/day)',
      ].filter(Boolean),
      monthlyCost: indieCost,
      details: `Perfect for 0-500 MAU. Supabase free tier gives you 500MB PostgreSQL, 1GB file storage, and 50MB database. Vercel Hobby has 100GB bandwidth. Watch for: Supabase pauses projects after 7 days of inactivity on free tier — upgrade when you hit 50 DAU to avoid this.`,
    },
    scaleReady: {
      title: 'The $25/mo Scale-Ready Stack',
      stack: [
        'Vercel Pro ($20/mo — 1TB bandwidth, unlimited deployments)',
        isRealtime ? 'Supabase Pro ($25/mo — 8GB DB, no pause)' : 'Supabase Pro ($25/mo)',
        isAI ? 'Gemini Flash ($0.075/M tokens input) — budget $10/mo for 133M tokens' : '',
        isPayment ? 'Stripe (standard rates, no surcharges at this scale)' : '',
        isFile ? 'Cloudflare R2 ($0.015/GB — $5/mo for 333GB)' : '',
        'Upstash Redis (Pay-per-use, ~$5/mo for 10M commands)',
      ].filter(Boolean),
      monthlyCost: 25 + scaleCost,
      details: `Handles 500-10,000 MAU comfortably. No free-tier cliffs to worry about. Vercel Pro removes the 100 build/day limit. Supabase Pro removes the inactivity pause and gives you daily backups + PITR.`,
    },
    enterpriseTrap: {
      title: 'The Enterprise Trap to Avoid',
      stack: [
        'AWS ECS Fargate + RDS Aurora ($180-500/mo at this scale)',
        isAI ? 'OpenAI GPT-4o ($5-20/M tokens — 20-70x more expensive than Flash)' : '',
        isRealtime ? 'Pusher Channels ($49/mo — pay for concurrent channels you barely use)' : '',
        isPayment ? 'Braintree or Adyen (enterprise setup complexity for indie revenue)' : '',
        'Datadog ($31/host/mo for metrics you don\'t need yet)',
        'Terraform Cloud + multi-AZ setup (over-engineered for <10K MAU)',
      ].filter(Boolean),
      monthlyCost: 300,
      details: `These choices are designed for $10M+ ARR companies. At indie/early-stage scale, you will spend 3-5x more and 2x more engineering time managing infrastructure instead of building features. The break-even point for self-managed Kubernetes is typically $15K+/mo in cloud spend.`,
    },
  };
}

// ============================================================
// Live AI API calls
// ============================================================
async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    }
  );
  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function callGroq(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
      temperature: 0.3,
    }),
  });
  if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? '';
}

async function callOpenRouter(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://devspend.dev',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    }),
  });
  if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? '';
}

function buildAuditPrompt(ctx: AuditContext): string {
  const expensesSummary = ctx.expenses.map(e =>
    `- ${e.title} (${e.vendor}): $${e.amount}/${e.billingCycle}, category: ${e.category}`
  ).join('\n');

  const debugSummary = ctx.debugSessions
    .filter(d => d.projectId === ctx.projectId)
    .map(d => `- ${d.bugDescription}: ${d.durationMinutes}min, $${d.calculatedCost.toFixed(2)}`)
    .join('\n');

  return `You are a FinOps architect specializing in cost optimization for indie developers and small teams.

Analyze this project's expenses and provide actionable cost reduction recommendations:

PROJECT: ${ctx.projectName}
MONTHLY BUDGET CAP: $${ctx.monthlyBudgetCap}
HOURLY DEV RATE: $${ctx.hourlyDevRate}/hr

EXPENSES:
${expensesSummary}

RECENT DEBUG SESSIONS:
${debugSummary || 'None'}

Provide 3-5 specific, concrete recommendations with:
1. Current vs. suggested vendor/approach
2. Exact monthly savings
3. Implementation effort (10 mins / 2 hours / 1-2 days)
4. Technical reasoning with specific vendor pricing
5. Step-by-step action items

Focus on: stack swaps, tier downgrades, architecture changes, and debugging reduction.
Format your response as valid JSON matching this schema:
{
  "healthScore": number (0-100),
  "estimatedMonthlySavings": number,
  "recommendations": [{
    "category": "stack_swap|tier_downgrade|architecture_change|debugging_reduction",
    "title": string,
    "currentVendor": string,
    "currentMonthlyCost": number,
    "suggestedVendor": string,
    "suggestedMonthlyCost": number,
    "monthlySavings": number,
    "implementationEffort": "10 mins|2 hours|1-2 days",
    "technicalReasoning": string,
    "actionSteps": string[]
  }]
}`;
}

function parseAIResponse(raw: string, ctx: AuditContext): AiAuditReport {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed = JSON.parse(jsonMatch[0]) as {
      healthScore: number;
      estimatedMonthlySavings: number;
      recommendations: Array<{
        category: string;
        title: string;
        currentVendor: string;
        currentMonthlyCost: number;
        suggestedVendor: string;
        suggestedMonthlyCost: number;
        monthlySavings: number;
        implementationEffort: string;
        technicalReasoning: string;
        actionSteps: string[];
      }>;
    };

    return {
      id: `audit_${generateId()}`,
      projectId: ctx.projectId,
      ownerUserId: ctx.ownerUserId || 'user_demo',
      generatedAt: isoNow(),
      modelUsed: 'AI Engine',
      estimatedMonthlySavings: parsed.estimatedMonthlySavings ?? 0,
      healthScore: parsed.healthScore ?? 50,
      recommendations: (parsed.recommendations ?? []).map(r => ({
        id: `rec_${generateId()}`,
        category: (r.category as AuditRecommendation['category']) ?? 'stack_swap',
        title: r.title ?? '',
        currentVendor: r.currentVendor ?? '',
        currentMonthlyCost: r.currentMonthlyCost ?? 0,
        suggestedVendor: r.suggestedVendor ?? '',
        suggestedMonthlyCost: r.suggestedMonthlyCost ?? 0,
        monthlySavings: r.monthlySavings ?? 0,
        implementationEffort: (r.implementationEffort as AuditRecommendation['implementationEffort']) ?? '2 hours',
        technicalReasoning: r.technicalReasoning ?? '',
        actionSteps: r.actionSteps ?? [],
        applied: false,
      })),
    };
  } catch {
    return runDeterministicAudit(ctx);
  }
}

// ============================================================
// Main exported function
// ============================================================
export async function runAiAudit(
  ctx: AuditContext,
  provider: AiProvider,
  apiKey: string,
  modelName?: string
): Promise<AiAuditReport> {
  if (provider === 'deterministic' || !apiKey) {
    return runDeterministicAudit(ctx);
  }

  try {
    const prompt = buildAuditPrompt(ctx);
    let raw = '';
    let usedModel = modelName ?? provider;

    if (provider === 'gemini') {
      raw = await callGemini(prompt, apiKey);
      usedModel = 'gemini-2.0-flash';
    } else if (provider === 'groq') {
      raw = await callGroq(prompt, apiKey);
      usedModel = 'llama-3.3-70b-versatile (Groq)';
    } else if (provider === 'openrouter') {
      raw = await callOpenRouter(prompt, apiKey);
      usedModel = 'meta-llama/llama-3.3-70b-instruct (OpenRouter)';
    }

    const report = parseAIResponse(raw, ctx);
    report.modelUsed = usedModel;
    return report;
  } catch {
    // Graceful fallback to deterministic engine
    return runDeterministicAudit(ctx);
  }
}

export async function testApiConnection(
  provider: AiProvider,
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    const testPrompt = 'Reply with exactly: "DevSpend connection test OK"';
    if (provider === 'gemini') {
      const r = await callGemini(testPrompt, apiKey);
      return { success: r.length > 0, message: 'Gemini API connected successfully' };
    } else if (provider === 'groq') {
      const r = await callGroq(testPrompt, apiKey);
      return { success: r.length > 0, message: 'Groq API connected successfully' };
    } else if (provider === 'openrouter') {
      const r = await callOpenRouter(testPrompt, apiKey);
      return { success: r.length > 0, message: 'OpenRouter API connected successfully' };
    }
    return { success: false, message: 'Unknown provider' };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : 'Connection failed',
    };
  }
}
