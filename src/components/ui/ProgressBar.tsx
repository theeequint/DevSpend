import React from 'react';
import { clamp } from '../../utils/formatters';

interface ProgressBarProps {
  value: number; // 0 to 100
  color?: string; // hex color or tailwind prefix
  label?: string;
  sublabel?: string;
  showPercent?: boolean;
  height?: 'xs' | 'sm' | 'md';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = '#8b5cf6',
  label,
  sublabel,
  showPercent = true,
  height = 'sm',
}) => {
  const percentage = clamp(value, 0, 100);

  const heightClass = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2.5',
  }[height];

  const isHex = color.startsWith('#');

  return (
    <div className="w-full space-y-1">
      {(label || showPercent || sublabel) && (
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-medium text-zinc-300 truncate">{label}</span>
          <div className="flex items-center gap-2 shrink-0">
            {sublabel && <span className="text-zinc-500">{sublabel}</span>}
            {showPercent && <span className="font-mono tabular-nums text-zinc-300">{percentage.toFixed(1)}%</span>}
          </div>
        </div>
      )}
      <div className={`w-full bg-zinc-800/80 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${!isHex ? color : ''}`}
          style={{
            width: `${percentage}%`,
            backgroundColor: isHex ? color : undefined,
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
