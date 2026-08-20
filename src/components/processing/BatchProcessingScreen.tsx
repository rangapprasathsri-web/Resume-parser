import React from 'react';
import { Loader2, CheckCircle2, FileText, AlertTriangle } from 'lucide-react';

interface BatchProcessingScreenProps {
  jobTitle: string;
  total: number;
  completedCount: number;
  currentCandidateName?: string;
  stageName?: string;
}

export const BatchProcessingScreen: React.FC<BatchProcessingScreenProps> = ({
  jobTitle,
  total,
  completedCount,
  currentCandidateName,
  stageName = 'Analyzing candidate qualifications',
}) => {
  const percentage = total > 0 ? Math.min(100, Math.round((completedCount / total) * 100)) : 0;

  return (
    <div className="max-w-xl mx-auto py-16 px-4 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-[10px] bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mx-auto">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-primary tracking-tight">
          Screening Candidates
        </h2>
        <p className="text-xs text-secondary font-sans">
          Target Role: <span className="font-semibold text-primary">{jobTitle}</span>
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 rounded-[8px] border border-default bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-secondary font-medium">Batch Progress</span>
          <span className="text-primary font-bold">{percentage}%</span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-surface-sunken overflow-hidden border border-default">
          <div
            className="h-full bg-accent transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-muted pt-1">
          <span>{completedCount} of {total} candidates analyzed</span>
          <span>{stageName}</span>
        </div>
      </div>

      {/* Current Task Status */}
      {currentCandidateName && (
        <div className="p-3.5 rounded-[6px] border border-default bg-surface-sunken flex items-center gap-3 text-xs font-mono">
          <Loader2 className="w-4 h-4 animate-spin text-accent shrink-0" />
          <div className="truncate">
            <span className="text-muted">Processing: </span>
            <span className="text-primary font-semibold truncate">{currentCandidateName}</span>
          </div>
        </div>
      )}

      <div className="text-center">
        <p className="text-[11px] text-muted font-sans">
          Performing deterministic field extraction, ATS keyword matching, and grounded agentic scoring.
        </p>
      </div>
    </div>
  );
};
