import React, { useState } from 'react';
import { 
  FileText, 
  Clock, 
  Briefcase, 
  Search, 
  Download, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  MinusCircle, 
  Filter, 
  ChevronsUpDown,
  ArrowRight,
  Sparkles,
  Share2,
  Terminal
} from 'lucide-react';
import { AnalysisResult, FieldId, RequirementStatus } from '../../types';
import { FieldCard } from './FieldCard';
import { RequirementRow } from './RequirementRow';
import { ScorerBadge } from '../common/ScorerBadge';
import { RawTextModal } from './RawTextModal';
import { TwoStageContractModal } from './TwoStageContractModal';

interface ResultsDashboardProps {
  result: AnalysisResult | null;
  onNewAnalysis: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  result,
  onNewAnalysis,
}) => {
  const [fieldSearch, setFieldSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FOUND' | 'AMBIGUOUS' | 'NOT_FOUND'>('ALL');
  const [reqFilter, setReqFilter] = useState<'ALL' | RequirementStatus>('ALL');
  const [highlightedFieldId, setHighlightedFieldId] = useState<FieldId | null>(null);
  const [forceEvidenceExpanded, setForceEvidenceExpanded] = useState<boolean | undefined>(undefined);
  const [showRawModal, setShowRawModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  if (!result) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-[8px] bg-surface-sunken border border-default flex items-center justify-center text-muted">
          <FileText className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <div className="space-y-1 max-w-md">
          <h2 className="text-lg font-semibold text-primary">No Active Analysis</h2>
          <p className="text-xs text-secondary font-sans leading-relaxed">
            Upload a candidate resume and job description to extract 12 canonical fields and evaluate requirement match scores with verified source evidence.
          </p>
        </div>
        <button
          type="button"
          onClick={onNewAnalysis}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4" strokeWidth={1.75} />
          <span>Start New Analysis</span>
        </button>
      </div>
    );
  }

  // Jump smoothly to highlighted field in left panel
  const handleNavigateToEvidence = (fieldId: FieldId) => {
    setHighlightedFieldId(fieldId);
    setForceEvidenceExpanded(true);

    const el = document.getElementById(`field-${fieldId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setTimeout(() => {
      setHighlightedFieldId(null);
    }, 2400);
  };

  // Filter fields
  const filteredFields = result.fields.filter((field) => {
    const matchesSearch = 
      field.id.toLowerCase().includes(fieldSearch.toLowerCase()) ||
      field.label.toLowerCase().includes(fieldSearch.toLowerCase()) ||
      JSON.stringify(field.value).toLowerCase().includes(fieldSearch.toLowerCase()) ||
      field.evidence.toLowerCase().includes(fieldSearch.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || field.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter requirements
  const filteredRequirements = result.requirements.filter((req) => {
    if (reqFilter === 'ALL') return true;
    return req.status === reqFilter;
  });

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 2500);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${result.candidateName.replace(/\s+/g, '_')}_parsed_profile.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast('Exported profile.json successfully');
  };

  const handleExportReportMd = () => {
    const mdContent = `# Evidence Audit Report — ${result.candidateName}
**Target Role:** ${result.targetRole}
**Filename:** ${result.fileName || 'Candidate_Resume.pdf'}
**Fit Score:** ${result.fitScorePercentage}% (${result.matchedCount}/${result.totalRequirements} Matched)
**Audit Scorer:** ${result.scorer === 'llm' ? 'AI Model (Verified Citation Grounding)' : 'Keyword Fallback'}
**Timestamp:** ${result.timestamp}

---

## Executive Summary
${result.overallSummary}

## Key Strengths
${result.keyStrengths.map(s => `- ${s}`).join('\n')}

## Gaps & Missing Requisites
${result.keyGaps.length > 0 ? result.keyGaps.map(g => `- ${g}`).join('\n') : '- None detected'}

---

## Evaluated Requirements
${result.requirements.map(r => `### ${r.requirement} [${r.status}]
- Confidence: ${r.confidence}
- Explanation: ${r.explanation}
- Evidence Field Ref: [${r.evidence_ref}]
- Quoted Snippet: "${r.evidence_quote || 'N/A'}"
`).join('\n')}

---

## Extracted Canonical Fields
${result.fields.map(f => `### [${f.id}] ${f.label} (${f.status})
\`\`\`
${typeof f.value === 'string' ? f.value : JSON.stringify(f.value, null, 2)}
\`\`\`
**Verbatim Evidence:**
> ${f.evidence || 'N/A'}
`).join('\n')}
`;

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.candidateName.replace(/\s+/g, '_')}_evidence_report.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    triggerToast('Exported evidence_report.md');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-[6px] bg-primary text-base text-xs font-mono shadow-lg border border-default animate-in fade-in slide-in-from-bottom-2 duration-150">
          {showToast}
        </div>
      )}

      {/* Top Header Card (§9 Screen 3/4) */}
      <div className="rounded-[8px] border border-default bg-surface p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* File Icon + Filename + Metadata */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-accent-subtle text-accent flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-semibold text-primary tracking-tight">
                  {result.fileName || `${result.candidateName.replace(/\s+/g, '_')}_CV.pdf`}
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-sunken border border-default text-secondary">
                  {result.candidateName}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-secondary mt-1 flex-wrap font-sans">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                  <span className="text-primary font-medium">{result.targetRole}</span>
                </span>
                <span className="text-muted">•</span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-muted">
                  <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>{result.timestamp}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Top-Right: Scorer Badge + Actions */}
          <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
            {/* Scorer Badge (Must be unmissable on results screen!) */}
            <ScorerBadge scorer={result.scorer} />

            <button
              type="button"
              onClick={() => setShowContractModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-strong bg-transparent hover:bg-surface-sunken text-primary text-xs font-mono font-medium transition-colors"
              title="Inspect 2-stage JSON contract: Stage 1 Fields + Stage 2 Fit Scoring"
            >
              <Terminal className="w-3.5 h-3.5 text-accent" strokeWidth={1.75} />
              <span>Contract JSON</span>
            </button>

            <button
              type="button"
              onClick={() => setShowRawModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-strong bg-transparent hover:bg-surface-sunken text-primary text-xs font-medium transition-colors"
              title="Inspect raw resume and job description text"
            >
              <Eye className="w-3.5 h-3.5 text-secondary" strokeWidth={1.75} />
              <span>Inspect Source</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-strong bg-transparent hover:bg-surface-sunken text-primary text-xs font-medium transition-colors"
              title="Download structured profile.json"
            >
              <Download className="w-3.5 h-3.5 text-secondary" strokeWidth={1.75} />
              <span>profile.json</span>
            </button>

            <button
              type="button"
              onClick={handleExportReportMd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors"
              title="Export complete evidence markdown report"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Overall Fit Summary Strip */}
        <div className="pt-3 border-t border-default grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="md:col-span-2 space-y-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted font-medium">
              Overall Assessment
            </span>
            <p className="text-secondary leading-relaxed font-sans">
              {result.overallSummary}
            </p>
          </div>
          <div className="rounded-[6px] bg-surface-sunken p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono text-muted uppercase tracking-wider">Fit Score</div>
              <div className="text-xl font-bold font-mono text-primary">
                {result.fitScorePercentage}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-mono text-muted uppercase tracking-wider">Criteria</div>
              <div className="text-sm font-semibold font-mono text-primary">
                {result.matchedCount} / {result.totalRequirements} Matched
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Panel Results Layout (§5: 44% Fields Panel / 56% Fit Report Panel) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* LEFT PANEL: Extracted Canonical Fields (44% Width on Desktop) */}
        <section className="w-full lg:w-[44%] space-y-3.5 min-w-[320px]">
          {/* Panel Header */}
          <div className="flex items-center justify-between gap-2 pb-1">
            <div>
              <h2 className="text-base font-semibold text-primary">
                Extracted Fields
              </h2>
              <p className="text-xs text-secondary font-sans">
                {result.fields.length} fixed canonical fields with verbatim source text
              </p>
            </div>

            {/* Expand / Collapse All Quotes */}
            <button
              type="button"
              onClick={() => setForceEvidenceExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-mono text-secondary hover:text-primary transition-colors"
              title="Toggle all source evidence quotes"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{forceEvidenceExpanded ? 'Collapse Quotes' : 'Expand All'}</span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="Filter fields, values, or evidence..."
                value={fieldSearch}
                onChange={(e) => setFieldSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface border border-default rounded-[6px] text-primary placeholder:text-muted focus:border-strong focus:outline-none transition-colors"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="py-1.5 px-2.5 text-xs font-mono bg-surface border border-default rounded-[6px] text-secondary hover:text-primary focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="FOUND">FOUND only</option>
              <option value="AMBIGUOUS">AMBIGUOUS only</option>
              <option value="NOT_FOUND">NOT_FOUND only</option>
            </select>
          </div>

          {/* List of Field Rows */}
          <div className="space-y-2.5">
            {filteredFields.length > 0 ? (
              filteredFields.map((field) => (
                <FieldCard
                  key={field.id}
                  field={field}
                  isHighlighted={highlightedFieldId === field.id}
                  forceEvidenceExpanded={forceEvidenceExpanded}
                />
              ))
            ) : (
              <div className="rounded-[8px] border border-default bg-surface p-8 text-center text-xs text-muted">
                No extracted fields match the current filter criteria.
              </div>
            )}
          </div>
        </section>

        {/* RIGHT PANEL: Fit Report (56% Width on Desktop) */}
        <section className="w-full lg:w-[56%] space-y-3.5 min-w-[320px]">
          {/* Panel Header */}
          <div className="flex items-center justify-between gap-2 pb-1">
            <div>
              <h2 className="text-base font-semibold text-primary">
                Fit Report
              </h2>
              <p className="text-xs text-secondary font-sans">
                Scored match: <span className="font-mono font-medium text-primary">{result.fitScorePercentage}%</span> against target position requirements
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-surface-sunken p-0.5 rounded-[6px] border border-default text-xs font-mono">
              {(['ALL', 'MATCHED', 'PARTIAL', 'MISSING'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setReqFilter(tab)}
                  className={`px-2 py-1 rounded-[4px] text-[11px] transition-colors ${
                    reqFilter === tab
                      ? 'bg-surface text-primary font-medium border border-default shadow-xs'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Key Strengths & Gaps Callouts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-[8px] border border-default bg-surface p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-found" strokeWidth={2} />
                <span>Key Candidate Strengths</span>
              </div>
              <ul className="space-y-1 text-xs text-secondary font-sans">
                {result.keyStrengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-muted leading-relaxed">•</span>
                    <span className="leading-snug">{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[8px] border border-default bg-surface p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <MinusCircle className="w-3.5 h-3.5 text-status-missing" strokeWidth={2} />
                <span>Identified Gaps & Gaps</span>
              </div>
              {result.keyGaps.length > 0 ? (
                <ul className="space-y-1 text-xs text-secondary font-sans">
                  {result.keyGaps.map((gap, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-muted leading-relaxed">•</span>
                      <span className="leading-snug">{gap}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted italic">
                  No critical requisite gaps identified. All evaluated requirements matched.
                </p>
              )}
            </div>
          </div>

          {/* List of Requirement Cards */}
          <div className="space-y-2.5">
            {filteredRequirements.length > 0 ? (
              filteredRequirements.map((req) => (
                <RequirementRow
                  key={req.id}
                  requirement={req}
                  onNavigateToEvidence={handleNavigateToEvidence}
                />
              ))
            ) : (
              <div className="rounded-[8px] border border-default bg-surface p-8 text-center text-xs text-muted">
                No requirement evaluations match the selected filter.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Raw Source Text Modal */}
      {showRawModal && (
        <RawTextModal
          resumeText={result.rawResumeText}
          jdText={result.rawJdText}
          candidateName={result.candidateName}
          onClose={() => setShowRawModal(false)}
        />
      )}

      {/* Two-Stage Agent Contract Output Modal */}
      {showContractModal && (
        <TwoStageContractModal
          isOpen={showContractModal}
          onClose={() => setShowContractModal(false)}
          result={result}
        />
      )}
    </div>
  );
};
