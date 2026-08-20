import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Loader2, 
  FileText, 
  Terminal
} from 'lucide-react';

interface ProcessingScreenProps {
  onComplete: () => void;
  candidateName?: string;
  targetRole?: string;
}

interface StepItem {
  id: number;
  label: string;
  logLines: string[];
}

const STEPS: StepItem[] = [
  {
    id: 1,
    label: 'Extracting Text',
    logLines: [
      '> Scanning document stream and raw byte segments...',
      '> Validating OCR layer and character encodings (UTF-8)...',
      '> Text layer extracted cleanly (0 encoding errors).',
    ],
  },
  {
    id: 2,
    label: 'Segmenting Sections',
    logLines: [
      '> Locating header, summary, experience, and education boundaries...',
      '> Anchoring 10 canonical document zones...',
      '> Verifying line offsets and source section headers.',
    ],
  },
  {
    id: 3,
    label: 'Parsing Fields',
    logLines: [
      '> Extracting structured contact info, company timelines, and tech stack...',
      '> Extracting verbatim quote evidence for each field...',
      '> Canonical schema validated against strict schema.',
    ],
  },
  {
    id: 4,
    label: 'Scoring Fit',
    logLines: [
      '> Comparing candidate evidence against JD requirements...',
      '> Assigning MATCHED / PARTIAL / MISSING evaluations with confidence levels...',
      '> Generating cross-reference pointers to source text.',
    ],
  },
  {
    id: 5,
    label: 'Done',
    logLines: [
      '> Audit complete. Evidence dashboard initialized.',
    ],
  },
];

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({
  onComplete,
  candidateName = 'Candidate Resume',
  targetRole = 'Target Position',
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // Step progression timer without progress bar percentages
    const intervals = [850, 950, 1100, 1000, 700];

    if (currentStepIndex < STEPS.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, intervals[currentStepIndex] || 900);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        onComplete();
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, onComplete]);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-6">
        {/* Title & Subtext (§9 Screen 2) */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[8px] bg-accent-subtle text-accent mb-1">
            <FileText className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <h1 className="text-2xl font-semibold text-primary tracking-tight">
            Processing Document
          </h1>
          <p className="text-sm text-secondary font-sans">
            Parsing resume fields and auditing fit against job requirements with exact source citations.
          </p>
        </div>

        {/* Step Indicator Card (§7 & §9 Screen 2) */}
        <div className="rounded-[8px] border border-default bg-surface p-6 shadow-xs space-y-4">
          <div className="space-y-3.5">
            {STEPS.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isActive = idx === currentStepIndex;
              const isPending = idx > currentStepIndex;

              return (
                <div key={step.id} className="space-y-2">
                  <div className="flex items-center gap-3.5">
                    {/* Circle Indicator */}
                    <div className="shrink-0">
                      {isCompleted && (
                        <div className="w-6 h-6 rounded-full bg-status-found text-status-found flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </div>
                      )}
                      {isActive && (
                        <div className="w-6 h-6 rounded-full bg-accent-subtle text-accent flex items-center justify-center">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} />
                        </div>
                      )}
                      {isPending && (
                        <div className="w-6 h-6 rounded-full border border-strong bg-surface-sunken flex items-center justify-center text-muted text-xs font-mono">
                          {step.id}
                        </div>
                      )}
                    </div>

                    {/* Step Label */}
                    <span
                      className={`text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-primary font-semibold'
                          : isCompleted
                          ? 'text-primary'
                          : 'text-muted'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Active Step Live Log Lines Sub-block in sunken mono container */}
                  {isActive && (
                    <div className="ml-9 rounded-[6px] bg-surface-sunken border-l-2 border-strong p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-muted font-medium mb-1">
                        <Terminal className="w-3 h-3" strokeWidth={1.5} />
                        <span>Execution Stream</span>
                      </div>
                      {step.logLines.map((log, lIdx) => (
                        <div
                          key={lIdx}
                          className="font-mono text-xs text-secondary leading-relaxed select-none animate-in fade-in duration-200"
                        >
                          {log}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-default flex items-center justify-between text-xs text-secondary font-mono">
            <span>Grounding Protocol: Verbatim Quoting</span>
            <span>Step {currentStepIndex + 1} of {STEPS.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
