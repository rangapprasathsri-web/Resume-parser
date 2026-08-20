import React from 'react';
import { Sparkles, FileSearch } from 'lucide-react';
import { ScorerType } from '../../types';

interface ScorerBadgeProps {
  scorer: ScorerType;
  className?: string;
}

export const ScorerBadge: React.FC<ScorerBadgeProps> = ({
  scorer = 'llm',
  className = '',
}) => {
  if (scorer === 'llm') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-subtle text-accent text-xs font-mono font-medium border border-accent/20 transition-colors ${className}`}
        title="Scored by generative neural model with exact evidence citation grounding"
      >
        <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span>Scored by AI</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fallback text-fallback text-xs font-mono font-medium border border-strong transition-colors ${className}`}
      title="Keyword search and rule-based heuristic extraction fallback"
    >
      <FileSearch className="w-3.5 h-3.5" strokeWidth={1.75} />
      <span>Keyword fallback</span>
    </div>
  );
};
