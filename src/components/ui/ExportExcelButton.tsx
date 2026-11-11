// ============================================================
// DevSpend — Executive Excel Balance Sheet (.xlsx) Export Button
// Only renders when a project is active; touch-friendly (>= 44px).
// ============================================================

import React, { useState } from 'react';
import { FileSpreadsheet, Loader2, Check } from 'lucide-react';
import {
  useActiveProject,
  useNetMonthlyBurn,
  useProjectExpenses,
  useProjectRevenues,
} from '../../store/useSpendStore';
import { downloadBalanceSheetExcel } from '../../utils/exportBalanceSheetExcel';

interface ExportExcelButtonProps {
  label?: string;
  className?: string;
}

export const ExportExcelButton: React.FC<ExportExcelButtonProps> = ({
  label = 'Export Balance Sheet (.xlsx)',
  className = '',
}) => {
  const activeProject = useActiveProject();
  const expenses = useProjectExpenses(activeProject?.id ?? '');
  const revenues = useProjectRevenues(activeProject?.id ?? '');
  const { grossBurn, monthlyRevenue, netBurn, isDefaultAlive } = useNetMonthlyBurn(
    activeProject?.id
  );

  const [isExporting, setIsExporting] = useState(false);
  const [justExported, setJustExported] = useState(false);

  if (!activeProject) return null;

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setJustExported(false);

    try {
      await downloadBalanceSheetExcel({
        project: activeProject,
        expenses,
        revenues,
        currency: activeProject.currency ?? 'USD',
        summary: {
          grossBurn,
          monthlyRevenue,
          netBurn,
          isDefaultAlive,
        },
      });
      setJustExported(true);
      setTimeout(() => setJustExported(false), 2000);
    } catch (error) {
      console.error('Excel Balance Sheet generation failed:', error);
      alert('Failed to generate Excel Balance Sheet. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className={`w-full sm:w-auto min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all border shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-wait active:scale-[0.98] ${
        justExported
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:border-emerald-400/50'
      } ${className}`}
      title={`Download executive Excel Balance Sheet & General Ledger for ${activeProject.name} (${activeProject.currency})`}
    >
      {isExporting ? (
        <Loader2 size={14} className="animate-spin text-emerald-300 shrink-0" />
      ) : justExported ? (
        <Check size={14} className="text-emerald-400 shrink-0" />
      ) : (
        <FileSpreadsheet size={14} className="text-emerald-400 shrink-0" />
      )}
      <span className="whitespace-nowrap">
        {isExporting ? 'Generating .xlsx...' : justExported ? 'Downloaded!' : label}
      </span>
    </button>
  );
};

export default ExportExcelButton;
