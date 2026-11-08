// ============================================================
// DevSpend — Mobile Floating Live Debug Timer Island
// Pinned Dynamic Island just above the bottom navigation (< 768px)
// ============================================================

import React from 'react';
import { Bug, Square, Play, Pause } from 'lucide-react';
import { useSpendStore, useActiveProject } from '../../store/useSpendStore';
import { formatCurrency, formatDuration } from '../../utils/formatters';

export const MobileDebugTimerBar: React.FC = () => {
  const {
    activeDebugTimer,
    pauseDebugTimer,
    resumeDebugTimer,
    stopAndLogDebugTimer,
    setActiveView,
  } = useSpendStore();

  const activeProject = useActiveProject();

  if (!activeDebugTimer) return null;

  const currency = activeProject?.currency ?? 'USD';
  const hourlyRate = activeProject?.hourlyDevRate ?? 60;
  const elapsedSeconds = activeDebugTimer.elapsedSeconds ?? 0;
  const currentCost = (elapsedSeconds / 3600) * hourlyRate;

  return (
    <div className="md:hidden fixed left-3 right-3 bottom-20 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="bg-[#121215]/95 backdrop-blur-xl border border-rose-500/40 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-2 shadow-rose-950/40">
        {/* Left: Pulsing Bug & Ticking Timer */}
        <div
          onClick={() => setActiveView('ledger')}
          className="flex items-center gap-2 flex-1 cursor-pointer truncate"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 animate-pulse">
            <Bug size={15} />
          </div>
          <div className="truncate font-mono">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
              <span>{formatDuration(elapsedSeconds)}</span>
              <span className="text-[10px] text-zinc-400 font-normal">
                ({formatCurrency(currentCost, currency)})
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 truncate">
              {activeDebugTimer.description || 'Active Bug Session'}
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {activeDebugTimer.running ? (
            <button
              type="button"
              onClick={pauseDebugTimer}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Pause Timer"
            >
              <Pause size={13} />
            </button>
          ) : (
            <button
              type="button"
              onClick={resumeDebugTimer}
              className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors cursor-pointer"
              title="Resume Timer"
            >
              <Play size={13} />
            </button>
          )}

          <button
            type="button"
            onClick={stopAndLogDebugTimer}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            title="Stop & Log Session to Ledger"
          >
            <Square size={11} className="fill-current" />
            <span>Stop & Log</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileDebugTimerBar;
