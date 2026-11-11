// ============================================================
// DevSpend — Executive Excel (.xlsx) Balance Sheet & Ledger Generator
// Uses ExcelJS for OpenXML styling, live formulas, accounting formats,
// conditional deficit highlighting, frozen headers, and auto-fit widths.
// ============================================================

import * as ExcelNS from 'exceljs';
import type {
  Workbook as ExcelWorkbook,
  Worksheet,
  Border,
  Borders,
  Fill,
  Font,
  Alignment,
  Cell,
} from 'exceljs';
import {
  Currency,
  ExpenseItem,
  Project,
  RevenueItem,
} from '../types';
import {
  CATEGORY_META,
  CURRENCY_SYMBOLS,
  EXCHANGE_RATES,
  REVENUE_CATEGORY_META,
  normalizeToMonthly,
  projectStatusMeta,
  safeDiv,
  safeNum,
} from './formatters';

export interface BalanceSheetExportParams {
  project: Project;
  expenses: ExpenseItem[];
  revenues: RevenueItem[];
  currency: Currency;
  summary?: {
    monthlyRevenue?: number;
    grossBurn?: number;
    netBurn?: number;
    isDefaultAlive?: boolean;
  };
}

interface AggregatedCategoryRow {
  label: string;
  classification: string;
  count: number;
  monthlyUsd: number;
  totalUsd: number;
}

interface NormalizedLedgerRow {
  txnId: string;
  dateStr: string;
  dateValue: Date | string;
  timestampMs: number;
  description: string;
  categoryLabel: string;
  typeLabel: 'Credit (Inflow)' | 'Expense (Outflow)';
  isExpense: boolean;
  signedAmountDisplay: number;
  runningBalanceDisplay: number;
}

// ============================================================
// Corporate Design Palette (ARGB)
// ============================================================
const COLORS = {
  navyBannerBg: 'FF0F172A',
  slateHeaderBg: 'FF1E293B',
  slateMutedText: 'FF94A3B8',
  slateLabelText: 'FF334155',
  darkText: 'FF0F172A',
  white: 'FFFFFFFF',
  zebraLight: 'FFF8FAFC',
  summaryRowBg: 'FFF1F5F9',
  gridBorder: 'FFCBD5E1',
  accentBorder: 'FF334155',
  redText: 'FFDC2626',
  redFill: 'FFFEE2E2',
  ledgerNegFill: 'FFFEF2F2',
  greenText: 'FF15803D',
  greenFill: 'FFDCFCE7',
  amberText: 'FFB45309',
  amberFill: 'FFFEF3C7',
} as const;

const XLSX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function createWorkbook(): ExcelWorkbook {
  const mod = ExcelNS as unknown as {
    Workbook?: new () => ExcelWorkbook;
    default?: { Workbook?: new () => ExcelWorkbook };
  };
  const WorkbookCtor = mod.Workbook ?? mod.default?.Workbook;
  if (!WorkbookCtor) {
    throw new Error('ExcelJS Workbook engine is unavailable in this bundle.');
  }
  return new WorkbookCtor();
}

function round2(value: number): number {
  return Math.round(safeNum(value) * 100) / 100;
}

function convertUsd(usdAmount: number, rate: number): number {
  return round2(safeNum(usdAmount) * rate);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatYmd(dateInput?: string): string {
  if (!dateInput) {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateInput.trim());
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) return dateInput;
  return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
}

function toExcelUtcDate(ymd: string): Date | string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) return ymd;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month, day));
}

function formatGeneratedTimestamp(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(
    date.getHours()
  )}:${pad2(date.getMinutes())}`;
}

export function sanitizeProjectFilenamePart(projectName: string): string {
  const cleaned = (projectName || 'Project')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || 'Project';
}

function buildCurrencyNumFmt(symbol: string): string {
  const safeSymbol = symbol.replace(/"/g, '');
  return `"${safeSymbol}"#,##0.00;[Red]-"${safeSymbol}"#,##0.00;"${safeSymbol}"0.00`;
}

function makeFill(argb: string): Fill {
  return {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb },
  };
}

function makeThinBorder(argb: string = COLORS.gridBorder): Partial<Borders> {
  const edge: Partial<Border> = { style: 'thin', color: { argb } };
  return { top: edge, bottom: edge, left: edge, right: edge };
}

function makeAccountingTotalBorder(): Partial<Borders> {
  return {
    top: { style: 'thin', color: { argb: COLORS.darkText } },
    bottom: { style: 'double', color: { argb: COLORS.darkText } },
    left: { style: 'thin', color: { argb: COLORS.gridBorder } },
    right: { style: 'thin', color: { argb: COLORS.gridBorder } },
  };
}

function styleRange(
  ws: Worksheet,
  startCol: number,
  endCol: number,
  rowNum: number,
  options: {
    fill?: Fill;
    font?: Partial<Font>;
    border?: Partial<Borders>;
    alignment?: Partial<Alignment>;
  }
): void {
  for (let col = startCol; col <= endCol; col += 1) {
    const cell = ws.getCell(rowNum, col);
    if (options.fill) cell.fill = options.fill;
    if (options.font) cell.font = { name: 'Calibri', ...options.font };
    if (options.border) cell.border = options.border;
    if (options.alignment) cell.alignment = options.alignment;
  }
}

function measureCellWidth(cell: Cell, numFmt?: string): number {
  const val = cell.value;
  if (val === null || val === undefined) return 0;

  let text = '';
  if (val instanceof Date) {
    text = 'YYYY-MM-DD';
  } else if (typeof val === 'object' && 'result' in val) {
    const res = (val as { result?: unknown }).result;
    if (typeof res === 'number') {
      text =
        numFmt && numFmt.includes('%')
          ? `${(res * 100).toFixed(1)}%`
          : `-$${Math.abs(res).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
    } else {
      text = String(res ?? '');
    }
  } else if (typeof val === 'number') {
    if (numFmt && numFmt.includes('%')) {
      text = `${(val * 100).toFixed(1)}%`;
    } else if (numFmt && (numFmt.includes('#,##0.00') || numFmt.includes('0.00'))) {
      text = `-$${Math.abs(val).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } else {
      text = val.toLocaleString('en-US');
    }
  } else {
    text = String(val);
  }

  // Handle wrapped multi-line strings using longest single line
  const lines = text.split(/\r?\n/);
  return lines.reduce((maxLen, line) => Math.max(maxLen, line.length), 0);
}

function autoFitColumns(
  ws: Worksheet,
  minWidths: number[],
  maxWidths: number[],
  skipMergedBannerRows: number[]
): void {
  const skipSet = new Set(skipMergedBannerRows);
  minWidths.forEach((minWidth, idx) => {
    const colNumber = idx + 1;
    let maxContentLength = 0;

    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (skipSet.has(rowNumber)) return;
      const cell = row.getCell(colNumber);
      if (cell.isMerged && cell.master !== cell) return;
      if (cell.isMerged && cell.master === cell) {
        // Avoid wide spanning banners inflating a single column width
        return;
      }
      const len = measureCellWidth(cell, cell.numFmt);
      if (len > maxContentLength) {
        maxContentLength = len;
      }
    });

    const computed = Math.max(minWidth, maxContentLength + 5);
    ws.getColumn(colNumber).width = Math.min(maxWidths[idx] ?? 55, computed);
  });
}

