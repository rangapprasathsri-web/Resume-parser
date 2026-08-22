import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
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
  ChevronRight,
  X,
  Tag,
  Check,
  AlertTriangle,
  Layers,
  CheckSquare,
  Square,
  MinusSquare,
  Printer,
  Flame,
  Grid,
  Users,
  Trash2,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { JobScreeningSession, FinalCandidateAnalysis, RecommendationTier } from '../../types';
import { ConsolidatedCandidatesReportModal } from '../reports/ConsolidatedCandidatesReportModal';
import { CandidateSkillsHeatmap } from './CandidateSkillsHeatmap';
import { AddResumesModal } from './AddResumesModal';
import { deleteCandidateFromSession, deleteCandidatesFromSession } from '../../services/jobStorageService';
import {
  exportCandidatesToCsv,
  exportCandidatesToJson,
} from '../../utils/exportHelpers';

interface JobWorkspaceViewProps {
  session: JobScreeningSession;
  onSelectCandidate: (candidate: FinalCandidateAnalysis) => void;
  onAddResumes?: () => void;
  onUpdateSession?: (session: JobScreeningSession) => void;
  onDeleteSession?: (jobId: string) => void;
  onBack: () => void;
  onExportReport: () => void;
}

type MatchStatusFilter = 'ALL' | 'MATCHED' | 'PARTIAL' | 'MISSING';

