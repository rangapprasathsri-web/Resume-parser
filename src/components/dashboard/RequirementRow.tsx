import React from 'react';
import { ArrowRight, FileText } from 'lucide-react';
import { JobRequirement, FieldId } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ConfidenceTag } from '../common/ConfidenceTag';

interface RequirementRowProps {
  requirement: JobRequirement;
  onNavigateToEvidence: (fieldId: FieldId) => void;
}

export const RequirementRow: React.FC<RequirementRowProps> = ({
  requirement,
  onNavigateToEvidence,
}) => {
  return (
    <div className="rounded-[8px] border border-default bg-surface p-3.5 space-y-2 hover:border-strong transition-colors">
      {/* Requirement Header Text (Primary, Semi-Bold) */}
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-primary leading-snug">
          {requirement.requirement}
        </h4>
      </div>

      {/* Status Badge + Confidence Dot inline below it */}
      <div className="flex items-center gap-3 pt-0.5 flex-wrap">
        <StatusBadge status={requirement.status} size="sm" />
        <ConfidenceTag confidence={requirement.confidence} />
        {requirement.isMandatory && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-medium">
            Required
          </span>
        )}
      </div>

      {/* Explanation in secondary text */}
      <p className="text-xs text-secondary leading-relaxed font-sans">
        {requirement.explanation}
      </p>

      {/* Bottom row: Evidence Quote snippet (if matched) & Clickable evidence_ref chip */}
      <div className="pt-2 border-t border-default flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {requirement.evidence_quote ? (
          <div className="text-[11px] font-mono text-muted truncate max-w-xs sm:max-w-sm">
            <span className="font-sans italic">"{requirement.evidence_quote}"</span>
          </div>
        ) : (
          <div className="text-[11px] font-mono text-muted">
            Section: <span className="text-secondary">[{requirement.evidence_ref}]</span>
          </div>
        )}

        {/* Clickable evidence_ref chip */}
        <button
          type="button"
          onClick={() => onNavigateToEvidence(requirement.evidence_ref)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-accent-subtle hover:opacity-85 text-accent text-xs font-mono font-medium transition-all self-start sm:self-auto cursor-pointer focus-visible:outline-none shrink-0"
          title={`Jump to ${requirement.evidence_ref} field in Extracted Fields panel`}
        >
          <span>→ {requirement.evidence_ref}</span>
        </button>
      </div>
    </div>
  );
};
