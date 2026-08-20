import React from 'react';
import { FieldCategory } from '../../types';

interface CategoryBadgeProps {
  category: FieldCategory | string;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className = '' }) => {
  const normalized = category.toLowerCase();

  let styles = 'bg-slate-800/60 text-slate-400 border-slate-700/50';

  if (normalized === 'identity') {
    styles = 'bg-sky-950/30 text-sky-300 border-sky-800/40';
  } else if (normalized === 'skills') {
    styles = 'bg-indigo-950/30 text-indigo-300 border-indigo-800/40';
  } else if (normalized === 'experience') {
    styles = 'bg-cyan-950/30 text-cyan-300 border-cyan-800/40';
  } else if (normalized === 'education') {
    styles = 'bg-purple-950/30 text-purple-300 border-purple-800/40';
  } else if (normalized === 'credentials') {
    styles = 'bg-teal-950/30 text-teal-300 border-teal-800/40';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border font-medium whitespace-nowrap shrink-0 ${styles} ${className}`}
    >
      {category}
    </span>
  );
};