function groupRevenuesByCategory(revenues: RevenueItem[]): AggregatedCategoryRow[] {
  const map = new Map<string, AggregatedCategoryRow>();
  for (const r of revenues) {
    const meta = REVENUE_CATEGORY_META[r.category];
    const label = meta?.label || r.category || 'Other Income';
    const netUsd = safeNum(r.netAmount ?? r.amount - (r.processingFee ?? r.feeDeducted ?? 0));
    const monthlyUsd = normalizeToMonthly(netUsd, r.billingCycle);
    const existing = map.get(label);
    if (existing) {
      existing.count += 1;
      existing.monthlyUsd += monthlyUsd;
      existing.totalUsd += netUsd;
    } else {
      map.set(label, {
        label,
        classification: 'Credit / Inflow',
        count: 1,
        monthlyUsd,
        totalUsd: netUsd,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalUsd - a.totalUsd);
}

function groupExpensesByCategory(expenses: ExpenseItem[]): AggregatedCategoryRow[] {
  const map = new Map<string, AggregatedCategoryRow>();
  for (const e of expenses) {
    const meta = CATEGORY_META[e.category];
    const label = meta?.label || e.category || 'Miscellaneous';
    const amountUsd = safeNum(e.amount);
    const monthlyUsd = normalizeToMonthly(amountUsd, e.billingCycle);
    const existing = map.get(label);
    if (existing) {
      existing.count += 1;
      existing.monthlyUsd += monthlyUsd;
      existing.totalUsd += amountUsd;
    } else {
      map.set(label, {
        label,
        classification: 'Expense / Outflow',
        count: 1,
        monthlyUsd,
        totalUsd: amountUsd,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalUsd - a.totalUsd);
}

function buildChronologicalLedger(
  revenues: RevenueItem[],
  expenses: ExpenseItem[],
  rate: number
): NormalizedLedgerRow[] {
  interface RawSortRow {
    dateStr: string;
    timestampMs: number;
    sortPriority: number;
    description: string;
    categoryLabel: string;
    isExpense: boolean;
    signedAmountDisplay: number;
  }

  const combined: RawSortRow[] = [];

  for (const r of revenues) {
    const ymd = formatYmd(r.date);
    const ms = Date.parse(ymd) || Date.parse(r.date) || 0;
    const netUsd = safeNum(r.netAmount ?? r.amount - (r.processingFee ?? r.feeDeducted ?? 0));
    const meta = REVENUE_CATEGORY_META[r.category];
    const sourcePart = r.source ? ` [${r.source}]` : '';
    const notesPart = r.notes ? ` — ${r.notes}` : '';

    combined.push({
      dateStr: ymd,
      timestampMs: ms,
      sortPriority: 0, // Credits precede debits on identical dates
      description: `${r.title}${sourcePart}${notesPart}`,
      categoryLabel: meta?.label || r.category || 'Other Income',
      isExpense: false,
      signedAmountDisplay: convertUsd(netUsd, rate),
    });
  }

  for (const e of expenses) {
    const ymd = formatYmd(e.date);
    const ms = Date.parse(ymd) || Date.parse(e.date) || 0;
    const meta = CATEGORY_META[e.category];
    const vendorPart = e.vendor ? ` [${e.vendor}]` : '';
    const notesPart = e.notes ? ` — ${e.notes}` : '';

    combined.push({
      dateStr: ymd,
      timestampMs: ms,
      sortPriority: 1,
      description: `${e.title}${vendorPart}${notesPart}`,
      categoryLabel: meta?.label || e.category || 'Miscellaneous',
      isExpense: true,
      signedAmountDisplay: -Math.abs(convertUsd(safeNum(e.amount), rate)),
    });
  }

  combined.sort((a, b) => {
    if (a.timestampMs !== b.timestampMs) return a.timestampMs - b.timestampMs;
    if (a.sortPriority !== b.sortPriority) return a.sortPriority - b.sortPriority;
    return a.description.localeCompare(b.description);
  });

  let running = 0;
  return combined.map((item, idx) => {
    running = round2(running + item.signedAmountDisplay);
    return {
      txnId: `TXN-${String(idx + 1).padStart(3, '0')}`,
      dateStr: item.dateStr,
      dateValue: toExcelUtcDate(item.dateStr),
      timestampMs: item.timestampMs,
      description: item.description,
      categoryLabel: item.categoryLabel,
      typeLabel: item.isExpense ? 'Expense (Outflow)' : 'Credit (Inflow)',
      isExpense: item.isExpense,
      signedAmountDisplay: item.signedAmountDisplay,
      runningBalanceDisplay: running,
    };
  });
}

/**
 * Generates an executive multi-sheet Excel (.xlsx) workbook buffer containing:
 *  1) "Balance Sheet & Summary" — Executive financial statement & category breakdown
 *  2) "Detailed General Ledger" — Chronological register with running balance & AutoFilter
 */
export async function generateBalanceSheetWorkbookBuffer({
  project,
  expenses,
  revenues,
  currency,
  summary,
}: BalanceSheetExportParams): Promise<{ buffer: ArrayBuffer; filename: string }> {
  const rate = EXCHANGE_RATES[currency] ?? 1;
  const symbol = CURRENCY_SYMBOLS[currency] ?? '$';
  const currencyFmt = buildCurrencyNumFmt(symbol);
  const now = new Date();
  const todayYmd = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  const generatedTimestamp = formatGeneratedTimestamp(now);
  const statusLabel = projectStatusMeta(project.status).label;

  const ledgerRows = buildChronologicalLedger(revenues, expenses, rate);
  const hasLedgerData = ledgerRows.length > 0;
  const ledgerFirstRow = 5;
  const ledgerLastDataRow = hasLedgerData ? ledgerFirstRow + ledgerRows.length - 1 : ledgerFirstRow;

  const revenueCategories = groupRevenuesByCategory(revenues);
  const expenseCategories = groupExpensesByCategory(expenses);

  const totalInflowsDisplay = round2(
    revenueCategories.reduce((sum, c) => sum + convertUsd(c.totalUsd, rate), 0)
  );
  const totalInflowsMonthlyDisplay = round2(
    revenueCategories.reduce((sum, c) => sum + convertUsd(c.monthlyUsd, rate), 0)
  );
  const totalExpensesDisplay = round2(
    expenseCategories.reduce((sum, c) => sum + convertUsd(c.totalUsd, rate), 0)
  );
  const totalExpensesMonthlyDisplay = round2(
    expenseCategories.reduce((sum, c) => sum + convertUsd(c.monthlyUsd, rate), 0)
  );

  const grossBurnUsd =
    summary?.grossBurn ??
    expenses.reduce((sum, e) => sum + normalizeToMonthly(e.amount, e.billingCycle), 0);
  const monthlyBurnDisplay = convertUsd(grossBurnUsd, rate);
  const budgetCapDisplay = convertUsd(project.monthlyBudgetCap, rate);
  const cashReserveDisplay = convertUsd(project.totalCashReserve, rate);
  const netBalanceDisplay = round2(totalInflowsDisplay - totalExpensesDisplay);
  const netMonthlyDisplay = round2(totalInflowsMonthlyDisplay - totalExpensesMonthlyDisplay);
  const closingTreasuryDisplay = round2(cashReserveDisplay + netBalanceDisplay);

  const burnRateRatio =
    budgetCapDisplay > 0
      ? safeDiv(monthlyBurnDisplay, budgetCapDisplay, 0)
      : safeDiv(totalExpensesDisplay, Math.max(totalInflowsDisplay, 0), 0);

  const workbook = createWorkbook();
  workbook.creator = 'DevSpend Financial Engine';
  workbook.lastModifiedBy = 'DevSpend';
  workbook.created = now;
  workbook.modified = now;

  // =========================================================================
  // WORKSHEET 1: "Balance Sheet & Summary"
  // =========================================================================
  const ws1 = workbook.addWorksheet('Balance Sheet & Summary', {
    properties: { tabColor: { argb: COLORS.navyBannerBg } },
    views: [{ showGridLines: true }],
  });

  // Executive Title Banner (Rows 1–4)
  ws1.mergeCells('A1:F2');
  const titleCell = ws1.getCell('A1');
  titleCell.value = 'DEVSPEND — PROJECT BALANCE SHEET & FINANCIAL STATEMENT';
  styleRange(ws1, 1, 6, 1, {
    fill: makeFill(COLORS.navyBannerBg),
    font: { size: 16, bold: true, color: { argb: COLORS.white } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  });
  styleRange(ws1, 1, 6, 2, {
    fill: makeFill(COLORS.navyBannerBg),
    font: { size: 16, bold: true, color: { argb: COLORS.white } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  });
  ws1.getRow(1).height = 24;
  ws1.getRow(2).height = 24;

  ws1.mergeCells('A3:F3');
  ws1.getCell('A3').value =
    `Project: ${project.name}   |   Category / Stage: ${statusLabel}   |   Currency: ${currency} (${symbol})   |   Generated: ${generatedTimestamp}`;
  styleRange(ws1, 1, 6, 3, {
    fill: makeFill(COLORS.slateHeaderBg),
    font: { size: 10, bold: true, color: { argb: COLORS.slateMutedText } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  });
  ws1.getRow(3).height = 22;
  ws1.getRow(4).height = 10;
  ws1.getRow(5).height = 8;

  // Compute Balance Sheet Row Positions ahead so Rows 7–11 hold exact live formulas
  const inflowSectionRow = 13;
  const inflowHeaderRow = 14;
  const inflowStartRow = 15;
  const inflowRowCount = Math.max(1, revenueCategories.length);
  const inflowEndRow = inflowStartRow + inflowRowCount - 1;
  const inflowsTotalRow = inflowEndRow + 1;

  const expenseSectionRow = inflowsTotalRow + 2;
  const expenseHeaderRow = expenseSectionRow + 1;
  const expenseStartRow = expenseHeaderRow + 1;
  const expenseRowCount = Math.max(1, expenseCategories.length);
  const expenseEndRow = expenseStartRow + expenseRowCount - 1;
  const expensesTotalRow = expenseEndRow + 1;

  const reconHeaderRow = expensesTotalRow + 2;
  const netReconRow = reconHeaderRow + 1;
  const treasuryReconRow = netReconRow + 1;

  // Project Overview & Key Financial KPIs Block (Rows 6–11)
  ws1.mergeCells('A6:C6');
  ws1.getCell('A6').value = 'PROJECT OVERVIEW & METADATA';
  styleRange(ws1, 1, 3, 6, {
    fill: makeFill(COLORS.slateHeaderBg),
    font: { size: 10, bold: true, color: { argb: COLORS.white } },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
    border: makeThinBorder(COLORS.accentBorder),
  });

  ws1.mergeCells('D6:F6');
  ws1.getCell('D6').value = 'FINANCIAL POSITION & KPIs';
  styleRange(ws1, 4, 6, 6, {
    fill: makeFill(COLORS.slateHeaderBg),
    font: { size: 10, bold: true, color: { argb: COLORS.white } },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
    border: makeThinBorder(COLORS.accentBorder),
  });
  ws1.getRow(6).height = 26;

  const leftMetadataRows: Array<{
    label: string;
    value: Cell['value'];
    numFmt?: string;
    alignRight?: boolean;
  }> = [
    { label: 'Project Name', value: project.name },
    { label: 'Project Status', value: statusLabel },
    { label: 'Created Date', value: formatYmd(project.createdAt) },
    {
      label: 'Total Transactions',
      value: hasLedgerData
        ? {
            formula: `COUNTA('Detailed General Ledger'!A${ledgerFirstRow}:A${ledgerLastDataRow})`,
            result: ledgerRows.length,
          }
        : 0,
      numFmt: '#,##0',
      alignRight: true,
    },
    {
      label: 'Treasury Cash Reserve',
      value: cashReserveDisplay,
      numFmt: currencyFmt,
      alignRight: true,
    },
  ];

  leftMetadataRows.forEach((meta, idx) => {
    const rowNum = 7 + idx;
    const zebraFill = makeFill(idx % 2 === 0 ? COLORS.white : COLORS.zebraLight);
    ws1.getRow(rowNum).height = 24;

    const labelCell = ws1.getCell(rowNum, 1);
    labelCell.value = meta.label;
    labelCell.fill = zebraFill;
    labelCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.slateLabelText } };
    labelCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    labelCell.border = makeThinBorder();

    ws1.mergeCells(rowNum, 2, rowNum, 3);
    styleRange(ws1, 2, 3, rowNum, {
      fill: zebraFill,
      font: { name: 'Calibri', size: 10, bold: Boolean(meta.alignRight), color: { argb: COLORS.darkText } },
      alignment: {
        horizontal: meta.alignRight ? 'right' : 'left',
        vertical: 'middle',
        indent: meta.alignRight ? 0 : 1,
      },
      border: makeThinBorder(),
    });
    const valCell = ws1.getCell(rowNum, 2);
    valCell.value = meta.value as Cell['value'];
    if (meta.numFmt) valCell.numFmt = meta.numFmt;
  });

  // Right KPI Block (Rows 7–11)
  const kpiDefinitions = [
    {
      label: 'Total Budget / Inflows',
      value: { formula: `E${inflowsTotalRow}`, result: totalInflowsDisplay },
      numFmt: currencyFmt,
      badge: `${revenues.length} Inflow${revenues.length === 1 ? '' : 's'}`,
      valueBg: COLORS.white,
      valueColor: COLORS.greenText,
      badgeBg: COLORS.zebraLight,
      badgeColor: COLORS.slateLabelText,
    },
    {
      label: 'Total Expenses / Outflows',
      value: { formula: `E${expensesTotalRow}`, result: totalExpensesDisplay },
      numFmt: currencyFmt,
      badge: `${expenses.length} Expense${expenses.length === 1 ? '' : 's'}`,
      valueBg: COLORS.zebraLight,
      valueColor: COLORS.redText,
      badgeBg: COLORS.zebraLight,
      badgeColor: COLORS.slateLabelText,
    },
    {
      label: 'Net Balance / Variance',
      value: { formula: 'E7-E8', result: netBalanceDisplay },
      numFmt: currencyFmt,
      badge: netBalanceDisplay < 0 ? 'NET LOSS / DEFICIT' : 'NET SURPLUS',
      valueBg: netBalanceDisplay < 0 ? COLORS.redFill : COLORS.greenFill,
      valueColor: netBalanceDisplay < 0 ? COLORS.redText : COLORS.greenText,
      badgeBg: netBalanceDisplay < 0 ? COLORS.redFill : COLORS.greenFill,
      badgeColor: netBalanceDisplay < 0 ? COLORS.redText : COLORS.greenText,
    },
    {
      label: 'Normalized Monthly Burn',
      value: monthlyBurnDisplay,
      numFmt: currencyFmt,
      badge: budgetCapDisplay > 0 ? `Cap: ${symbol}${budgetCapDisplay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'No Cap Set',
      valueBg: COLORS.zebraLight,
      valueColor: COLORS.darkText,
      badgeBg: COLORS.zebraLight,
      badgeColor: COLORS.slateLabelText,
    },
    {
      label: 'Burn Rate %',
      value: {
        formula: budgetCapDisplay > 0 ? `E10/${budgetCapDisplay}` : 'IF(E7=0,0,E8/E7)',
        result: round2(burnRateRatio * 10000) / 10000,
      },
      numFmt: '0.0%',
      badge:
        burnRateRatio > 1
          ? 'OVER CAP'
          : burnRateRatio >= 0.85
          ? 'ELEVATED BURN'
          : 'WITHIN BUDGET',
      valueBg:
        burnRateRatio > 1
          ? COLORS.redFill
          : burnRateRatio >= 0.85
          ? COLORS.amberFill
          : COLORS.greenFill,
      valueColor:
        burnRateRatio > 1
          ? COLORS.redText
          : burnRateRatio >= 0.85
          ? COLORS.amberText
          : COLORS.greenText,
      badgeBg:
        burnRateRatio > 1
          ? COLORS.redFill
          : burnRateRatio >= 0.85
          ? COLORS.amberFill
          : COLORS.greenFill,
      badgeColor:
        burnRateRatio > 1
          ? COLORS.redText
          : burnRateRatio >= 0.85
          ? COLORS.amberText
          : COLORS.greenText,
    },
  ];

  kpiDefinitions.forEach((kpi, idx) => {
    const rowNum = 7 + idx;
    const labelCell = ws1.getCell(rowNum, 4);
    labelCell.value = kpi.label;
    labelCell.fill = makeFill(idx % 2 === 0 ? COLORS.white : COLORS.zebraLight);
    labelCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.slateLabelText } };
    labelCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    labelCell.border = makeThinBorder();

    const valueCell = ws1.getCell(rowNum, 5);
    valueCell.value = kpi.value as Cell['value'];
    valueCell.numFmt = kpi.numFmt;
    valueCell.fill = makeFill(kpi.valueBg);
    valueCell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: kpi.valueColor } };
    valueCell.alignment = { horizontal: 'right', vertical: 'middle' };
    valueCell.border = makeThinBorder();

    const badgeCell = ws1.getCell(rowNum, 6);
    badgeCell.value = kpi.badge;
    badgeCell.fill = makeFill(kpi.badgeBg);
    badgeCell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: kpi.badgeColor } };
    badgeCell.alignment = { horizontal: 'center', vertical: 'middle' };
    badgeCell.border = makeThinBorder();
  });

  ws1.getRow(12).height = 12;

  // =========================================================================
  // Formal Stacked Balance Sheet Table
  // Part I: Assets / Revenues & Capital Inflows by Category
  // =========================================================================
  ws1.mergeCells(inflowSectionRow, 1, inflowSectionRow, 6);
  ws1.getCell(inflowSectionRow, 1).value =
    'PART I — ASSETS, REVENUES & CAPITAL INFLOWS BY CATEGORY';
  styleRange(ws1, 1, 6, inflowSectionRow, {
    fill: makeFill(COLORS.navyBannerBg),
    font: { size: 10.5, bold: true, color: { argb: COLORS.white } },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
  });
  ws1.getRow(inflowSectionRow).height = 25;

  const inflowHeaders = [
    'Category / Account',
    'Classification',
    'Txn Count',
    'Normalized / Mo',
    'Subtotal Amount',
    '% of Inflows',
  ];
  ws1.getRow(inflowHeaderRow).height = 28;
  inflowHeaders.forEach((h, i) => {
    const c = ws1.getCell(inflowHeaderRow, i + 1);
    c.value = h;
    c.fill = makeFill(COLORS.slateHeaderBg);
    c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.white } };
    c.alignment = {
      horizontal: i === 0 ? 'left' : i <= 2 ? 'center' : 'right',
      vertical: 'middle',
      indent: i === 0 ? 1 : 0,
    };
    c.border = makeThinBorder(COLORS.accentBorder);
  });

  const renderInflowRows =
    revenueCategories.length > 0
      ? revenueCategories
      : [
          {
            label: 'No Revenue or Capital Inflows Recorded',
            classification: 'Credit / Inflow',
            count: 0,
            monthlyUsd: 0,
            totalUsd: 0,
          },
        ];

  renderInflowRows.forEach((cat, idx) => {
    const r = inflowStartRow + idx;
    const zebra = makeFill(idx % 2 === 0 ? COLORS.white : COLORS.zebraLight);
    const subtotalDisplay = convertUsd(cat.totalUsd, rate);
    const monthlyDisplay = convertUsd(cat.monthlyUsd, rate);
    const shareResult =
      totalInflowsDisplay > 0 ? round2((subtotalDisplay / totalInflowsDisplay) * 10000) / 10000 : 0;

    ws1.getRow(r).height = 24;

    const c1 = ws1.getCell(r, 1);
    c1.value = cat.label;
    c1.fill = zebra;
    c1.font = {
      name: 'Calibri',
      size: 10,
      bold: revenueCategories.length > 0,
      italic: revenueCategories.length === 0,
      color: { argb: revenueCategories.length > 0 ? COLORS.darkText : COLORS.slateMutedText },
    };
    c1.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    c1.border = makeThinBorder();

    const c2 = ws1.getCell(r, 2);
    c2.value = cat.classification;
    c2.fill = zebra;
    c2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.greenText } };
    c2.alignment = { horizontal: 'center', vertical: 'middle' };
    c2.border = makeThinBorder();

    const c3 = ws1.getCell(r, 3);
    c3.value = cat.count;
    c3.numFmt = '#,##0';
    c3.fill = zebra;
    c3.font = { name: 'Calibri', size: 10, color: { argb: COLORS.darkText } };
    c3.alignment = { horizontal: 'center', vertical: 'middle' };
    c3.border = makeThinBorder();

    const c4 = ws1.getCell(r, 4);
    c4.value = monthlyDisplay;
    c4.numFmt = currencyFmt;
    c4.fill = zebra;
    c4.font = { name: 'Calibri', size: 10, color: { argb: COLORS.slateLabelText } };
    c4.alignment = { horizontal: 'right', vertical: 'middle' };
    c4.border = makeThinBorder();

    const c5 = ws1.getCell(r, 5);
    c5.value =
      revenueCategories.length > 0 && hasLedgerData
        ? {
            formula: `SUMIFS('Detailed General Ledger'!$F$${ledgerFirstRow}:$F$${ledgerLastDataRow},'Detailed General Ledger'!$D$${ledgerFirstRow}:$D$${ledgerLastDataRow},A${r},'Detailed General Ledger'!$E$${ledgerFirstRow}:$E$${ledgerLastDataRow},"Credit (Inflow)")`,
            result: subtotalDisplay,
          }
        : subtotalDisplay;
    c5.numFmt = currencyFmt;
    c5.fill = zebra;
    c5.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.greenText } };
    c5.alignment = { horizontal: 'right', vertical: 'middle' };
    c5.border = makeThinBorder();

    const c6 = ws1.getCell(r, 6);
    c6.value = {
      formula: `IF($E$${inflowsTotalRow}=0,0,E${r}/$E$${inflowsTotalRow})`,
      result: shareResult,
    };
    c6.numFmt = '0.0%';
    c6.fill = zebra;
    c6.font = { name: 'Calibri', size: 10, color: { argb: COLORS.darkText } };
    c6.alignment = { horizontal: 'right', vertical: 'middle' };
    c6.border = makeThinBorder();
  });

  // TOTAL INFLOWS ROW
  ws1.getRow(inflowsTotalRow).height = 26;
  const inflowTotalBg = makeFill(COLORS.summaryRowBg);
  const accountingBorder = makeAccountingTotalBorder();

  const it1 = ws1.getCell(inflowsTotalRow, 1);
  it1.value = 'TOTAL INFLOWS & CREDITS';
  it1.fill = inflowTotalBg;
  it1.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.darkText } };
  it1.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  it1.border = accountingBorder;

  const it2 = ws1.getCell(inflowsTotalRow, 2);
  it2.value = 'Gross Inflows';
  it2.fill = inflowTotalBg;
  it2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.greenText } };
  it2.alignment = { horizontal: 'center', vertical: 'middle' };
  it2.border = accountingBorder;

  const it3 = ws1.getCell(inflowsTotalRow, 3);
  it3.value = {
    formula: `SUM(C${inflowStartRow}:C${inflowEndRow})`,
    result: revenues.length,
  };
  it3.numFmt = '#,##0';
  it3.fill = inflowTotalBg;
  it3.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.darkText } };
  it3.alignment = { horizontal: 'center', vertical: 'middle' };
  it3.border = accountingBorder;

  const it4 = ws1.getCell(inflowsTotalRow, 4);
  it4.value = {
    formula: `SUM(D${inflowStartRow}:D${inflowEndRow})`,
    result: totalInflowsMonthlyDisplay,
  };
  it4.numFmt = currencyFmt;
  it4.fill = inflowTotalBg;
  it4.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.darkText } };
  it4.alignment = { horizontal: 'right', vertical: 'middle' };
  it4.border = accountingBorder;

  const it5 = ws1.getCell(inflowsTotalRow, 5);
  it5.value = {
    formula: `SUM(E${inflowStartRow}:E${inflowEndRow})`,
    result: totalInflowsDisplay,
  };
  it5.numFmt = currencyFmt;
  it5.fill = inflowTotalBg;
  it5.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.greenText } };
  it5.alignment = { horizontal: 'right', vertical: 'middle' };
  it5.border = accountingBorder;

  const it6 = ws1.getCell(inflowsTotalRow, 6);
  it6.value = {
    formula: `SUM(F${inflowStartRow}:F${inflowEndRow})`,
    result: totalInflowsDisplay > 0 ? 1 : 0,
  };
  it6.numFmt = '0.0%';
  it6.fill = inflowTotalBg;
  it6.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.darkText } };
  it6.alignment = { horizontal: 'right', vertical: 'middle' };
  it6.border = accountingBorder;

  ws1.getRow(inflowsTotalRow + 1).height = 12;

  // =========================================================================
  // Part II: Liabilities / Operating Expenses & Outflows by Category
  // =========================================================================
  ws1.mergeCells(expenseSectionRow, 1, expenseSectionRow, 6);
  ws1.getCell(expenseSectionRow, 1).value =
    'PART II — OPERATING EXPENSES, TECH DEBT & OUTFLOWS BY CATEGORY';
  styleRange(ws1, 1, 6, expenseSectionRow, {
    fill: makeFill(COLORS.navyBannerBg),
    font: { size: 10.5, bold: true, color: { argb: COLORS.white } },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
  });
  ws1.getRow(expenseSectionRow).height = 25;

  const expenseHeaders = [
    'Category / Expense Schedule',
    'Classification',
    'Txn Count',
    'Normalized / Mo',
    'Subtotal Amount',
    '% of Expenses',
  ];
  ws1.getRow(expenseHeaderRow).height = 28;
  expenseHeaders.forEach((h, i) => {
    const c = ws1.getCell(expenseHeaderRow, i + 1);
    c.value = h;
    c.fill = makeFill(COLORS.slateHeaderBg);
    c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.white } };
    c.alignment = {
      horizontal: i === 0 ? 'left' : i <= 2 ? 'center' : 'right',
      vertical: 'middle',
      indent: i === 0 ? 1 : 0,
    };
    c.border = makeThinBorder(COLORS.accentBorder);
  });

  const renderExpenseRows =
    expenseCategories.length > 0
      ? expenseCategories
      : [
          {
            label: 'No Expenses or Outflows Recorded',
            classification: 'Expense / Outflow',
            count: 0,
            monthlyUsd: 0,
            totalUsd: 0,
          },
        ];

  renderExpenseRows.forEach((cat, idx) => {
    const r = expenseStartRow + idx;
    const zebra = makeFill(idx % 2 === 0 ? COLORS.white : COLORS.zebraLight);
    const subtotalDisplay = convertUsd(cat.totalUsd, rate);
    const monthlyDisplay = convertUsd(cat.monthlyUsd, rate);
    const shareResult =
      totalExpensesDisplay > 0 ? round2((subtotalDisplay / totalExpensesDisplay) * 10000) / 10000 : 0;

    ws1.getRow(r).height = 24;

    const c1 = ws1.getCell(r, 1);
    c1.value = cat.label;
    c1.fill = zebra;
    c1.font = {
      name: 'Calibri',
      size: 10,
      bold: expenseCategories.length > 0,
      italic: expenseCategories.length === 0,
      color: { argb: expenseCategories.length > 0 ? COLORS.darkText : COLORS.slateMutedText },
    };
    c1.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    c1.border = makeThinBorder();

    const c2 = ws1.getCell(r, 2);
    c2.value = cat.classification;
    c2.fill = zebra;
    c2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.redText } };
    c2.alignment = { horizontal: 'center', vertical: 'middle' };
    c2.border = makeThinBorder();

    const c3 = ws1.getCell(r, 3);
    c3.value = cat.count;
    c3.numFmt = '#,##0';
    c3.fill = zebra;
    c3.font = { name: 'Calibri', size: 10, color: { argb: COLORS.darkText } };
    c3.alignment = { horizontal: 'center', vertical: 'middle' };
    c3.border = makeThinBorder();

    const c4 = ws1.getCell(r, 4);
    c4.value = monthlyDisplay;
    c4.numFmt = currencyFmt;
    c4.fill = zebra;
    c4.font = { name: 'Calibri', size: 10, color: { argb: COLORS.slateLabelText } };
    c4.alignment = { horizontal: 'right', vertical: 'middle' };
    c4.border = makeThinBorder();

    const c5 = ws1.getCell(r, 5);
    c5.value =
      expenseCategories.length > 0 && hasLedgerData
        ? {
            formula: `ABS(SUMIFS('Detailed General Ledger'!$F$${ledgerFirstRow}:$F$${ledgerLastDataRow},'Detailed General Ledger'!$D$${ledgerFirstRow}:$D$${ledgerLastDataRow},A${r},'Detailed General Ledger'!$E$${ledgerFirstRow}:$E$${ledgerLastDataRow},"Expense (Outflow)"))`,
            result: subtotalDisplay,
          }
        : subtotalDisplay;
    c5.numFmt = currencyFmt;
    c5.fill = zebra;
    c5.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.redText } };
    c5.alignment = { horizontal: 'right', vertical: 'middle' };
    c5.border = makeThinBorder();

    const c6 = ws1.getCell(r, 6);
    c6.value = {
      formula: `IF($E$${expensesTotalRow}=0,0,E${r}/$E$${expensesTotalRow})`,
      result: shareResult,
    };
    c6.numFmt = '0.0%';
    c6.fill = zebra;
    c6.font = { name: 'Calibri', size: 10, color: { argb: COLORS.darkText } };
    c6.alignment = { horizontal: 'right', vertical: 'middle' };
    c6.border = makeThinBorder();
  });

  // TOTAL EXPENSES ROW
  ws1.getRow(expensesTotalRow).height = 26;
  const et1 = ws1.getCell(expensesTotalRow, 1);
  et1.value = 'TOTAL EXPENSES & OUTFLOWS';
  et1.fill = inflowTotalBg;
  et1.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.darkText } };
  et1.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  et1.border = accountingBorder;

  const et2 = ws1.getCell(expensesTotalRow, 2);
  et2.value = 'Total Outflows';
  et2.fill = inflowTotalBg;
  et2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.redText } };
  et2.alignment = { horizontal: 'center', vertical: 'middle' };
  et2.border = accountingBorder;

  const et3 = ws1.getCell(expensesTotalRow, 3);
  et3.value = {
    formula: `SUM(C${expenseStartRow}:C${expenseEndRow})`,
    result: expenses.length,
  };
  et3.numFmt = '#,##0';
  et3.fill = inflowTotalBg;
  et3.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.darkText } };
  et3.alignment = { horizontal: 'center', vertical: 'middle' };
  et3.border = accountingBorder;

  const et4 = ws1.getCell(expensesTotalRow, 4);
  et4.value = {
    formula: `SUM(D${expenseStartRow}:D${expenseEndRow})`,
    result: totalExpensesMonthlyDisplay,
  };
  et4.numFmt = currencyFmt;
  et4.fill = inflowTotalBg;
  et4.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.darkText } };
  et4.alignment = { horizontal: 'right', vertical: 'middle' };
  et4.border = accountingBorder;

  const et5 = ws1.getCell(expensesTotalRow, 5);
  et5.value = {
    formula: `SUM(E${expenseStartRow}:E${expenseEndRow})`,
    result: totalExpensesDisplay,
  };
  et5.numFmt = currencyFmt;
  et5.fill = inflowTotalBg;
  et5.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.redText } };
  et5.alignment = { horizontal: 'right', vertical: 'middle' };
  et5.border = accountingBorder;

  const et6 = ws1.getCell(expensesTotalRow, 6);
  et6.value = {
    formula: `SUM(F${expenseStartRow}:F${expenseEndRow})`,
    result: totalExpensesDisplay > 0 ? 1 : 0,
  };
  et6.numFmt = '0.0%';
  et6.fill = inflowTotalBg;
  et6.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.darkText } };
  et6.alignment = { horizontal: 'right', vertical: 'middle' };
  et6.border = accountingBorder;

  ws1.getRow(expensesTotalRow + 1).height = 12;

  // =========================================================================
  // Part III: Executive Balance Reconciliation Block
  // =========================================================================
  ws1.mergeCells(reconHeaderRow, 1, reconHeaderRow, 6);
  ws1.getCell(reconHeaderRow, 1).value = 'BALANCE SHEET RECONCILIATION & NET POSITION';
  styleRange(ws1, 1, 6, reconHeaderRow, {
    fill: makeFill(COLORS.slateHeaderBg),
    font: { size: 10.5, bold: true, color: { argb: COLORS.white } },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
  });
  ws1.getRow(reconHeaderRow).height = 25;

  const isNetLoss = netBalanceDisplay < 0;
  const netFill = makeFill(isNetLoss ? COLORS.redFill : COLORS.greenFill);
  const netColor = isNetLoss ? COLORS.redText : COLORS.greenText;

  ws1.getRow(netReconRow).height = 28;
  const nr1 = ws1.getCell(netReconRow, 1);
  nr1.value = 'NET BALANCE (INFLOWS LESS OUTFLOWS)';
  nr1.fill = netFill;
  nr1.font = { name: 'Calibri', size: 11, bold: true, color: { argb: netColor } };
  nr1.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  nr1.border = accountingBorder;

  const nr2 = ws1.getCell(netReconRow, 2);
  nr2.value = isNetLoss ? 'Net Operating Loss' : 'Net Surplus';
  nr2.fill = netFill;
  nr2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: netColor } };
  nr2.alignment = { horizontal: 'center', vertical: 'middle' };
  nr2.border = accountingBorder;

  const nr3 = ws1.getCell(netReconRow, 3);
  nr3.value = {
    formula: `C${inflowsTotalRow}+C${expensesTotalRow}`,
    result: revenues.length + expenses.length,
  };
  nr3.numFmt = '#,##0';
  nr3.fill = netFill;
  nr3.font = { name: 'Calibri', size: 11, bold: true, color: { argb: netColor } };
  nr3.alignment = { horizontal: 'center', vertical: 'middle' };
  nr3.border = accountingBorder;

  const nr4 = ws1.getCell(netReconRow, 4);
  nr4.value = {
    formula: `D${inflowsTotalRow}-D${expensesTotalRow}`,
    result: netMonthlyDisplay,
  };
  nr4.numFmt = currencyFmt;
  nr4.fill = netFill;
  nr4.font = { name: 'Calibri', size: 11, bold: true, color: { argb: netColor } };
  nr4.alignment = { horizontal: 'right', vertical: 'middle' };
  nr4.border = accountingBorder;

  const nr5 = ws1.getCell(netReconRow, 5);
  nr5.value = {
    formula: `E${inflowsTotalRow}-E${expensesTotalRow}`,
    result: netBalanceDisplay,
  };
  nr5.numFmt = currencyFmt;
  nr5.fill = netFill;
  nr5.font = { name: 'Calibri', size: 11, bold: true, color: { argb: netColor } };
  nr5.alignment = { horizontal: 'right', vertical: 'middle' };
  nr5.border = accountingBorder;

  const nr6 = ws1.getCell(netReconRow, 6);
  nr6.value = isNetLoss ? 'NET LOSS / DEFICIT' : 'NET SURPLUS';
  nr6.fill = netFill;
  nr6.font = { name: 'Calibri', size: 10, bold: true, color: { argb: netColor } };
  nr6.alignment = { horizontal: 'center', vertical: 'middle' };
  nr6.border = accountingBorder;

  // Closing Treasury Liquidity row (Reserve + Net Ledger Cashflow)
  const isTreasuryNegative = closingTreasuryDisplay < 0;
  const trFill = makeFill(isTreasuryNegative ? COLORS.redFill : COLORS.zebraLight);
  const trColor = isTreasuryNegative ? COLORS.redText : COLORS.darkText;
  ws1.getRow(treasuryReconRow).height = 26;

  const tr1 = ws1.getCell(treasuryReconRow, 1);
  tr1.value = 'PROJECT TREASURY RESERVE + NET CASHFLOW';
  tr1.fill = trFill;
  tr1.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: trColor } };
  tr1.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  tr1.border = accountingBorder;

  const tr2 = ws1.getCell(treasuryReconRow, 2);
  tr2.value = 'Closing Cash Position';
  tr2.fill = trFill;
  tr2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.slateLabelText } };
  tr2.alignment = { horizontal: 'center', vertical: 'middle' };
  tr2.border = accountingBorder;

  const tr3 = ws1.getCell(treasuryReconRow, 3);
  tr3.value = '';
  tr3.fill = trFill;
  tr3.border = accountingBorder;

  const tr4 = ws1.getCell(treasuryReconRow, 4);
  tr4.value = '';
  tr4.fill = trFill;
  tr4.border = accountingBorder;

  const tr5 = ws1.getCell(treasuryReconRow, 5);
  tr5.value = {
    formula: `B11+E${netReconRow}`,
    result: closingTreasuryDisplay,
  };
  tr5.numFmt = currencyFmt;
  tr5.fill = trFill;
  tr5.font = { name: 'Calibri', size: 11, bold: true, color: { argb: trColor } };
  tr5.alignment = { horizontal: 'right', vertical: 'middle' };
  tr5.border = accountingBorder;

  const tr6 = ws1.getCell(treasuryReconRow, 6);
  tr6.value = isTreasuryNegative ? 'INSOLVENT / NEGATIVE' : 'SOLVENT RESERVE';
  tr6.fill = trFill;
  tr6.font = {
    name: 'Calibri',
    size: 9.5,
    bold: true,
    color: { argb: isTreasuryNegative ? COLORS.redText : COLORS.greenText },
  };
  tr6.alignment = { horizontal: 'center', vertical: 'middle' };
  tr6.border = accountingBorder;

  autoFitColumns(
    ws1,
    [32, 20, 14, 28, 22, 22],
    [44, 26, 18, 34, 28, 28],
    [1, 2, 3, 6, inflowSectionRow, expenseSectionRow, reconHeaderRow]
  );

  // =========================================================================
  // WORKSHEET 2: "Detailed General Ledger"
  // =========================================================================
  const ws2 = workbook.addWorksheet('Detailed General Ledger', {
    properties: { tabColor: { argb: COLORS.slateHeaderBg } },
    views: [{ state: 'frozen', ySplit: 4, showGridLines: true }],
  });

  ws2.mergeCells('A1:G2');
  ws2.getCell('A1').value = `${project.name.toUpperCase()} — COMPLETE GENERAL LEDGER REGISTER`;
  styleRange(ws2, 1, 7, 1, {
    fill: makeFill(COLORS.navyBannerBg),
    font: { size: 14, bold: true, color: { argb: COLORS.white } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  });
  styleRange(ws2, 1, 7, 2, {
    fill: makeFill(COLORS.navyBannerBg),
    font: { size: 14, bold: true, color: { argb: COLORS.white } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  });
  ws2.getRow(1).height = 22;
  ws2.getRow(2).height = 22;

  ws2.mergeCells('A3:G3');
  ws2.getCell('A3').value =
    `Stage: ${statusLabel}   |   Currency: ${currency} (${symbol})   |   Transactions: ${ledgerRows.length}   |   Generated: ${generatedTimestamp}`;
  styleRange(ws2, 1, 7, 3, {
    fill: makeFill(COLORS.slateHeaderBg),
    font: { size: 10, bold: true, color: { argb: COLORS.slateMutedText } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  });
  ws2.getRow(3).height = 20;

  // Row 4: Frozen Ledger Column Headers + AutoFilter
  const ledgerHeaders = [
    'S.No / Txn ID',
    'Date',
    'Description / Particulars',
    'Category / Tag',
    'Type',
    'Amount',
    'Running Balance',
  ];
  ws2.getRow(4).height = 30;
  ledgerHeaders.forEach((h, i) => {
    const cell = ws2.getCell(4, i + 1);
    cell.value = h;
    cell.fill = makeFill(COLORS.slateHeaderBg);
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.white } };
    cell.alignment = {
      horizontal: i === 2 ? 'left' : i >= 5 ? 'right' : 'center',
      vertical: 'middle',
      indent: i === 2 ? 1 : 0,
    };
    cell.border = makeThinBorder(COLORS.accentBorder);
  });
  ws2.autoFilter = 'A4:G4';

  if (hasLedgerData) {
    ledgerRows.forEach((item, idx) => {
      const r = ledgerFirstRow + idx;
      const zebraFill = makeFill(idx % 2 === 0 ? COLORS.white : COLORS.zebraLight);
      ws2.getRow(r).height = item.description.length > 52 ? 32 : 24;

      const cId = ws2.getCell(r, 1);
      cId.value = item.txnId;
      cId.fill = zebraFill;
      cId.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.slateLabelText } };
      cId.alignment = { horizontal: 'center', vertical: 'middle' };
      cId.border = makeThinBorder();

      const cDate = ws2.getCell(r, 2);
      cDate.value = item.dateValue;
      cDate.numFmt = 'yyyy-mm-dd';
      cDate.fill = zebraFill;
      cDate.font = { name: 'Calibri', size: 10, color: { argb: COLORS.darkText } };
      cDate.alignment = { horizontal: 'center', vertical: 'middle' };
      cDate.border = makeThinBorder();

      const cDesc = ws2.getCell(r, 3);
      cDesc.value = item.description;
      cDesc.fill = zebraFill;
      cDesc.font = { name: 'Calibri', size: 10, color: { argb: COLORS.darkText } };
      cDesc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 };
      cDesc.border = makeThinBorder();

      const cCat = ws2.getCell(r, 4);
      cCat.value = item.categoryLabel;
      cCat.fill = zebraFill;
      cCat.font = { name: 'Calibri', size: 10, color: { argb: COLORS.darkText } };
      cCat.alignment = { horizontal: 'center', vertical: 'middle' };
      cCat.border = makeThinBorder();

      const cType = ws2.getCell(r, 5);
      cType.value = item.typeLabel;
      cType.fill = zebraFill;
      cType.font = {
        name: 'Calibri',
        size: 10,
        bold: true,
        color: { argb: item.isExpense ? COLORS.redText : COLORS.greenText },
      };
      cType.alignment = { horizontal: 'center', vertical: 'middle' };
      cType.border = makeThinBorder();

      const cAmt = ws2.getCell(r, 6);
      cAmt.value = item.signedAmountDisplay;
      cAmt.numFmt = currencyFmt;
      cAmt.fill = zebraFill;
      cAmt.font = {
        name: 'Calibri',
        size: 10,
        bold: true,
        color: { argb: item.isExpense ? COLORS.redText : COLORS.greenText },
      };
      cAmt.alignment = { horizontal: 'right', vertical: 'middle' };
      cAmt.border = makeThinBorder();

      const isNegRunning = item.runningBalanceDisplay < 0;
      const cBal = ws2.getCell(r, 7);
      cBal.value = {
        formula: r === ledgerFirstRow ? `F${r}` : `G${r - 1}+F${r}`,
        result: item.runningBalanceDisplay,
      };
      cBal.numFmt = currencyFmt;
      cBal.fill = isNegRunning ? makeFill(COLORS.ledgerNegFill) : zebraFill;
      cBal.font = {
        name: 'Calibri',
        size: 10,
        bold: true,
        color: { argb: isNegRunning ? COLORS.redText : COLORS.darkText },
      };
      cBal.alignment = { horizontal: 'right', vertical: 'middle' };
      cBal.border = makeThinBorder();
    });
  } else {
    ws2.getRow(ledgerFirstRow).height = 24;
    const emptyValues = [
      '—',
      '—',
      'No ledger transactions recorded for this project yet.',
      '—',
      '—',
      0,
      0,
    ];
    emptyValues.forEach((v, i) => {
      const c = ws2.getCell(ledgerFirstRow, i + 1);
      c.value = v;
      c.fill = makeFill(COLORS.white);
      c.font = { name: 'Calibri', size: 10, italic: true, color: { argb: COLORS.slateMutedText } };
      c.alignment = {
        horizontal: i === 2 ? 'left' : i >= 5 ? 'right' : 'center',
        vertical: 'middle',
        indent: i === 2 ? 1 : 0,
      };
      if (i >= 5) c.numFmt = currencyFmt;
      c.border = makeThinBorder();
    });
  }

  // Bottom Ledger Summary Footer (Credits, Expenses, Closing Net Balance)
  const footerCreditRow = ledgerLastDataRow + 2;
  const footerExpenseRow = footerCreditRow + 1;
  const footerNetRow = footerExpenseRow + 1;
  ws2.getRow(ledgerLastDataRow + 1).height = 10;

  // Row A: Total Credits / Inflows
  ws2.getRow(footerCreditRow).height = 24;
  ws2.mergeCells(footerCreditRow, 1, footerCreditRow, 5);
  ws2.getCell(footerCreditRow, 1).value = 'TOTAL CREDITS / INFLOWS';
  styleRange(ws2, 1, 5, footerCreditRow, {
    fill: makeFill(COLORS.zebraLight),
    font: { size: 10, bold: true, color: { argb: COLORS.greenText } },
    alignment: { horizontal: 'right', vertical: 'middle' },
    border: makeThinBorder(),
  });
  const fcAmt = ws2.getCell(footerCreditRow, 6);
  fcAmt.value = hasLedgerData
    ? {
        formula: `SUMIF(E${ledgerFirstRow}:E${ledgerLastDataRow},"Credit (Inflow)",F${ledgerFirstRow}:F${ledgerLastDataRow})`,
        result: totalInflowsDisplay,
      }
    : 0;
  fcAmt.numFmt = currencyFmt;
  fcAmt.fill = makeFill(COLORS.zebraLight);
  fcAmt.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: COLORS.greenText } };
  fcAmt.alignment = { horizontal: 'right', vertical: 'middle' };
  fcAmt.border = makeThinBorder();

  const fcBal = ws2.getCell(footerCreditRow, 7);
  fcBal.value = `${revenues.length} Credit${revenues.length === 1 ? '' : 's'}`;
  fcBal.fill = makeFill(COLORS.zebraLight);
  fcBal.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: COLORS.slateLabelText } };
  fcBal.alignment = { horizontal: 'center', vertical: 'middle' };
  fcBal.border = makeThinBorder();

  // Row B: Total Expenses / Outflows
  ws2.getRow(footerExpenseRow).height = 24;
  ws2.mergeCells(footerExpenseRow, 1, footerExpenseRow, 5);
  ws2.getCell(footerExpenseRow, 1).value = 'TOTAL EXPENSES / OUTFLOWS';
  styleRange(ws2, 1, 5, footerExpenseRow, {
    fill: makeFill(COLORS.white),
    font: { size: 10, bold: true, color: { argb: COLORS.redText } },
    alignment: { horizontal: 'right', vertical: 'middle' },
    border: makeThinBorder(),
  });
  const feAmt = ws2.getCell(footerExpenseRow, 6);
  feAmt.value = hasLedgerData
    ? {
        formula: `SUMIF(E${ledgerFirstRow}:E${ledgerLastDataRow},"Expense (Outflow)",F${ledgerFirstRow}:F${ledgerLastDataRow})`,
        result: -totalExpensesDisplay,
      }
    : 0;
  feAmt.numFmt = currencyFmt;
  feAmt.fill = makeFill(COLORS.white);
  feAmt.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: COLORS.redText } };
  feAmt.alignment = { horizontal: 'right', vertical: 'middle' };
  feAmt.border = makeThinBorder();

  const feBal = ws2.getCell(footerExpenseRow, 7);
  feBal.value = `${expenses.length} Expense${expenses.length === 1 ? '' : 's'}`;
  feBal.fill = makeFill(COLORS.white);
  feBal.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: COLORS.slateLabelText } };
  feBal.alignment = { horizontal: 'center', vertical: 'middle' };
  feBal.border = makeThinBorder();

  // Row C: Closing Net Balance (Double Accounting Underline)
  const closingBalance = hasLedgerData
    ? ledgerRows[ledgerRows.length - 1].runningBalanceDisplay
    : 0;
  const isClosingLoss = closingBalance < 0;
  const closingFill = makeFill(isClosingLoss ? COLORS.redFill : COLORS.greenFill);
  const closingColor = isClosingLoss ? COLORS.redText : COLORS.greenText;

  ws2.getRow(footerNetRow).height = 28;
  ws2.mergeCells(footerNetRow, 1, footerNetRow, 5);
  ws2.getCell(footerNetRow, 1).value = isClosingLoss
    ? 'CLOSING NET BALANCE (NET DEFICIT)'
    : 'CLOSING NET BALANCE (NET SURPLUS)';
  styleRange(ws2, 1, 5, footerNetRow, {
    fill: closingFill,
    font: { size: 11, bold: true, color: { argb: closingColor } },
    alignment: { horizontal: 'right', vertical: 'middle' },
    border: accountingBorder,
  });

  const fnAmt = ws2.getCell(footerNetRow, 6);
  fnAmt.value = hasLedgerData
    ? {
        formula: `SUM(F${ledgerFirstRow}:F${ledgerLastDataRow})`,
        result: closingBalance,
      }
    : 0;
  fnAmt.numFmt = currencyFmt;
  fnAmt.fill = closingFill;
  fnAmt.font = { name: 'Calibri', size: 11, bold: true, color: { argb: closingColor } };
  fnAmt.alignment = { horizontal: 'right', vertical: 'middle' };
  fnAmt.border = accountingBorder;

  const fnBal = ws2.getCell(footerNetRow, 7);
  fnBal.value = hasLedgerData
    ? {
        formula: `G${ledgerLastDataRow}`,
        result: closingBalance,
      }
    : 0;
  fnBal.numFmt = currencyFmt;
  fnBal.fill = closingFill;
  fnBal.font = { name: 'Calibri', size: 11, bold: true, color: { argb: closingColor } };
  fnBal.alignment = { horizontal: 'right', vertical: 'middle' };
  fnBal.border = accountingBorder;

  autoFitColumns(
    ws2,
    [12, 16, 38, 22, 18, 20, 22],
    [16, 18, 56, 28, 22, 26, 28],
    [1, 2, 3]
  );

  const sanitizedName = sanitizeProjectFilenamePart(project.name);
  const filename = `DevSpend_${sanitizedName}_Balance_Sheet_${todayYmd}.xlsx`;
  const rawBuffer = await workbook.xlsx.writeBuffer();
  const buffer =
    rawBuffer instanceof ArrayBuffer
      ? rawBuffer
      : Uint8Array.from(rawBuffer as unknown as ArrayLike<number>).buffer;

  return { buffer, filename };
}

/**
 * Generates the Balance Sheet Excel workbook and triggers a file download
 * compatible with desktop browsers, mobile browsers, and Capacitor Android WebViews.
 */
export async function downloadBalanceSheetExcel(
  params: BalanceSheetExportParams
): Promise<string> {
  const { buffer, filename } = await generateBalanceSheetWorkbookBuffer(params);
  const blob = new Blob([buffer], { type: XLSX_MIME_TYPE });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Delay revocation slightly so mobile browsers/WebViews finish starting the download
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);

  return filename;
}
