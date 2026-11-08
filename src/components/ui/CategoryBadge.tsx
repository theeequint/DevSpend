import React from 'react';
import { ExpenseCategory } from '../../types';
import { CATEGORY_META } from '../../utils/formatters';

interface CategoryBadgeProps {
  category: ExpenseCategory;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, size = 'sm' }) => {
  const meta = CATEGORY_META[category] || {
    label: category,
    color: '#a1a1aa',
    bgColor: 'bg-zinc-500/10',
    textColor: 'text-zinc-400',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-medium border border-zinc-700/60 ${meta.bgColor} ${meta.textColor} ${sizeClasses}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: meta.color }}
      />
      <span className="truncate">{meta.label}</span>
    </span>
  );
};

export default CategoryBadge;
