// ============================================================
// DevSpend — Top-Right Data Portability & Export Dropdown
// Contextual JSON backups, CSV export & seed data restoration
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  FileSpreadsheet,
  FileJson,
  ChevronDown,
  Database,
  Check,
} from 'lucide-react';
import { useSpendStore, useActiveProject, useProjectExpenses } from '../../store/useSpendStore';
import {
  exportToJSON,
  readJSONFile,
  exportToCSV,
  normalizeToMonthly,
} from '../../utils/formatters';

interface DataExportDropdownProps {
  className?: string;
}

export const DataExportDropdown: React.FC<DataExportDropdownProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProject = useActiveProject();
  const expenses = useProjectExpenses(activeProject?.id ?? '');
  const { exportFullState, importFullState, resetToSeedData } = useSpendStore();

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleExportJSON = () => {
    const state = exportFullState();
    exportToJSON(state, `devspend-backup-${Date.now()}.json`);
    setIsOpen(false);
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      alert('No expense items found to export for the active project.');
      return;
    }
    const rows = expenses.map((e) => ({
      ID: e.id,
      Title: e.title,
      Vendor: e.vendor,
      Category: e.category,
      BillingCycle: e.billingCycle,
      Amount: e.amount,
      NormalizedMonthly: normalizeToMonthly(e.amount, e.billingCycle).toFixed(2),
      Date: e.date,
      IsEssential: e.isEssential,
      IsAiOptimized: e.isAiOptimized,
      Notes: e.notes ?? '',
    }));
    exportToCSV(rows, `${activeProject?.slug || 'devspend'}-ledger.csv`);
    setIsOpen(false);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = (await readJSONFile(file)) as any;
      if (data && (data.projects || data.expenses)) {
        importFullState(data);
        alert('DevSpend backup imported successfully!');
      } else {
        alert('Invalid DevSpend JSON backup schema.');
      }
    } catch {
      alert('Failed to parse the selected JSON file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsOpen(false);
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Reset all DevSpend data to default demo projects? Current edits will be replaced.'
      )
    ) {
      resetToSeedData();
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 lg:h-9 px-2 lg:px-2.5 flex items-center gap-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
        title="Data Portability, Backups & CSV Export"
      >
        <Download size={13} className="text-cyan-400 shrink-0" />
        <span className="hidden xl:inline">Export</span>
        <ChevronDown size={10} className="text-zinc-500 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-[#121215] border border-zinc-700 shadow-2xl p-1.5 z-50 space-y-1 animate-in fade-in duration-150 font-sans text-xs">
          <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 border-b border-zinc-800/80">
            Data Portability Vault
          </div>

          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <FileJson size={14} className="text-violet-400 shrink-0" />
            <div>
              <div className="font-semibold">Export JSON State</div>
              <div className="text-[10px] text-zinc-400">Full backup of projects & ledger</div>
            </div>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-emerald-400 shrink-0" />
            <div>
              <div className="font-semibold">Export Ledger CSV</div>
              <div className="text-[10px] text-zinc-400">Accountant-ready spreadsheet</div>
            </div>
          </button>

          {/* Import JSON */}
          <label className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer">
            <Upload size={14} className="text-cyan-400 shrink-0" />
            <div>
              <div className="font-semibold">Import JSON State</div>
              <div className="text-[10px] text-zinc-400">Restore from saved snapshot</div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          {/* Reset Demo */}
          <div className="pt-1 border-t border-zinc-800/80">
            <button
              onClick={handleReset}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} className="shrink-0" />
              <div className="font-medium text-[11px]">Reset to Demo State</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataExportDropdown;
