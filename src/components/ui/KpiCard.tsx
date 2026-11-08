// ============================================================
// DevSpend — KpiCard: reusable KPI metric card
// ============================================================

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

type KpiColor = 'default' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan';

interface TrendProps {
  direction: 'up' | 'down' | 'neutral';
  label: string;
}

interface KpiCardProps {
  title: string;
  value: string;
  subvalue?: string;
  trend?: TrendProps;
  color?: KpiColor;
  icon?: React.ReactNode;
  tooltip?: string;
  loading?: boolean;
}

const COLOR_MAP: Record<KpiColor, { accent: string; iconBg: string; border: string }> = {
  default:  { accent: 'text-zinc-100',    iconBg: 'bg-zinc-700/50',       border: 'border-zinc-700/60' },
  emerald:  { accent: 'text-emerald-400', iconBg: 'bg-emerald-500/10',    border: 'border-emerald-500/20' },
  amber:    { accent: 'text-amber-400',   iconBg: 'bg-amber-500/10',      border: 'border-amber-500/20' },
  rose:     { accent: 'text-rose-400',    iconBg: 'bg-rose-500/10',       border: 'border-rose-500/20' },
  violet:   { accent: 'text-violet-400',  iconBg: 'bg-violet-500/10',     border: 'border-violet-500/20' },
  cyan:     { accent: 'text-cyan-400',    iconBg: 'bg-cyan-500/10',       border: 'border-cyan-500/20' },
};

const TrendIcon: React.FC<{ direction: TrendProps['direction']; label: string }> = ({
  direction,
  label,
}) => {
  if (direction === 'up') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
        <TrendingUp size={12} />
        {label}
      </span>
    );
  }
  if (direction === 'down') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-rose-400">
        <TrendingDown size={12} />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
      <Minus size={12} />
      {label}
    </span>
  );
};

const SkeletonPulse: React.FC = () => (
  <div className="animate-pulse space-y-2">
    <div className="h-7 w-3/4 rounded bg-zinc-700/60" />
    <div className="h-4 w-1/2 rounded bg-zinc-700/40" />
  </div>
);

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subvalue,
  trend,
  color = 'default',
  icon,
  tooltip,
  loading = false,
}) => {
  const { accent, iconBg, border } = COLOR_MAP[color];

  return (
    <div
      className={`kpi-card relative flex flex-col gap-3 rounded-xl border ${border} bg-zinc-900/80 p-4 backdrop-blur-sm transition-all duration-200 hover:bg-zinc-900`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon && (
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg} ${accent}`}>
              {icon}
            </span>
          )}
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            {title}
          </span>
        </div>
        {tooltip && (
          <div className="group relative">
            <Info size={13} className="cursor-help text-zinc-600 hover:text-zinc-400" />
            <div className="pointer-events-none absolute right-0 top-5 z-20 w-52 rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-xs text-zinc-300 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
              {tooltip}
            </div>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="min-h-[2.5rem]">
        {loading ? (
          <SkeletonPulse />
        ) : (
          <>
            <p className={`num text-2xl font-bold leading-tight tracking-tight ${accent}`}>
              {value}
            </p>
            {subvalue && (
              <p className="mt-0.5 text-xs text-zinc-400">{subvalue}</p>
            )}
          </>
        )}
      </div>

      {/* Trend */}
      {!loading && trend && (
        <div className="mt-auto">
          <TrendIcon direction={trend.direction} label={trend.label} />
        </div>
      )}
    </div>
  );
};

export default KpiCard;