export const JobWorkspaceView: React.FC<JobWorkspaceViewProps> = ({
  session,
  onSelectCandidate,
  onAddResumes,
  onUpdateSession,
  onDeleteSession,
  onBack,
  onExportReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('ALL');
  const [skillMatchStatus, setSkillMatchStatus] = useState<MatchStatusFilter>('ALL');
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'overall' | 'ats' | 'agentic' | 'name'>('overall');
  const [workspaceTab, setWorkspaceTab] = useState<'candidates' | 'heatmap'>('candidates');

  // Deletion modals state
  const [candidateToDelete, setCandidateToDelete] = useState<FinalCandidateAnalysis | null>(null);
  const [isDeleteBulkCandidatesOpen, setIsDeleteBulkCandidatesOpen] = useState(false);
  const [isDeleteWorkspaceOpen, setIsDeleteWorkspaceOpen] = useState(false);

  // Add Resumes Modal state
  const [isAddResumesModalOpen, setIsAddResumesModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Multi-Candidate Selection State
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  const [isConsolidatedModalOpen, setIsConsolidatedModalOpen] = useState(false);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const handleConfirmDeleteCandidate = async () => {
    if (!candidateToDelete) return;
    const candName = candidateToDelete.candidateName;
    const candId = candidateToDelete.candidateId;
    setCandidateToDelete(null);
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev);
      next.delete(candId);
      return next;
    });

    try {
      const updated = await deleteCandidateFromSession(session, candId);
      if (onUpdateSession) {
        onUpdateSession(updated);
      }
      setToastMessage(`Removed candidate "${candName}". Cohort updated.`);
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      console.error('Failed to delete candidate:', err);
    }
  };

  const handleConfirmDeleteBulkCandidates = async () => {
    const idsToDelete: string[] = Array.from(selectedCandidateIds);
    if (idsToDelete.length === 0) return;
    setIsDeleteBulkCandidatesOpen(false);
    setSelectedCandidateIds(new Set());

    try {
      const updated = await deleteCandidatesFromSession(session, idsToDelete);
      if (onUpdateSession) {
        onUpdateSession(updated);
      }
      setToastMessage(`Removed ${idsToDelete.length} candidate(s). Cohort updated.`);
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      console.error('Failed to bulk delete candidates:', err);
    }
  };

  const handleConfirmDeleteWorkspace = () => {
    setIsDeleteWorkspaceOpen(false);
    if (onDeleteSession) {
      onDeleteSession(session.jobId);
    }
    onBack();
  };

  // Extract all distinct available skills and requirements from the JD and candidate profiles
  const availableSkills = useMemo(() => {
    const skillsSet = new Set<string>();

    // 1. From Parsed JD skills
    if (session.parsedJd) {
      if (Array.isArray(session.parsedJd.requiredSkills)) {
        session.parsedJd.requiredSkills.forEach((s) => s && skillsSet.add(s.trim()));
      }
      if (Array.isArray(session.parsedJd.preferredSkills)) {
        session.parsedJd.preferredSkills.forEach((s) => s && skillsSet.add(s.trim()));
      }
      if (Array.isArray(session.parsedJd.requirements)) {
        session.parsedJd.requirements.forEach((r) => {
          if (r.text) skillsSet.add(r.text.trim());
          if (Array.isArray(r.keywords)) {
            r.keywords.forEach((k) => k && skillsSet.add(k.trim()));
          }
        });
      }
    }

    // 2. From candidate ATS matched & missing items
    session.candidates.forEach((cand) => {
      cand.ats?.matchedKeywords?.forEach((k) => k && skillsSet.add(k.trim()));
      cand.profile?.skills?.forEach((s) => s && skillsSet.add(s.trim()));
    });

    return Array.from(skillsSet)
      .filter((s) => s.length > 1 && s.length < 60)
      .sort((a, b) => a.localeCompare(b));
  }, [session]);

  // Helper to evaluate a candidate's match status for a specific skill / requirement
  const getCandidateSkillMatchStatus = (
    cand: FinalCandidateAnalysis,
    targetSkill: string
  ): 'MATCHED' | 'PARTIAL' | 'MISSING' => {
    const skillNorm = targetSkill.toLowerCase().trim();

    // Check ATS matched requirements
    const inMatchedReq = cand.ats?.matchedRequirements?.some(
      (r) =>
        r.requirement.toLowerCase().includes(skillNorm) ||
        r.matchedKeywords.some((k) => k.toLowerCase().includes(skillNorm))
    );
    if (inMatchedReq) return 'MATCHED';

    // Check ATS matched keywords
    const inMatchedKeywords = cand.ats?.matchedKeywords?.some(
      (k) => k.toLowerCase().includes(skillNorm) || skillNorm.includes(k.toLowerCase())
    );
    if (inMatchedKeywords) return 'MATCHED';

    // Check Profile verified skills
    const inProfileSkills = cand.profile?.skills?.some(
      (s) => s.toLowerCase().includes(skillNorm) || skillNorm.includes(s.toLowerCase())
    );
    if (inProfileSkills) return 'MATCHED';

    const inLanguages = cand.profile?.programmingLanguages?.some(
      (l) => l.toLowerCase().includes(skillNorm) || skillNorm.includes(l.toLowerCase())
    );
    if (inLanguages) return 'MATCHED';

    const inFrameworks = cand.profile?.frameworks?.some(
      (f) => f.toLowerCase().includes(skillNorm) || skillNorm.includes(f.toLowerCase())
    );
    if (inFrameworks) return 'MATCHED';

    const inDatabases = cand.profile?.databases?.some(
      (d) => d.toLowerCase().includes(skillNorm) || skillNorm.includes(d.toLowerCase())
    );
    if (inDatabases) return 'MATCHED';

    const inCloud = cand.profile?.cloudDevOps?.some(
      (c) => c.toLowerCase().includes(skillNorm) || skillNorm.includes(c.toLowerCase())
    );
    if (inCloud) return 'MATCHED';

    // Check Agentic matched requirements
    const inAgenticMatched = cand.agentic?.matchedRequirements?.some(
      (m) =>
        m.status === 'MATCHED' &&
        (m.requirement.toLowerCase().includes(skillNorm) || skillNorm.includes(m.requirement.toLowerCase()))
    );
    if (inAgenticMatched) return 'MATCHED';

    // Check ATS Partial matches
    const inPartialReq = cand.ats?.partialMatches?.some(
      (r) =>
        r.requirement.toLowerCase().includes(skillNorm) ||
        r.matchedKeywords.some((k) => k.toLowerCase().includes(skillNorm))
    );
    if (inPartialReq) return 'PARTIAL';

    const inAgenticPartial = cand.agentic?.matchedRequirements?.some(
      (m) =>
        m.status === 'PARTIAL' &&
        (m.requirement.toLowerCase().includes(skillNorm) || skillNorm.includes(m.requirement.toLowerCase()))
    );
    if (inAgenticPartial) return 'PARTIAL';

    return 'MISSING';
  };

  // General candidate skill status check
  const candidateMatchesGeneralSkillStatus = (
    cand: FinalCandidateAnalysis,
    statusFilter: MatchStatusFilter
  ): boolean => {
    if (statusFilter === 'ALL') return true;

    if (statusFilter === 'MATCHED') {
      return (cand.ats?.matchedRequirements?.length || 0) > 0 || cand.atsScore >= 65;
    }

    if (statusFilter === 'PARTIAL') {
      return (
        (cand.ats?.partialMatches?.length || 0) > 0 ||
        cand.agentic?.matchedRequirements?.some((m) => m.status === 'PARTIAL') ||
        false
      );
    }

    if (statusFilter === 'MISSING') {
      return (
        (cand.ats?.missingRequirements?.length || 0) > 0 ||
        (cand.agentic?.missingRequirements?.length || 0) > 0
      );
    }

    return true;
  };

  // Filter candidates by search term, specific skill, skill match status, and recommendation tier
  const filteredCandidates = useMemo(() => {
    return session.candidates.filter((cand) => {
      // 1. Text Search Filter (name, filename, skills, or status keywords)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();

        // Check candidate name and filename
        const matchName = cand.candidateName.toLowerCase().includes(term);
        const matchFile = cand.fileName.toLowerCase().includes(term);

        // Check skills across profile categories
        const skillsList = cand.profile?.skills || [];
        const progLangs = cand.profile?.programmingLanguages || [];
        const frameworks = cand.profile?.frameworks || [];
        const databases = cand.profile?.databases || [];
        const cloudDevOps = cand.profile?.cloudDevOps || [];

        const matchSkills =
          skillsList.some((s) => s.toLowerCase().includes(term)) ||
          progLangs.some((l) => l.toLowerCase().includes(term)) ||
          frameworks.some((f) => f.toLowerCase().includes(term)) ||
          databases.some((d) => d.toLowerCase().includes(term)) ||
          cloudDevOps.some((c) => c.toLowerCase().includes(term));

        // Check ATS matched / missing keywords & requirements
        const matchAts =
          cand.ats.matchedKeywords.some((k) => k.toLowerCase().includes(term)) ||
          cand.ats.matchedRequirements.some((r) => r.requirement.toLowerCase().includes(term)) ||
          cand.ats.missingRequirements.some((r) => r.requirement.toLowerCase().includes(term));

        // Check Agentic summary and requirements
        const matchAgentic =
          cand.agentic.relevanceSummary.toLowerCase().includes(term) ||
          cand.agentic.matchedRequirements.some((m) => m.requirement.toLowerCase().includes(term)) ||
          cand.agentic.missingRequirements.some((m) => m.toLowerCase().includes(term));

        // Check status search keywords (e.g. user types "matched", "missing", "partial")
        let matchStatusTerm = false;
        if (term === 'matched' || term === 'status:matched') {
          matchStatusTerm = (cand.ats.matchedRequirements.length || 0) > 0;
        } else if (term === 'missing' || term === 'status:missing') {
          matchStatusTerm = (cand.ats.missingRequirements.length || 0) > 0;
        } else if (term === 'partial' || term === 'status:partial') {
          matchStatusTerm = (cand.ats.partialMatches.length || 0) > 0;
        }

        if (!matchName && !matchFile && !matchSkills && !matchAts && !matchAgentic && !matchStatusTerm) {
          return false;
        }
      }

      // 2. Specific Skill & Match Status Filter
      if (selectedSkill !== 'ALL') {
        const candidateStatus = getCandidateSkillMatchStatus(cand, selectedSkill);
        if (skillMatchStatus !== 'ALL') {
          if (candidateStatus !== skillMatchStatus) {
            return false;
          }
        } else {
          if (candidateStatus === 'MISSING') {
            return false;
          }
        }
      } else if (skillMatchStatus !== 'ALL') {
        if (!candidateMatchesGeneralSkillStatus(cand, skillMatchStatus)) {
          return false;
        }
      }

      // 3. Recommendation Tier Filter
      if (filterTier !== 'ALL' && cand.recommendation !== filterTier) {
        return false;
      }

      return true;
    });
  }, [session, searchTerm, selectedSkill, skillMatchStatus, filterTier]);

  // Sort candidates
  const sortedCandidates = useMemo(() => {
    return [...filteredCandidates].sort((a, b) => {
      if (sortBy === 'overall') return b.comprehensiveScore - a.comprehensiveScore;
      if (sortBy === 'ats') return b.atsScore - a.atsScore;
      if (sortBy === 'agentic') return b.agenticScore - a.agenticScore;
      if (sortBy === 'name') return a.candidateName.localeCompare(b.candidateName);
      return 0;
    });
  }, [filteredCandidates, sortBy]);

  // Multi-Selection Logic
  const allVisibleSelected =
    sortedCandidates.length > 0 &&
    sortedCandidates.every((c) => selectedCandidateIds.has(c.candidateId));

  const someVisibleSelected =
    sortedCandidates.some((c) => selectedCandidateIds.has(c.candidateId)) &&
    !allVisibleSelected;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected]);

  const handleToggleSelectCandidate = (candidateId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev);
      if (next.has(candidateId)) {
        next.delete(candidateId);
      } else {
        next.add(candidateId);
      }
      return next;
    });
  };

  const handleToggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      // Unselect visible
      setSelectedCandidateIds((prev) => {
        const next = new Set(prev);
        sortedCandidates.forEach((c) => next.delete(c.candidateId));
        return next;
      });
    } else {
      // Select all visible
      setSelectedCandidateIds((prev) => {
        const next = new Set(prev);
        sortedCandidates.forEach((c) => next.add(c.candidateId));
        return next;
      });
    }
  };

  const handleSelectTopN = (count: number) => {
    const topCandidates = sortedCandidates.slice(0, count);
    setSelectedCandidateIds(new Set(topCandidates.map((c) => c.candidateId)));
  };

  const handleClearSelection = () => {
    setSelectedCandidateIds(new Set());
  };

  // Selected candidates for report
  const selectedCandidatesForReport = useMemo(() => {
    if (selectedCandidateIds.size === 0) {
      // If none selected, default to all sorted candidates
      return sortedCandidates.length > 0 ? sortedCandidates : session.candidates;
    }
    return session.candidates.filter((c) => selectedCandidateIds.has(c.candidateId));
  }, [session, selectedCandidateIds, sortedCandidates]);

  // Reset all search & filter controls
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedSkill('ALL');
    setSkillMatchStatus('ALL');
    setFilterTier('ALL');
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedSkill !== 'ALL' ||
    skillMatchStatus !== 'ALL' ||
    filterTier !== 'ALL';

  const getTierBadge = (tier: RecommendationTier) => {
    switch (tier) {
      case 'EXCELLENT_MATCH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-status-matched/10 text-status-matched border border-status-matched/20 whitespace-nowrap">
            Excellent Match
          </span>
        );
      case 'HIGH_MATCH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            High Match
          </span>
        );
      case 'GOOD_MATCH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-status-partial/10 text-status-partial border border-status-partial/20 whitespace-nowrap">
            Good Match
          </span>
        );
      case 'MODERATE_MATCH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
            Moderate Match
          </span>
        );
      case 'LOW_MATCH':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-status-missing/10 text-status-missing border border-status-missing/20 whitespace-nowrap">
            Low Match
          </span>
        );
    }
  };

  const getModeBadge = (mode: string) => {
    if (mode === 'openrouter') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20 whitespace-nowrap">
          <Sparkles className="w-2.5 h-2.5" />
          <span>AI + ATS</span>
        </span>
      );
    }
    if (mode === 'ats_fallback') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-secondary bg-surface-sunken px-1.5 py-0.5 rounded border border-default whitespace-nowrap">
          <Zap className="w-2.5 h-2.5" />
          <span>ATS Fallback</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-secondary bg-surface-sunken px-1.5 py-0.5 rounded border border-default whitespace-nowrap">
        <span>ATS Only</span>
      </span>
    );
  };

  // Top quick-filter skills from JD
  const topQuickSkills = useMemo(() => {
    const list: string[] = [];
    if (session.parsedJd?.requiredSkills) {
      list.push(...session.parsedJd.requiredSkills);
    }
    if (session.parsedJd?.preferredSkills) {
      list.push(...session.parsedJd.preferredSkills);
    }
    return Array.from(new Set(list)).slice(0, 6);
  }, [session]);

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

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Quick Download CSV / JSON Buttons */}
          <button
            type="button"
            onClick={() => exportCandidatesToCsv(selectedCandidatesForReport, session.title)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-default bg-surface hover:bg-surface-sunken text-primary text-xs font-medium transition-colors cursor-pointer shadow-xs"
            title="Download filtered candidates as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>CSV ({selectedCandidatesForReport.length})</span>
          </button>

          <button
            type="button"
            onClick={() => exportCandidatesToJson(selectedCandidatesForReport, session)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-default bg-surface hover:bg-surface-sunken text-primary text-xs font-medium transition-colors cursor-pointer shadow-xs"
            title="Download filtered candidate data as JSON"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>JSON</span>
          </button>

          {/* Export Consolidated PDF Report Button */}
          <button
            type="button"
            onClick={() => setIsConsolidatedModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-primary text-white hover:opacity-90 text-xs font-medium transition-opacity cursor-pointer shadow-sm"
            title="Filter and export candidate report"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>
              Export & Filter Report ({selectedCandidatesForReport.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddResumesModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Resumes</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDeleteWorkspaceOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-red-200 dark:border-red-900/60 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium transition-colors cursor-pointer shadow-xs"
            title="Delete this workspace"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Workspace</span>
          </button>
        </div>
      </div>

      {/* Success / Toast Notification */}
      {toastMessage && (
        <div className="p-3 rounded-[6px] bg-status-matched/10 border border-status-matched/30 text-status-matched text-xs font-mono flex items-center justify-between animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-status-matched shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-status-matched/20 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Summary Score Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-[8px] border border-default bg-surface flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-muted uppercase">Top Score</div>
            <div className="text-xl font-bold font-mono text-primary mt-0.5">
              {session.topScore > 0 ? `${session.topScore}%` : '—'}
            </div>
          </div>
          <Award className="w-6 h-6 text-accent opacity-80" strokeWidth={1.5} />
        </div>

        <div className="p-3.5 rounded-[8px] border border-default bg-surface flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-muted uppercase">Average Score</div>
            <div className="text-xl font-bold font-mono text-primary mt-0.5">
              {session.averageScore > 0 ? `${session.averageScore}%` : '—'}
            </div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-secondary opacity-80" strokeWidth={1.5} />
        </div>

        <div className="p-3.5 rounded-[8px] border border-default bg-surface flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-muted uppercase">Requirements</div>
            <div className="text-xl font-bold font-mono text-primary mt-0.5">
              {session.parsedJd?.requirements?.length || 5} Criteria
            </div>
          </div>
          <FileText className="w-6 h-6 text-secondary opacity-80" strokeWidth={1.5} />
        </div>
      </div>

      {/* Workspace Navigation Tabs (Candidates Directory vs Skills & Deficits Heatmap) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-default pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWorkspaceTab('candidates')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[6px] text-xs font-mono transition-colors cursor-pointer border ${
              workspaceTab === 'candidates'
                ? 'bg-primary text-white border-primary font-bold shadow-xs'
                : 'bg-surface text-secondary border-default hover:text-primary hover:bg-surface-sunken'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Candidates</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] ${
                workspaceTab === 'candidates' ? 'bg-white/20 text-white font-bold' : 'bg-surface-sunken text-muted'
              }`}
            >
              {session.candidateCount || session.candidates?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceTab('heatmap')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[6px] text-xs font-mono transition-colors cursor-pointer border ${
              workspaceTab === 'heatmap'
                ? 'bg-accent text-white border-accent font-bold shadow-xs'
                : 'bg-surface text-secondary border-default hover:text-primary hover:bg-surface-sunken'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Skills Heatmap</span>
          </button>
        </div>
      </div>

      {/* RENDER HEATMAP VIEW OR CANDIDATES DIRECTORY */}
      {workspaceTab === 'heatmap' ? (
        <CandidateSkillsHeatmap
          session={session}
          onSelectCandidate={onSelectCandidate}
          onFilterBySkill={(skill) => {
            setSelectedSkill(skill);
            setWorkspaceTab('candidates');
          }}
        />
      ) : (
        <>
          {/* Filter and Search Controls Box */}
          <div className="rounded-[8px] border border-default bg-surface p-3.5 space-y-3">
        {/* Row 1: Search Input & Multi-Criteria Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search
              className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
              strokeWidth={1.5}
            />
            <input
              type="text"
              placeholder="Search candidate name, filename, skill (e.g. Python), or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-xs font-sans bg-surface-sunken border border-default rounded-[6px] text-primary placeholder:text-muted focus:border-strong focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary p-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-secondary">
            {/* Specific Skill Filter */}
            <div className="flex items-center gap-1.5 bg-surface-sunken border border-default rounded-[6px] px-2 py-1">
              <Tag className="w-3 h-3 text-muted shrink-0" />
              <span className="text-[11px] text-muted whitespace-nowrap">Skill:</span>
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="text-xs font-sans bg-transparent text-primary focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                <option value="ALL">All Skills</option>
                {availableSkills.map((sk) => (
                  <option key={sk} value={sk}>
                    {sk}
                  </option>
                ))}
              </select>
            </div>

            {/* Skill Match Status Filter */}
            <div className="flex items-center gap-1.5 bg-surface-sunken border border-default rounded-[6px] px-2 py-1">
              <Filter className="w-3 h-3 text-muted shrink-0" />
              <span className="text-[11px] text-muted whitespace-nowrap">Status:</span>
              <select
                value={skillMatchStatus}
                onChange={(e) => setSkillMatchStatus(e.target.value as MatchStatusFilter)}
                className="text-xs font-mono bg-transparent text-primary focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="MATCHED">Matched (Verified)</option>
                <option value="PARTIAL">Partial Evidence</option>
                <option value="MISSING">Missing / Gaps</option>
              </select>
            </div>

            {/* Recommendation Tier Filter */}
            <div className="flex items-center gap-1.5 bg-surface-sunken border border-default rounded-[6px] px-2 py-1">
              <span className="text-[11px] text-muted whitespace-nowrap">Tier:</span>
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="text-xs font-mono bg-transparent text-primary focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Tiers</option>
                <option value="EXCELLENT_MATCH">Excellent (90–100%)</option>
                <option value="HIGH_MATCH">High (80–89%)</option>
                <option value="GOOD_MATCH">Good (70–79%)</option>
                <option value="MODERATE_MATCH">Moderate (60–69%)</option>
                <option value="LOW_MATCH">Low (&lt; 60%)</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-1.5 bg-surface-sunken border border-default rounded-[6px] px-2 py-1">
              <ArrowUpDown className="w-3 h-3 text-muted shrink-0" />
              <span className="text-[11px] text-muted whitespace-nowrap">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-mono bg-transparent text-primary focus:outline-none cursor-pointer"
              >
                <option value="overall">Overall Fit (DESC)</option>
                <option value="ats">ATS Score (DESC)</option>
                <option value="agentic">Agentic Score (DESC)</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: Quick Skill Tags & Active Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-default/60 text-xs">
          {/* Quick Skill Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-muted mr-1">Quick Skills:</span>
            <button
              type="button"
              onClick={() => {
                setSelectedSkill('ALL');
                setSkillMatchStatus('ALL');
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer border ${
                selectedSkill === 'ALL'
                  ? 'bg-primary text-white border-primary font-medium'
                  : 'bg-surface-sunken text-secondary border-default hover:text-primary'
              }`}
            >
              All
            </button>
            {topQuickSkills.map((sk) => {
              const isSelected = selectedSkill.toLowerCase() === sk.toLowerCase();
              return (
                <button
                  key={sk}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedSkill('ALL');
                    } else {
                      setSelectedSkill(sk);
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-sans transition-colors cursor-pointer border truncate max-w-[150px] ${
                    isSelected
                      ? 'bg-accent text-white border-accent font-medium shadow-sm'
                      : 'bg-surface-sunken text-secondary border-default hover:border-strong hover:text-primary'
                  }`}
                >
                  {sk}
                </button>
              );
            })}
          </div>

          {/* Results Count & Clear Filters */}
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted ml-auto">
            <span>
              Showing <strong className="text-primary">{sortedCandidates.length}</strong> of{' '}
              {session.candidates.length} candidates
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-sunken hover:bg-surface border border-default text-accent hover:underline cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 3: Active Filter Chips Display (when active) */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
            <span className="text-muted mr-1">Active:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-sunken border border-default text-primary">
                <span>Search: "{searchTerm}"</span>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="hover:text-status-missing"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {selectedSkill !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent">
                <span>Skill: {selectedSkill}</span>
                <button
                  type="button"
                  onClick={() => setSelectedSkill('ALL')}
                  className="hover:text-status-missing"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {skillMatchStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-sunken border border-default text-primary">
                <span>Status: {skillMatchStatus}</span>
                <button
                  type="button"
                  onClick={() => setSkillMatchStatus('ALL')}
                  className="hover:text-status-missing"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {filterTier !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-sunken border border-default text-primary">
                <span>Tier: {filterTier.replace('_', ' ')}</span>
                <button
                  type="button"
                  onClick={() => setFilterTier('ALL')}
                  className="hover:text-status-missing"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Multi-Candidate Selection Quick Action Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-[8px] bg-surface border border-default text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary">
            {selectedCandidateIds.size > 0 ? (
              <span className="text-accent">
                {selectedCandidateIds.size} candidate{selectedCandidateIds.size > 1 ? 's' : ''} selected
              </span>
            ) : (
              <span className="text-secondary">0 candidates selected</span>
            )}
          </span>
          <span className="text-muted">•</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleSelectAllVisible}
              className="text-secondary hover:text-primary hover:underline cursor-pointer"
            >
              {allVisibleSelected ? 'Deselect All' : `Select All Visible (${sortedCandidates.length})`}
            </button>
            {sortedCandidates.length >= 3 && (
              <>
                <span className="text-muted">|</span>
                <button
                  type="button"
                  onClick={() => handleSelectTopN(3)}
                  className="text-secondary hover:text-primary hover:underline cursor-pointer"
                >
                  Select Top 3
                </button>
              </>
            )}
            {selectedCandidateIds.size > 0 && (
              <>
                <span className="text-muted">|</span>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-status-missing hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {/* Consolidated Export & Batch Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {selectedCandidateIds.size > 0 && (
            <button
              type="button"
              onClick={() => setIsDeleteBulkCandidatesOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors cursor-pointer shadow-xs"
              title="Delete selected candidates"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedCandidateIds.size})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => exportCandidatesToCsv(selectedCandidatesForReport, session.title)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] border border-default bg-surface hover:bg-surface-sunken text-primary text-xs font-medium transition-colors cursor-pointer"
            title="Download selection as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Download CSV</span>
          </button>

          <button
            type="button"
            onClick={() => exportCandidatesToJson(selectedCandidatesForReport, session)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] border border-default bg-surface hover:bg-surface-sunken text-primary text-xs font-medium transition-colors cursor-pointer"
            title="Download selection as JSON"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={() => setIsConsolidatedModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>
              Report & PDF ({selectedCandidatesForReport.length})
            </span>
          </button>
        </div>
      </div>

      {/* Candidate Ranking Table with Multi-Select Checkboxes */}
      <div className="rounded-[8px] border border-default bg-surface overflow-hidden shadow-sm">
        {sortedCandidates.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-surface-sunken border border-default flex items-center justify-center mx-auto text-muted">
              <Search className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-primary">No candidates found</p>
            <p className="text-xs text-secondary font-sans max-w-sm mx-auto">
              No candidate profiles match the current search term, skill criteria, or match status filters.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-3.5 py-1.5 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors cursor-pointer shadow-sm inline-flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Search & Filters</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-default bg-surface-sunken text-[11px] font-mono text-muted uppercase tracking-wider">
                  {/* Select All Checkbox Column */}
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={handleToggleSelectAllVisible}
                      className="w-4 h-4 rounded border-default text-accent focus:ring-0 cursor-pointer"
                      title={allVisibleSelected ? 'Deselect all visible candidates' : 'Select all visible candidates'}
                    />
                  </th>
                  <th className="py-3 px-3 font-medium w-12 text-center">Rank</th>
                  <th className="py-3 px-4 font-medium">Candidate & Skills</th>
                  <th className="py-3 px-4 font-medium">ATS Match</th>
                  <th className="py-3 px-4 font-medium">Agentic Score</th>
                  <th className="py-3 px-4 font-medium">Overall Fit</th>
                  <th className="py-3 px-4 font-medium">Recommendation</th>
                  <th className="py-3 px-4 font-medium">Mode</th>
                  <th className="py-3 px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default text-xs">
                {sortedCandidates.map((cand, idx) => {
                  const rankNumber = cand.rank || idx + 1;
                  const isSelected = selectedCandidateIds.has(cand.candidateId);
                  const activeSkillStatus =
                    selectedSkill !== 'ALL'
                      ? getCandidateSkillMatchStatus(cand, selectedSkill)
                      : null;

                  return (
                    <tr
                      key={cand.candidateId}
                      onClick={() => onSelectCandidate(cand)}
                      className={`hover:bg-surface-sunken/70 cursor-pointer transition-colors group ${
                        isSelected ? 'bg-accent/5' : ''
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td
                        className="py-3.5 px-3 text-center align-middle"
                        onClick={(e) => handleToggleSelectCandidate(cand.candidateId, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-default text-accent focus:ring-0 cursor-pointer"
                          aria-label={`Select ${cand.candidateName}`}
                        />
                      </td>

                      {/* Rank */}
                      <td className="py-3.5 px-3 font-mono font-bold text-muted group-hover:text-primary text-center align-middle">
                        <span
                          className={`w-6 h-6 rounded flex items-center justify-center text-xs mx-auto ${
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

                      {/* Candidate Name, Info & Key Skill Tags */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-primary group-hover:text-accent transition-colors flex items-center gap-2">
                            <span>{cand.candidateName}</span>
                            {/* If a specific skill is actively filtered, show its exact match status tag */}
                            {activeSkillStatus && (
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                                  activeSkillStatus === 'MATCHED'
                                    ? 'bg-status-matched/10 text-status-matched border-status-matched/20'
                                    : activeSkillStatus === 'PARTIAL'
                                    ? 'bg-status-partial/10 text-status-partial border-status-partial/20'
                                    : 'bg-status-missing/10 text-status-missing border-status-missing/20'
                                }`}
                              >
                                {activeSkillStatus === 'MATCHED' && <Check className="w-2.5 h-2.5" />}
                                {activeSkillStatus === 'PARTIAL' && <AlertTriangle className="w-2.5 h-2.5" />}
                                {activeSkillStatus === 'MISSING' && <X className="w-2.5 h-2.5" />}
                                <span>
                                  {selectedSkill}: {activeSkillStatus}
                                </span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-secondary font-sans truncate max-w-xs">
                            {cand.fileName} • {cand.profile?.yearsOfExperience || 'Timeline verified'}
                          </div>

                          {/* Preview of candidate key verified skills */}
                          {(cand.profile?.skills || []).length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 pt-0.5">
                              {(cand.profile?.skills || []).slice(0, 3).map((sk) => (
                                <span
                                  key={sk}
                                  className="inline-flex items-center text-[10px] font-mono bg-surface-sunken border border-default/70 text-secondary px-1.5 py-0.2 rounded"
                                >
                                  {sk}
                                </span>
                              ))}
                              {(cand.profile?.skills || []).length > 3 && (
                                <span className="text-[10px] font-mono text-muted">
                                  +{(cand.profile?.skills || []).length - 3}
                                </span>
                              )}
                            </div>
                          )}
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
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectCandidate(cand)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-surface-sunken hover:bg-surface border border-default text-primary text-xs font-medium transition-colors cursor-pointer"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3.5 h-3.5 text-secondary" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCandidateToDelete(cand)}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition-colors cursor-pointer"
                            title="Delete candidate"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {/* Candidate Delete Confirmation Modal */}
      {candidateToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-default rounded-[10px] max-w-md w-full p-5 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-status-missing/10 text-status-missing flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-primary">Remove Candidate?</h3>
                <p className="text-xs text-secondary font-sans">
                  Are you sure you want to remove <span className="font-semibold text-primary">"{candidateToDelete.candidateName}"</span> ({candidateToDelete.fileName}) from this screening session?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-default">
              <button
                type="button"
                onClick={() => setCandidateToDelete(null)}
                className="px-3 py-1.5 rounded-[6px] border border-default text-secondary hover:text-primary text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCandidate}
                className="px-3.5 py-1.5 rounded-[6px] bg-status-missing hover:bg-red-600 text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
              >
                Remove Candidate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Candidate Delete Confirmation Modal */}
      {isDeleteBulkCandidatesOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-default rounded-[10px] max-w-md w-full p-5 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-status-missing/10 text-status-missing flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-primary">Remove Selected Candidates?</h3>
                <p className="text-xs text-secondary font-sans">
                  Are you sure you want to remove <span className="font-semibold text-primary">{selectedCandidateIds.size} selected candidate(s)</span> from this screening session? The remaining cohort will be automatically re-ranked.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-default">
              <button
                type="button"
                onClick={() => setIsDeleteBulkCandidatesOpen(false)}
                className="px-3 py-1.5 rounded-[6px] border border-default text-secondary hover:text-primary text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBulkCandidates}
                className="px-3.5 py-1.5 rounded-[6px] bg-status-missing hover:bg-red-600 text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
              >
                Remove {selectedCandidateIds.size} Candidates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Workspace Confirmation Modal */}
      {isDeleteWorkspaceOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-default rounded-[10px] max-w-md w-full p-5 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-status-missing/10 text-status-missing flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-primary">Delete Job Workspace?</h3>
                <p className="text-xs text-secondary font-sans">
                  Are you sure you want to delete <span className="font-semibold text-primary">"{session.title}"</span>? This will remove all candidate analyses and ranking data.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-default">
              <button
                type="button"
                onClick={() => setIsDeleteWorkspaceOpen(false)}
                className="px-3 py-1.5 rounded-[6px] border border-default text-secondary hover:text-primary text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteWorkspace}
                className="px-3.5 py-1.5 rounded-[6px] bg-status-missing hover:bg-red-600 text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
              >
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consolidated Candidates Report Modal */}
      {isConsolidatedModalOpen && (
        <ConsolidatedCandidatesReportModal
          session={session}
          selectedCandidates={selectedCandidatesForReport}
          onClose={() => setIsConsolidatedModalOpen(false)}
        />
      )}

      {/* Add Resumes Directly to Existing Session Modal (Zero JD Prompts) */}
      <AddResumesModal
        session={session}
        isOpen={isAddResumesModalOpen}
        onClose={() => setIsAddResumesModalOpen(false)}
        onSessionUpdated={(updated) => {
          if (onUpdateSession) {
            onUpdateSession(updated);
          }
          setToastMessage(
            `Added ${updated.candidates.length - (session.candidates?.length || 0)} new candidate(s) to "${session.title}". Whole cohort re-ranked.`
          );
          setTimeout(() => {
            setToastMessage(null);
          }, 6000);
        }}
      />
    </div>
  );
};
