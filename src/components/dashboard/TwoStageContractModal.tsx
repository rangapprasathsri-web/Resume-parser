import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FileCode, CheckCircle2, AlertCircle, MinusCircle } from 'lucide-react';
import { AnalysisResult } from '../../types';
import { formatTwoStageContractJson } from '../../utils/parserSimulator';

interface TwoStageContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult;
}

export const TwoStageContractModal: React.FC<TwoStageContractModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  const [activeTab, setActiveTab] = useState<'json' | 'stage1' | 'stage2' | 'prompt'>('json');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const contractJson = formatTwoStageContractJson(result);
  const jsonString = JSON.stringify(contractJson, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPrompt = () => {
    const promptText = `STAGE 1 — FIELD EXTRACTION
Extract exactly these field categories, each from its relevant section only:
- full_name, email, phone, linkedin_url, location, most_recent_title_company, skills_list, degree_institution_year, certifications, projects, years_experience, achievements

For each field:
- status: "FOUND", "NOT_FOUND", or "AMBIGUOUS"
- value: normalized value, or null if NOT_FOUND
- evidence: the EXACT verbatim substring from the resume text that supports the value, or null if NOT_FOUND
- source_section: which segmented section it came from

STAGE 2 — FIT SCORING (uses ONLY Stage 1 fields)
Compare Stage 1 fields against JD requirements.
- match_status: "MATCHED" | "PARTIAL" | "MISSING"
- explanation: one sentence referencing specific field value
- evidence_ref: field_id from Stage 1 (null for MISSING)
- confidence: "high" | "medium" | "low"

Sort fit_report: MATCHED, then PARTIAL, then MISSING; ties broken by field_id alphabetically.`;

    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-4xl max-h-[90vh] bg-surface rounded-[10px] border border-strong shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-default flex items-center justify-between bg-surface-sunken">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[6px] bg-accent-subtle text-accent flex items-center justify-center">
              <Terminal className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-primary">Two-Stage Agent Contract Output</h2>
              <p className="text-xs text-secondary font-mono">
                Stage 1 (Field Extraction) + Stage 2 (Fit Scoring) Structured Contract
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-primary rounded-[6px] hover:bg-surface-sunken transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-default flex items-center justify-between bg-surface">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('json')}
              className={`py-3 text-xs font-mono border-b-2 font-medium transition-colors ${
                activeTab === 'json'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              Contract JSON ({contractJson.fields.length} fields / {contractJson.fit_report.length} reqs)
            </button>
            <button
              onClick={() => setActiveTab('stage1')}
              className={`py-3 text-xs font-mono border-b-2 font-medium transition-colors ${
                activeTab === 'stage1'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              Stage 1: Field Breakdown
            </button>
            <button
              onClick={() => setActiveTab('stage2')}
              className={`py-3 text-xs font-mono border-b-2 font-medium transition-colors ${
                activeTab === 'stage2'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              Stage 2: Fit Scoring
            </button>
            <button
              onClick={() => setActiveTab('prompt')}
              className={`py-3 text-xs font-mono border-b-2 font-medium transition-colors ${
                activeTab === 'prompt'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              Prompt Specification
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={activeTab === 'prompt' ? handleCopyPrompt : handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[6px] border border-default hover:bg-surface-sunken text-primary transition-colors shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-status-found" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-muted" />
                  <span>{activeTab === 'prompt' ? 'Copy Prompt' : 'Copy JSON'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'json' && (
            <div className="rounded-[8px] bg-surface-sunken border border-default p-4 font-mono text-xs text-primary overflow-x-auto leading-relaxed">
              <pre>{jsonString}</pre>
            </div>
          )}

          {activeTab === 'stage1' && (
            <div className="space-y-4">
              <div className="text-xs text-secondary font-mono">
                Extracts exactly canonical field categories strictly from relevant sections. Status is final and never modified in Stage 2.
              </div>
              <div className="overflow-x-auto border border-default rounded-[8px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-sunken text-secondary font-mono border-b border-default">
                    <tr>
                      <th className="p-3">Field ID</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Source Section</th>
                      <th className="p-3">Verbatim Evidence</th>
                      <th className="p-3">Normalized Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default">
                    {contractJson.fields.map((f, i) => (
                      <tr key={i} className="hover:bg-surface-sunken/50">
                        <td className="p-3 font-mono font-medium text-primary">{f.field_id}</td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] font-mono text-[11px] font-medium ${
                              f.status === 'FOUND'
                                ? 'bg-status-found text-status-found'
                                : f.status === 'AMBIGUOUS'
                                ? 'bg-status-ambiguous text-status-ambiguous'
                                : 'bg-status-missing text-status-missing'
                            }`}
                          >
                            {f.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-secondary">{f.source_section}</td>
                        <td className="p-3 font-mono text-secondary max-w-xs truncate">
                          {f.evidence ? `"${f.evidence}"` : '—'}
                        </td>
                        <td className="p-3 font-sans text-primary max-w-xs truncate">
                          {f.value ? (typeof f.value === 'object' ? JSON.stringify(f.value) : String(f.value)) : 'null'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'stage2' && (
            <div className="space-y-4">
              <div className="text-xs text-secondary font-mono">
                Evaluates candidate fit using ONLY Stage 1 produced fields. Sorted: MATCHED, then PARTIAL, then MISSING (alphabetical tie-breaking).
              </div>
              <div className="overflow-x-auto border border-default rounded-[8px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-sunken text-secondary font-mono border-b border-default">
                    <tr>
                      <th className="p-3">Requirement</th>
                      <th className="p-3">Match Status</th>
                      <th className="p-3">Confidence</th>
                      <th className="p-3">Evidence Ref</th>
                      <th className="p-3">Explanation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default">
                    {contractJson.fit_report.map((r, i) => (
                      <tr key={i} className="hover:bg-surface-sunken/50">
                        <td className="p-3 font-sans font-medium text-primary max-w-xs">{r.requirement}</td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] font-mono text-[11px] font-medium ${
                              r.match_status === 'MATCHED'
                                ? 'bg-status-found text-status-found'
                                : r.match_status === 'PARTIAL'
                                ? 'bg-status-ambiguous text-status-ambiguous'
                                : 'bg-status-missing text-status-missing'
                            }`}
                          >
                            {r.match_status}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-secondary uppercase">{r.confidence}</td>
                        <td className="p-3 font-mono text-accent font-medium">{r.evidence_ref || 'null'}</td>
                        <td className="p-3 font-sans text-secondary">{r.explanation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'prompt' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-[8px] bg-surface-sunken border border-default space-y-3 leading-relaxed text-secondary">
                <div className="text-primary font-semibold">Stage 1 — Field Extraction Rules:</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Never invent a value that isn't a verbatim (or trivially normalized) substring of the provided text.</li>
                  <li>If ambiguous (e.g. two possible titles), mark AMBIGUOUS and add a note explaining why.</li>
                  <li>If genuinely absent from the text, mark NOT_FOUND. Do not use outside knowledge to fill gaps.</li>
                </ul>

                <div className="text-primary font-semibold pt-2">Stage 2 — Fit Scoring Rules:</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Uses ONLY Stage 1 produced fields, never raw resume text again.</li>
                  <li>match_status: "MATCHED" | "PARTIAL" | "MISSING".</li>
                  <li>explanation: one sentence referencing specific field value.</li>
                  <li>evidence_ref: field_id from Stage 1 (null only for MISSING).</li>
                  <li>Sorted strictly: MATCHED, then PARTIAL, then MISSING; ties broken by field_id alphabetically.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-default bg-surface-sunken flex items-center justify-between text-xs text-secondary font-mono">
          <span>Schema Contract: 2-Stage Zero-Hallucination Protocol</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-[6px] bg-surface border border-default hover:bg-surface-sunken text-primary font-sans text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
