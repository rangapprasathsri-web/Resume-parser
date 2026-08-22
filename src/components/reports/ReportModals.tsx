import React from 'react';
import { X, Printer, Download, Award, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { JobScreeningSession, FinalCandidateAnalysis } from '../../types';

interface BatchReportModalProps {
  session: JobScreeningSession;
  onClose: () => void;
}

export const BatchReportModal: React.FC<BatchReportModalProps> = ({ session, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface border border-default rounded-[10px] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-default flex items-center justify-between bg-surface-sunken">
          <div className="flex items-center gap-2 font-mono text-xs font-semibold text-primary">
            <FileText className="w-4 h-4 text-accent" />
            <span>BATCH SCREENING AUDIT REPORT</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-accent text-white text-xs font-medium hover:bg-accent-hover cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-secondary hover:text-primary cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Content */}
        <div className="p-8 overflow-y-auto space-y-6 text-primary print:p-0">
          <div className="border-b border-default pb-4">
            <div className="text-xs font-mono text-muted uppercase">EvidenceFirst Talent Assessment Report</div>
            <h1 className="text-2xl font-bold text-primary mt-1">{session.title}</h1>
            <div className="flex flex-wrap gap-4 text-xs font-mono text-secondary mt-2">
              <span>Date: {new Date(session.createdAt).toLocaleDateString()}</span>
              <span>Total Screened: {session.candidateCount} Resumes</span>
              <span>Top Candidate Fit: {session.topScore}%</span>
              <span>Average Fit: {session.averageScore}%</span>
            </div>
          </div>

          {/* Ranking Table */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold font-mono uppercase tracking-wider text-muted">
              Candidate Rankings & Score Distribution
            </h2>
            <div className="border border-default rounded-[6px] overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-sunken border-b border-default font-mono text-[11px] text-muted">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Candidate</th>
                    <th className="py-2.5 px-3">ATS Score</th>
                    <th className="py-2.5 px-3">Agentic Score</th>
                    <th className="py-2.5 px-3">Overall Score</th>
                    <th className="py-2.5 px-3">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default">
                  {session.candidates.map((c, i) => (
                    <tr key={c.candidateId}>
                      <td className="py-2.5 px-3 font-mono font-bold">#{i + 1}</td>
                      <td className="py-2.5 px-3 font-medium">{c.candidateName}</td>
                      <td className="py-2.5 px-3 font-mono">{c.atsScore}%</td>
                      <td className="py-2.5 px-3 font-mono">{c.agenticScore}%</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-accent">{c.comprehensiveScore}%</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">{c.recommendation.replace('_', ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Recommendation Summary */}
          {session.candidates[0] && (
            <div className="p-4 rounded-[6px] border border-accent/20 bg-accent/5 space-y-2">
              <div className="text-xs font-mono font-semibold text-accent uppercase">
                #1 Recommended Candidate: {session.candidates[0].candidateName} ({session.candidates[0].comprehensiveScore}%)
              </div>
              <div className="text-xs text-primary font-sans">
                {session.candidates[0].relevanceSummary}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface IndividualReportModalProps {
  candidate: FinalCandidateAnalysis;
  onClose: () => void;
}

export const IndividualReportModal: React.FC<IndividualReportModalProps> = ({ candidate, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface border border-default rounded-[10px] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-default flex items-center justify-between bg-surface-sunken">
          <div className="flex items-center gap-2 font-mono text-xs font-semibold text-primary">
            <Award className="w-4 h-4 text-accent" />
            <span>CANDIDATE AUDIT REPORT</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-accent text-white text-xs font-medium hover:bg-accent-hover cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-secondary hover:text-primary cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="p-8 overflow-y-auto space-y-6 text-primary print:p-0">
          <div className="border-b border-default pb-4">
            <div className="text-xs font-mono text-muted uppercase">EvidenceFirst Talent Assessment</div>
            <h1 className="text-2xl font-bold text-primary mt-1">{candidate.candidateName}</h1>
            <div className="text-xs text-secondary mt-1">Target Position: {candidate.targetRole}</div>
            <div className="flex flex-wrap gap-4 text-xs font-mono text-secondary mt-2">
              <span>Overall Match: {candidate.comprehensiveScore}%</span>
              <span>ATS Score: {candidate.atsScore}%</span>
              <span>Agentic Score: {candidate.agenticScore}%</span>
              <span>Recommendation: {candidate.recommendation.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Strengths */}
          <div className="space-y-2">
            <div className="text-xs font-mono font-semibold text-status-matched uppercase">Key Strengths</div>
            <ul className="list-disc list-inside text-xs space-y-1 text-primary">
              {candidate.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          {/* Verified Requirements */}
          <div className="space-y-2">
            <div className="text-xs font-mono font-semibold text-primary uppercase">
              Grounded Requirement Evidence ({candidate.ats.matchedRequirements.length} Matched)
            </div>
            <div className="space-y-2">
              {candidate.ats.matchedRequirements.map((m, i) => (
                <div key={i} className="p-2.5 rounded bg-surface-sunken border border-default text-xs space-y-0.5">
                  <div className="font-semibold text-primary">{m.requirement}</div>
                  <div className="text-[11px] font-mono text-secondary italic">"{m.evidenceQuote}"</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ConsolidatedCandidatesReportModal } from './ConsolidatedCandidatesReportModal';
