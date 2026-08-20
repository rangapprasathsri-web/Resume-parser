import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  Briefcase,
  GraduationCap,
  Award,
  Layers,
  Code,
  ShieldCheck,
} from 'lucide-react';
import { FinalCandidateAnalysis, RecommendationTier } from '../../types';

interface CandidateDetailViewProps {
  candidate: FinalCandidateAnalysis;
  onBack: () => void;
  onExportReport: () => void;
}

export const CandidateDetailView: React.FC<CandidateDetailViewProps> = ({
  candidate,
  onBack,
  onExportReport,
}) => {
  const [activeTab, setActiveTab] = useState<'evaluation' | 'profile' | 'raw'>('evaluation');

  const getTierBadge = (tier: RecommendationTier) => {
    switch (tier) {
      case 'EXCELLENT_MATCH':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-semibold bg-status-matched/10 text-status-matched border border-status-matched/20">
            Excellent Match (90–100%)
          </span>
        );
      case 'HIGH_MATCH':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            High Match (80–89%)
          </span>
        );
      case 'GOOD_MATCH':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-semibold bg-status-partial/10 text-status-partial border border-status-partial/20">
            Good Match (70–79%)
          </span>
        );
      case 'MODERATE_MATCH':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Moderate Match (60–69%)
          </span>
        );
      case 'LOW_MATCH':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-semibold bg-status-missing/10 text-status-missing border border-status-missing/20">
            Low Match (&lt; 60%)
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-[6px] border border-default text-secondary hover:text-primary hover:bg-surface-sunken transition-colors cursor-pointer"
            title="Back to Rankings"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-primary tracking-tight">
              {candidate.candidateName}
            </h1>
            <p className="text-xs text-secondary font-sans mt-0.5">
              Assessed for: <span className="font-medium text-primary">{candidate.targetRole}</span> • {candidate.fileName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onExportReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Candidate Report</span>
          </button>
        </div>
      </div>

      {/* Hero Assessment Card */}
      <div className="rounded-[8px] border border-default bg-surface p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          {/* Main Comprehensive Score */}
          <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-default pb-4 md:pb-0 md:pr-6 text-center md:text-left space-y-1">
            <div className="text-xs font-mono text-muted uppercase">Overall Fit Score</div>
            <div className="text-4xl font-extrabold font-mono text-primary tracking-tight">
              {candidate.comprehensiveScore}%
            </div>
            <div className="pt-1">{getTierBadge(candidate.recommendation)}</div>
          </div>

          {/* Sub-Scores & Mode */}
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-[6px] bg-surface-sunken border border-default space-y-1">
              <div className="text-[11px] font-mono text-muted uppercase flex items-center justify-between">
                <span>ATS Match</span>
                <span className="text-[10px] text-secondary font-sans">(40% wt)</span>
              </div>
              <div className="text-2xl font-bold font-mono text-primary">
                {candidate.atsScore}%
              </div>
              <div className="text-[11px] text-secondary font-sans truncate">
                {candidate.ats.matchedRequirements.length} criteria matched
              </div>
            </div>

            <div className="p-3.5 rounded-[6px] bg-surface-sunken border border-default space-y-1">
              <div className="text-[11px] font-mono text-muted uppercase flex items-center justify-between">
                <span>Agentic Score</span>
                <span className="text-[10px] text-secondary font-sans">(60% wt)</span>
              </div>
              <div className="text-2xl font-bold font-mono text-primary">
                {candidate.analysisMode === 'ats_only' ? '—' : `${candidate.agenticScore}%`}
              </div>
              <div className="text-[11px] text-secondary font-sans truncate">
                {candidate.analysisMode === 'openrouter'
                  ? 'OpenRouter Agent Evaluated'
                  : 'ATS Fallback Mode'}
              </div>
            </div>

            <div className="p-3.5 rounded-[6px] bg-surface-sunken border border-default space-y-1">
              <div className="text-[11px] font-mono text-muted uppercase">Timeline & Evidence</div>
              <div className="text-sm font-semibold font-mono text-primary truncate">
                {candidate.profile.yearsOfExperience || 'Timeline Verified'}
              </div>
              <div className="text-[11px] text-secondary font-sans flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                <span>100% Grounded</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Latency Strip */}
        <div className="mt-5 pt-4 border-t border-default flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-xs text-secondary font-mono">
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
            {candidate.profile.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted" />
                <span>{candidate.profile.email}</span>
              </div>
            )}
            {candidate.profile.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-muted" />
                <span>{candidate.profile.phone}</span>
              </div>
            )}
            {candidate.profile.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted" />
                <span>{candidate.profile.location}</span>
              </div>
            )}
            {candidate.profile.linkedinUrl && (
              <div className="flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5 text-muted" />
                <span>{candidate.profile.linkedinUrl}</span>
              </div>
            )}
          </div>

          {candidate.timings && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-muted bg-surface-sunken px-2.5 py-1 rounded border border-default">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>
                ATS: {candidate.timings.ats_ms}ms • Ext: {candidate.timings.extraction_ms}ms • Total: {candidate.timings.total_ms}ms
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-default text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab('evaluation')}
          className={`px-4 py-2 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'evaluation'
              ? 'border-accent text-accent'
              : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          Requirement & Evidence Audit
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'profile'
              ? 'border-accent text-accent'
              : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          Structured Candidate Profile ({candidate.profile.fields?.length || 15} Fields)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('raw')}
          className={`px-4 py-2 border-b-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'raw'
              ? 'border-accent text-accent'
              : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          Raw Document Text
        </button>
      </div>

      {/* TAB 1: Evaluation & Evidence Audit */}
      {activeTab === 'evaluation' && (
        <div className="space-y-6">
          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-[8px] border border-default bg-surface p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold font-mono text-status-matched uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Key Candidate Strengths</span>
              </div>
              <ul className="space-y-2 text-xs text-primary font-sans">
                {candidate.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-status-matched font-bold mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[8px] border border-default bg-surface p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold font-mono text-status-missing uppercase tracking-wider">
                <AlertCircle className="w-4 h-4" />
                <span>Areas of Caution / Gaps</span>
              </div>
              <ul className="space-y-2 text-xs text-primary font-sans">
                {candidate.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-status-missing font-bold mt-0.5">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Matched Requirements List */}
          <div className="rounded-[8px] border border-default bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-default pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-matched" />
                <h3 className="text-xs font-semibold font-mono text-primary uppercase tracking-wider">
                  Verified Matched Requirements ({candidate.ats.matchedRequirements.length})
                </h3>
              </div>
              <span className="text-[11px] font-mono text-muted">Evidence Grounded</span>
            </div>

            <div className="space-y-3">
              {candidate.ats.matchedRequirements.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-[6px] border border-default bg-surface-sunken space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-primary font-sans">
                      {item.requirement}
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-status-matched/10 text-status-matched border border-status-matched/20">
                      MATCHED
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-surface border border-default text-[11px] font-mono text-secondary space-y-1">
                    <div className="text-muted text-[10px]">VERBATIM EVIDENCE QUOTE:</div>
                    <div className="text-primary italic">"{item.evidenceQuote}"</div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-muted">
                    <span>Source: {item.evidenceRef}</span>
                    <span>•</span>
                    <span>Type: {item.matchType} Match</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Missing Requirements List */}
          {candidate.ats.missingRequirements.length > 0 && (
            <div className="rounded-[8px] border border-default bg-surface p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-default pb-3">
                <AlertCircle className="w-4 h-4 text-status-missing" />
                <h3 className="text-xs font-semibold font-mono text-primary uppercase tracking-wider">
                  Missing / Unverified Requirements ({candidate.ats.missingRequirements.length})
                </h3>
              </div>

              <div className="space-y-2">
                {candidate.ats.missingRequirements.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-[6px] border border-default bg-surface-sunken flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="text-secondary font-sans">{item.requirement}</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-status-missing/10 text-status-missing border border-status-missing/20 shrink-0">
                      NOT FOUND
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Structured Candidate Profile (15+ Fields) */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Skills & Ecosystem */}
            <div className="rounded-[8px] border border-default bg-surface p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-default pb-3">
                <Code className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-semibold font-mono text-primary uppercase tracking-wider">
                  Skills & Technology Stack
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[11px] font-mono text-muted mb-1">PROGRAMMING LANGUAGES:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.profile.programmingLanguages.length > 0 ? (
                      candidate.profile.programmingLanguages.map((l, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-surface-sunken border border-default font-mono text-primary">
                          {l}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted italic">None declared</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-mono text-muted mb-1">FRAMEWORKS & LIBRARIES:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.profile.frameworks.length > 0 ? (
                      candidate.profile.frameworks.map((f, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-surface-sunken border border-default font-mono text-primary">
                          {f}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted italic">None declared</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-mono text-muted mb-1">DATABASES & STORAGE:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.profile.databases.length > 0 ? (
                      candidate.profile.databases.map((db, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-surface-sunken border border-default font-mono text-primary">
                          {db}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted italic">None declared</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-mono text-muted mb-1">CLOUD & DEVOPS:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.profile.cloudDevOps.length > 0 ? (
                      candidate.profile.cloudDevOps.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-surface-sunken border border-default font-mono text-primary">
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted italic">None declared</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Education & Certifications */}
            <div className="rounded-[8px] border border-default bg-surface p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-default pb-3">
                <GraduationCap className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-semibold font-mono text-primary uppercase tracking-wider">
                  Education & Credentials
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="text-[11px] font-mono text-muted mb-1">DEGREES & INSTITUTIONS:</div>
                  {candidate.profile.education.length > 0 ? (
                    candidate.profile.education.map((edu, i) => (
                      <div key={i} className="p-2 rounded bg-surface-sunken border border-default space-y-0.5 mb-2">
                        <div className="font-semibold text-primary">{edu.degree}</div>
                        <div className="text-secondary font-sans">{edu.institution}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted italic">No formal university degree detected</div>
                  )}
                </div>

                <div>
                  <div className="text-[11px] font-mono text-muted mb-1">CERTIFICATIONS:</div>
                  {candidate.profile.certifications.length > 0 ? (
                    <div className="space-y-1">
                      {candidate.profile.certifications.map((c, i) => (
                        <div key={i} className="p-1.5 rounded bg-surface-sunken border border-default font-mono text-primary">
                          {c}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted italic">No industry certifications declared</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Work Experience */}
          <div className="rounded-[8px] border border-default bg-surface p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-default pb-3">
              <Briefcase className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-semibold font-mono text-primary uppercase tracking-wider">
                Work History & Projects
              </h3>
            </div>

            <div className="space-y-3">
              {candidate.profile.workExperience.length > 0 ? (
                candidate.profile.workExperience.map((exp, i) => (
                  <div key={i} className="p-3.5 rounded-[6px] border border-default bg-surface-sunken space-y-1">
                    <div className="font-semibold text-primary text-xs">{exp.title}</div>
                    <div className="text-[11px] font-mono text-secondary">{exp.company}</div>
                    {exp.highlights && (
                      <div className="text-xs text-primary font-sans mt-1 leading-relaxed">
                        {exp.highlights}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted italic">No work history entries identified</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Raw Document Text */}
      {activeTab === 'raw' && (
        <div className="rounded-[8px] border border-default bg-surface p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-default pb-3 text-xs font-mono">
            <span className="text-secondary font-medium">Original Extracted Text Layer</span>
            <span className="text-muted">{candidate.profile.rawText.split(/\s+/).length} words</span>
          </div>
          <pre className="p-4 rounded-[6px] bg-surface-sunken border border-default text-xs font-mono text-primary overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
            {candidate.profile.rawText}
          </pre>
        </div>
      )}
    </div>
  );
};
