import React from 'react';
import { ProjectStatus } from '../../types';
import { projectStatusMeta } from '../../utils/formatters';

interface StatusBadgeProps {
  status: ProjectStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const meta = projectStatusMeta(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-medium border ${meta.color} ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 animate-pulse" />
      <span className="capitalize">{meta.label}</span>
    </span>
  );
};

export default StatusBadge;
