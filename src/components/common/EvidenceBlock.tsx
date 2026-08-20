import React, { useState } from 'react';
import { Copy, Check, FileText } from 'lucide-react';

interface EvidenceBlockProps {
  evidence: string;
  sourceSection?: string;
  evidenceLineRef?: string;
  className?: string;
}

export const EvidenceBlock: React.FC<EvidenceBlockProps> = ({
  evidence,
  sourceSection,
  evidenceLineRef,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(evidence);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      className={`mt-2.5 rounded bg-surface-sunken border-l-2 border-strong p-3 transition-colors ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5 text-xs text-secondary">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted font-medium">
            Source Evidence
          </span>
          {sourceSection && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-surface border border-default text-[11px] font-mono text-secondary">
              <FileText className="w-3 h-3" />
              {sourceSection}
            </span>
          )}
          {evidenceLineRef && (
            <span className="text-[11px] font-mono text-muted">
              ({evidenceLineRef})
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[11px] font-mono text-secondary hover:text-primary transition-colors focus-visible:outline-none"
          title="Copy verbatim source quote"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-status-found" />
              <span className="text-status-found">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy quote</span>
            </>
          )}
        </button>
      </div>

      <pre className="font-mono text-[13px] leading-[20px] text-primary whitespace-pre-wrap break-words select-text">
        {evidence}
      </pre>
    </div>
  );
};
