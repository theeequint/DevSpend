import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  Bug,
  AlertTriangle,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Flame,
} from 'lucide-react';
import {
  useActiveProject,
  useProjectDebugSessions,
  useSpendStore,
} from '../../store/useSpendStore';
import {
  formatDuration,
  formatCurrency,
  formatDate,
  formatMinutes,
  safeDiv,
  safeNum,
} from '../../utils/formatters';
import { DebugSeverity } from '../../types';

export const DebugTimerWidget: React.FC = () => {
  const activeProject = useActiveProject();
  const debugSessions = useProjectDebugSessions(activeProject?.id ?? '');
  const {
    activeDebugTimer,
    startDebugTimer,
    pauseDebugTimer,
    resumeDebugTimer,
    stopAndLogDebugTimer,
    tickDebugTimer,
    logManualDebugSession,
    addExpense,
  } = useSpendStore();

  const hourlyRate = activeProject?.hourlyDevRate ?? 60;
  const currency = activeProject?.currency ?? 'USD';

  // Manual session inputs
  const [description, setDescription] = useState('');
  const [component, setComponent] = useState('');
  const [severity, setSeverity] = useState<DebugSeverity>('medium');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualMinutes, setManualMinutes] = useState<number>(30);
  const [showHistory, setShowHistory] = useState(false);

  // Set up timer tick interval when timer is running
  useEffect(() => {
    let interval: any = null;
    if (activeDebugTimer?.running) {
      interval = setInterval(() => {
        tickDebugTimer();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeDebugTimer?.running, tickDebugTimer]);

  // Real-time monetary burn calculation
  const elapsedSeconds = activeDebugTimer?.elapsedSeconds ?? 0;
  const elapsedHours = elapsedSeconds / 3600;
  const currentCost = elapsedHours * hourlyRate;

  // Monthly debug spend in this project
  const totalDebugCostThisMonth = debugSessions.reduce(
    (sum, s) => sum + safeNum(s.calculatedCost),
    0
  );

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    startDebugTimer({
      projectId: activeProject?.id ?? '',
      description: description.trim(),
      component: component.trim() || 'General Codebase',
      severity,
    });
    setDescription('');
    setComponent('');
  };

  const handleLogManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || manualMinutes <= 0) return;

    const calculatedCost = (manualMinutes / 60) * hourlyRate;
    const nowIso = new Date().toISOString();

    logManualDebugSession({
      projectId: activeProject?.id ?? '',
      bugDescription: description.trim(),
      relatedComponent: component.trim() || 'General Codebase',
      durationMinutes: manualMinutes,
      calculatedCost,
      timestamp: nowIso,
      severity,
    });

    // Also auto-append to expenses
    addExpense({
      projectId: activeProject?.id ?? '',
      title: description.trim(),
      vendor: 'Self-Time',
      category: 'debugging_tech_debt',
      billingCycle: 'time_logged',
      amount: calculatedCost,
      hoursLogged: manualMinutes / 60,
      usageMetric: `${manualMinutes} mins @ $${hourlyRate}/hr`,
      date: nowIso,
      isEssential: false,
      isAiOptimized: false,
      notes: `Manual debug log for: ${component || 'Codebase'}`,
    });

    setDescription('');
    setComponent('');
    setIsManualModalOpen(false);
  };

  const severityBadgeClass: Record<DebugSeverity, string> = {
    low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    critical: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };

  return (
    <div className="card p-5 border-zinc-700/60 bg-gradient-to-b from-[#15151a] to-[#121215] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Bug size={16} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              Hidden Debugging & Tech-Debt Tax Tracker
            </h3>
            <p className="text-xs text-zinc-400">
              Your developer time costs <span className="text-zinc-200 font-mono">${hourlyRate}/hr</span>. Track time lost to bugs in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
              Month Debounced
            </span>
            <span className="num font-bold text-xs text-amber-400">
              {formatCurrency(totalDebugCostThisMonth, currency)}
            </span>
          </div>
          <button
            onClick={() => setIsManualModalOpen(!isManualModalOpen)}
            className="px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-medium border border-zinc-700 transition-colors"
          >
            {isManualModalOpen ? 'Cancel Manual' : '+ Manual Log'}
          </button>
        </div>
      </div>

      {/* Manual log form if open */}
      {isManualModalOpen && (
        <form
          onSubmit={handleLogManual}
          className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-700 space-y-3 animate-fade-in"
        >
          <div className="text-xs font-semibold text-zinc-200">
            Log Past Bug Fixing Time Manually
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              required
              placeholder="Bug description (e.g. Auth Token Expiry Bug)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input text-xs"
            />
            <input
              type="text"
              placeholder="Component (e.g. Supabase Auth)"
              value={component}
              onChange={(e) => setComponent(e.target.value)}
              className="input text-xs"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="5"
                step="5"
                placeholder="Minutes"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(parseInt(e.target.value) || 0)}
                className="input num text-xs w-24"
              />
              <span className="text-xs text-zinc-400 font-mono shrink-0">
                = {formatCurrency((manualMinutes / 60) * hourlyRate, currency)}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400">Severity:</span>
              {(['low', 'medium', 'critical'] as DebugSeverity[]).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border capitalize ${
                    severity === s
                      ? severityBadgeClass[s]
                      : 'border-zinc-800 text-zinc-500'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button type="submit" className="btn-primary text-xs py-1 px-3">
              Append to Ledger
            </button>
          </div>
        </form>
      )}

      {/* Active Running Timer vs Idle State */}
      {activeDebugTimer ? (
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-rose-500/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
                  {activeDebugTimer.running ? 'Live Bug Clock Running' : 'Timer Paused'}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono border uppercase ${
                    severityBadgeClass[activeDebugTimer.severity]
                  }`}
                >
                  {activeDebugTimer.severity}
                </span>
              </div>
              <h4 className="text-sm font-medium text-zinc-100">
                {activeDebugTimer.description || 'Active Bug Fixing Session'}
              </h4>
              <p className="text-xs text-zinc-400 font-mono">
                Component: {activeDebugTimer.component}
              </p>
            </div>

            {/* Timer digits & cost ticker */}
            <div className="flex items-center gap-4 bg-black/40 border border-zinc-800 p-3 rounded-lg">
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                  Elapsed Time
                </span>
                <div className="num font-bold text-lg text-zinc-100 font-mono">
                  {formatDuration(elapsedSeconds)}
                </div>
              </div>

              <div className="w-px h-8 bg-zinc-800" />

              <div className="text-right">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                  Cost Ticker
                </span>
                <div className="num font-bold text-lg text-rose-400 font-mono animate-number-tick">
                  {formatCurrency(currentCost, currency)}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
            {activeDebugTimer.running ? (
              <button
                onClick={pauseDebugTimer}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Pause size={13} /> Pause Timer
              </button>
            ) : (
              <button
                onClick={resumeDebugTimer}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Play size={13} /> Resume
              </button>
            )}

            <button
              onClick={stopAndLogDebugTimer}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-lg shadow-rose-900/30"
            >
              <Square size={13} /> Stop & Append to Ledger
            </button>
          </div>
        </div>
      ) : (
        /* Idle Timer starter form */
        <form
          onSubmit={handleStart}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <input
            type="text"
            required
            placeholder="What bug are you fixing right now? (e.g. Auth Race Condition, CORS Egress)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input text-xs flex-1"
          />
          <input
            type="text"
            placeholder="Component (e.g. Next.js API / Stripe Webhook)"
            value={component}
            onChange={(e) => setComponent(e.target.value)}
            className="input text-xs sm:w-48"
          />
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as DebugSeverity)}
            className="select text-xs sm:w-28"
          >
            <option value="low">Low Severity</option>
            <option value="medium">Medium</option>
            <option value="critical">Critical</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-md shadow-rose-900/20"
          >
            <Play size={13} /> Start Timer
          </button>
        </form>
      )}

      {/* Historical Sessions Toggle */}
      {debugSessions.length > 0 && (
        <div className="pt-1">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-mono"
          >
            {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {showHistory ? 'Hide' : 'Show'} Recent Bug Sessions ({debugSessions.length})
          </button>

          {showHistory && (
            <div className="mt-2.5 divide-y divide-zinc-800/80 rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden text-xs">
              {debugSessions.slice(-4).reverse().map((sess) => (
                <div
                  key={sess.id}
                  className="p-2.5 flex items-center justify-between gap-2 hover:bg-zinc-800/40"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="font-medium text-zinc-200 truncate flex items-center gap-2">
                      <span>{sess.bugDescription}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono border uppercase ${
                          severityBadgeClass[sess.severity]
                        }`}
                      >
                        {sess.severity}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono">
                      Component: {sess.relatedComponent} • {formatDate(sess.timestamp)}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="num font-bold text-amber-400 block">
                      {formatCurrency(sess.calculatedCost, currency)}
                    </span>
                    <span className="num text-[11px] text-zinc-500 font-mono">
                      {formatMinutes(sess.durationMinutes)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DebugTimerWidget;
