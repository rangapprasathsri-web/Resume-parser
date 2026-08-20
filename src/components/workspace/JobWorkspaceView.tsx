import React, { useState } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Plus,
  ArrowLeft,
  FileText,
  Award,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { JobScreeningSession, FinalCandidateAnalysis, RecommendationTier } from '../../types';

interface JobWorkspaceViewProps {
  session: JobScreeningSession;
  onSelectCandidate: (candidate: FinalCandidateAnalysis) => void;
  onAddResumes: () => void;
  onBack: () => void;
  onExportReport: () => void;
}

export const JobWorkspaceView: React.FC<JobWorkspaceViewProps> = ({
  session,
  onSelectCandidate,
  onAddResumes,
  onBack,
  onExportReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'overall' | 'ats' | 'agentic' | 'name'>('overall');

  // Filter candidates
  const filteredCandidates = session.candidates.filter((cand) => {
    const matchesSearch =
      cand.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cand.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cand.profile.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTier !== 'ALL' && cand.recommendation !== filterTier) {
      return false;
    }

    return true;
  });

  // Sort candidates
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (sortBy === 'overall') return b.comprehensiveScore - a.comprehensiveScore;
    if (sortBy === 'ats') return b.atsScore - a.atsScore;
    if (sortBy === 'agentic') return b.agenticScore - a.agenticScore;
    if (sortBy === 'name') return a.candidateName.localeCompare(b.candidateName);
    return 0;
  });

  const getTierBadge = (tier: RecommendationTier) => {
    switch (tier) {
      case 'EXCELLENT_MATCH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-status-matched/10 text-status-matched border border-status-matched/20">
            Excellent Match
          </span>
        );
      case 'HIGH_MATCH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            High Match
          </span>
        );
      case 'GOOD_MATCH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-status-partial/10 text-status-partial border border-status-partial/20">
            Good Match
          </span>
        );
      case 'MODERATE_MATCH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Moderate Match
          </span>
        );
      case 'LOW_MATCH':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-status-missing/10 text-status-missing border border-status-missing/20">
            Low Match
          </span>
        );
    }
  };

  const getModeBadge = (mode: string) => {
    if (mode === 'openrouter') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">
          <Sparkles className="w-2.5 h-2.5" />
          <span>AI + ATS</span>
        </span>
      );
    }
    if (mode === 'ats_fallback') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-secondary bg-surface-sunken px-1.5 py-0.5 rounded border border-default">
          <Zap className="w-2.5 h-2.5" />
          <span>ATS Fallback</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-secondary bg-surface-sunken px-1.5 py-0.5 rounded border border-default">
        <span>ATS Only</span>
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Top Navigation & Workspace Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-[6px] border border-default text-secondary hover:text-primary hover:bg-surface-sunken transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold text-primary tracking-tight">
                {session.title}
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-sunken border border-default text-secondary">
                {session.candidateCount} Candidates
              </span>
            </div>
            <p className="text-xs text-secondary font-sans mt-0.5">
              Workspace ID: <span className="font-mono text-muted">{session.jobId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onExportReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-default text-primary hover:bg-surface-sunken text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Batch Report</span>
          </button>
          <button
            type="button"
            onClick={onAddResumes}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Resumes</span>
          </button>
        </div>
      </div>

      {/* Summary Score Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-[8px] border border-default bg-surface flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-muted uppercase">Top Candidate Score</div>
            <div className="text-xl font-bold font-mono text-primary mt-0.5">
              {session.topScore > 0 ? `${session.topScore}%` : '—'}
            </div>
          </div>
          <Award className="w-6 h-6 text-accent opacity-80" strokeWidth={1.5} />
        </div>

        <div className="p-3.5 rounded-[8px] border border-default bg-surface flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-muted uppercase">Average Batch Score</div>
            <div className="text-xl font-bold font-mono text-primary mt-0.5">
              {session.averageScore > 0 ? `${session.averageScore}%` : '—'}
            </div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-secondary opacity-80" strokeWidth={1.5} />
        </div>

        <div className="p-3.5 rounded-[8px] border border-default bg-surface flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-muted uppercase">Evaluated Criteria</div>
            <div className="text-xl font-bold font-mono text-primary mt-0.5">
              {session.parsedJd?.requirements?.length || 5} JD Requirements
            </div>
          </div>
          <FileText className="w-6 h-6 text-secondary opacity-80" strokeWidth={1.5} />
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="rounded-[8px] border border-default bg-surface p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search
            className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
            strokeWidth={1.5}
          />
          <input
            type="text"
            placeholder="Search candidate, filename, or skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-sans bg-surface-sunken border border-default rounded-[6px] text-primary placeholder:text-muted focus:border-strong focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto text-xs font-mono text-secondary">
          <div className="flex items-center gap-1.5">
            <span>Filter Tier:</span>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="py-1 px-2 text-xs font-mono bg-surface border border-default rounded-[4px] text-primary focus:outline-none"
            >
              <option value="ALL">All Tiers</option>
              <option value="EXCELLENT_MATCH">Excellent (90–100%)</option>
              <option value="HIGH_MATCH">High (80–89%)</option>
              <option value="GOOD_MATCH">Good (70–79%)</option>
              <option value="MODERATE_MATCH">Moderate (60–69%)</option>
              <option value="LOW_MATCH">Low (&lt; 60%)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1 px-2 text-xs font-mono bg-surface border border-default rounded-[4px] text-primary focus:outline-none"
            >
              <option value="overall">Overall Score (DESC)</option>
              <option value="ats">ATS Score (DESC)</option>
              <option value="agentic">Agentic Score (DESC)</option>
              <option value="name">Candidate Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidate Ranking Table */}
      <div className="rounded-[8px] border border-default bg-surface overflow-hidden shadow-sm">
        {sortedCandidates.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm text-secondary font-sans">
              No candidates found matching the selected filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterTier('ALL');
              }}
              className="px-3 py-1.5 rounded-[6px] border border-default text-xs font-medium text-primary hover:bg-surface-sunken cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-default bg-surface-sunken text-[11px] font-mono text-muted uppercase tracking-wider">
                  <th className="py-3 px-4 font-medium w-12">Rank</th>
                  <th className="py-3 px-4 font-medium">Candidate & Resume</th>
                  <th className="py-3 px-4 font-medium">ATS Match</th>
                  <th className="py-3 px-4 font-medium">Agentic Score</th>
                  <th className="py-3 px-4 font-medium">Overall Fit</th>
                  <th className="py-3 px-4 font-medium">Recommendation</th>
                  <th className="py-3 px-4 font-medium">Mode</th>
                  <th className="py-3 px-4 text-right font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default text-xs">
                {sortedCandidates.map((cand, idx) => {
                  const rankNumber = idx + 1;
                  return (
                    <tr
                      key={cand.candidateId}
                      onClick={() => onSelectCandidate(cand)}
                      className="hover:bg-surface-sunken/70 cursor-pointer transition-colors group"
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 font-mono font-bold text-muted group-hover:text-primary">
                        <span
                          className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
                            rankNumber === 1
                              ? 'bg-accent/15 text-accent font-bold'
                              : rankNumber <= 3
                              ? 'bg-surface-sunken text-primary font-semibold'
                              : 'text-muted'
                          }`}
                        >
                          #{rankNumber}
                        </span>
                      </td>

                      {/* Candidate Name & Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-primary group-hover:text-accent transition-colors flex items-center gap-1.5">
                            <span>{cand.candidateName}</span>
                          </div>
                          <div className="text-[11px] text-secondary font-sans truncate max-w-xs">
                            {cand.fileName} • {cand.profile.yearsOfExperience || 'Timeline verified'}
                          </div>
                        </div>
                      </td>

                      {/* ATS Score */}
                      <td className="py-3.5 px-4 font-mono font-medium text-primary">
                        <div className="flex items-center gap-1.5">
                          <span>{cand.atsScore}%</span>
                          <span className="text-[10px] text-muted">
                            ({cand.ats.matchedRequirements.length} matched)
                          </span>
                        </div>
                      </td>

                      {/* Agentic Score */}
                      <td className="py-3.5 px-4 font-mono font-medium text-primary">
                        {cand.analysisMode === 'ats_only' ? (
                          <span className="text-muted text-[11px]">—</span>
                        ) : (
                          <span>{cand.agenticScore}%</span>
                        )}
                      </td>

                      {/* Comprehensive Score */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-primary">
                            {cand.comprehensiveScore}%
                          </span>
                        </div>
                      </td>

                      {/* Recommendation Tier */}
                      <td className="py-3.5 px-4">
                        {getTierBadge(cand.recommendation)}
                      </td>

                      {/* Analysis Mode */}
                      <td className="py-3.5 px-4">
                        {getModeBadge(cand.analysisMode)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectCandidate(cand)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-surface-sunken hover:bg-surface border border-default text-primary text-xs font-medium transition-colors cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5 text-secondary" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
