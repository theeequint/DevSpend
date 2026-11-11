// ============================================================
// DevSpend — Project & Ledger Deletion Confirmation Modal
// Cascades removal across expenses, debug sessions, and audits
// ============================================================

import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert, ArrowRight } from 'lucide-react';
import { useSpendStore } from '../../store/useSpendStore';
import { formatCurrency } from '../../utils/formatters';

export const DeleteProjectModal: React.FC = () => {
  const {
    projects,
    expenses,
    debugSessions,
    auditReports,
    deleteProjectModalOpen,
    projectToDeleteId,
    setDeleteProjectModal,
    deleteProject,
  } = useSpendStore();

  const [confirmSlug, setConfirmSlug] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!deleteProjectModalOpen || !projectToDeleteId) return null;

  const project = projects.find((p) => p.id === projectToDeleteId);
  if (!project) return null;

  const projectExpenses = expenses.filter((e) => e.projectId === project.id);
  const totalExpenseSum = projectExpenses.reduce((sum, e) => sum + e.amount, 0);

  const projectDebugs = debugSessions.filter((d) => d.projectId === project.id);
  const totalDebugCost = projectDebugs.reduce((sum, d) => sum + d.calculatedCost, 0);

  const projectAudits = auditReports.filter((a) => a.projectId === project.id);

  const requiresSlugMatch = projectExpenses.length > 0 || projectDebugs.length > 0;
  const isConfirmed = !requiresSlugMatch || confirmSlug.trim().toLowerCase() === project.slug.toLowerCase();

  const handleDelete = () => {
    if (!isConfirmed) return;
    setIsDeleting(true);
    try {
      deleteProject(project.id);
      setConfirmSlug('');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmSlug('');
    setDeleteProjectModal(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#121215] border border-rose-900/60 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-rose-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-100">
                Delete Project & Ledger Data
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                Permanent cascade deletion: <span className="text-rose-300 font-bold">{project.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Warning: This action cannot be undone</p>
              <p className="text-[11px] text-rose-300/90 leading-relaxed">
                Deleting this project permanently purges the ledger entries, time-tracking debug logs, and AI cost optimization audit records from local storage.
              </p>
            </div>
          </div>

          {/* Cascading Destruction Breakdown */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-2.5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Cascading Purge Inventory
            </h4>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-2.5 rounded-md bg-zinc-900 border border-zinc-800 text-center">
                <span className="block text-[10px] font-mono text-zinc-500">Expenses</span>
                <span className="text-sm font-mono font-bold text-zinc-200">
                  {projectExpenses.length}
                </span>
                <span className="block text-[10px] font-mono text-zinc-400 mt-0.5">
                  {formatCurrency(totalExpenseSum, project.currency)}
                </span>
              </div>

              <div className="p-2.5 rounded-md bg-zinc-900 border border-zinc-800 text-center">
                <span className="block text-[10px] font-mono text-zinc-500">Debug Sessions</span>
                <span className="text-sm font-mono font-bold text-zinc-200">
                  {projectDebugs.length}
                </span>
                <span className="block text-[10px] font-mono text-zinc-400 mt-0.5">
                  {formatCurrency(totalDebugCost, project.currency)}
                </span>
              </div>

              <div className="p-2.5 rounded-md bg-zinc-900 border border-zinc-800 text-center">
                <span className="block text-[10px] font-mono text-zinc-500">Audit Reports</span>
                <span className="text-sm font-mono font-bold text-zinc-200">
                  {projectAudits.length}
                </span>
                <span className="block text-[10px] font-mono text-zinc-400 mt-0.5">
                  {projectAudits.reduce((acc, a) => acc + a.recommendations.length, 0)} recs
                </span>
              </div>
            </div>
          </div>

          {/* Slug confirmation input if non-empty */}
          {requiresSlugMatch && (
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-zinc-400">
                To confirm deletion, type the project slug{' '}
                <span className="font-bold text-zinc-200 select-all font-mono">
                  {project.slug}
                </span>{' '}
                below:
              </label>
              <input
                type="text"
                placeholder={project.slug}
                value={confirmSlug}
                onChange={(e) => setConfirmSlug(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={handleClose}
              disabled={isDeleting}
              className="px-4 py-2 rounded-md border border-zinc-800 hover:bg-zinc-800 text-xs text-zinc-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isConfirmed || isDeleting}
              className="px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-xs font-medium text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Purging...' : 'Permanently Delete Project'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
