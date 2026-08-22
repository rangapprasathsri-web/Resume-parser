import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Printer,
  Download,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  Check,
  HelpCircle,
  Briefcase,
  GraduationCap,
  Layers,
  Search,
  Filter,
  SlidersHorizontal,
  FileSpreadsheet,
  FileCode,
  CheckSquare,
  Square,
  RotateCcw,
} from 'lucide-react';
import { JobScreeningSession, FinalCandidateAnalysis, RecommendationTier } from '../../types';
import {
  exportCandidatesToCsv,
  exportCandidatesToJson,
  exportRequirementsMatrixCsv,
} from '../../utils/exportHelpers';

interface ConsolidatedCandidatesReportModalProps {
  session: JobScreeningSession;
  selectedCandidates: FinalCandidateAnalysis[];
  onClose: () => void;
}

export const ConsolidatedCandidatesReportModal: React.FC<ConsolidatedCandidatesReportModalProps> = ({
  session,
  selectedCandidates: initialCandidates,
  onClose,
}) => {
  // Content toggles
  const [includeQuotes, setIncludeQuotes] = useState(true);
  const [includeInterviewQuestions, setIncludeInterviewQuestions] = useState(true);
  const [includeStrengthsGaps, setIncludeStrengthsGaps] = useState(true);
  const [includeSkillsTable, setIncludeSkillsTable] = useState(true);
  const [pageBreakPerCandidate, setPageBreakPerCandidate] = useState(true);

  // In-modal filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [minScore, setMinScore] = useState<number>(0);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('ALL');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Individual selection state (initialized to all provided candidates)
  const allPool = useMemo(() => {
    return session.candidates || initialCandidates || [];
  }, [session, initialCandidates]);

  const [activeSelectedIds, setActiveSelectedIds] = useState<Set<string>>(() => {
    const initIds = initialCandidates && initialCandidates.length > 0
      ? initialCandidates.map((c) => c.candidateId)
      : allPool.map((c) => c.candidateId);
    return new Set(initIds);
  });

  const printContainerRef = useRef<HTMLDivElement>(null);

  // Available skills from JD
  const availableSkills = useMemo(() => {
    const skills = new Set<string>();
    session.parsedJd?.requirements?.forEach((r) => {
      r.keywords?.forEach((k) => skills.add(k));
    });
    session.parsedJd?.requiredSkills?.forEach((s) => skills.add(s));
    return Array.from(skills).sort();
  }, [session]);

  // Filter candidate pool
  const filteredCandidates = useMemo(() => {
    return allPool.filter((cand) => {
      // 1. Must be checked in the active selection
      if (!activeSelectedIds.has(cand.candidateId)) {
        return false;
      }

      // 2. Search query filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesName = cand.candidateName?.toLowerCase().includes(q);
        const matchesFile = cand.fileName?.toLowerCase().includes(q);
        const matchesSummary = cand.relevanceSummary?.toLowerCase().includes(q);
        const matchesSkill = cand.profile?.skills?.some((s) => s.toLowerCase().includes(q));
        if (!matchesName && !matchesFile && !matchesSummary && !matchesSkill) {
          return false;
        }
      }

      // 3. Recommendation Tier filter
      if (selectedTier !== 'ALL' && cand.recommendation !== selectedTier) {
        return false;
      }

      // 4. Min Score filter
      if (cand.comprehensiveScore < minScore) {
        return false;
      }

      // 5. Skill requirement filter
      if (selectedSkillFilter !== 'ALL') {
        const skillLower = selectedSkillFilter.toLowerCase();
        const hasAtsMatch = cand.ats?.matchedKeywords?.some((k) => k.toLowerCase() === skillLower);
        const hasProfileSkill = cand.profile?.skills?.some((s) => s.toLowerCase() === skillLower);
        const hasReqMatch = cand.ats?.matchedRequirements?.some(
          (m) => m.requirement.toLowerCase().includes(skillLower) && m.status === 'MATCHED'
        );
        if (!hasAtsMatch && !hasProfileSkill && !hasReqMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allPool, activeSelectedIds, searchTerm, selectedTier, minScore, selectedSkillFilter]);

  // Sorted candidates for report
  const candidatesToReport = useMemo(() => {
    return [...filteredCandidates].sort(
      (a, b) => (a.rank || 999) - (b.rank || 999) || (b.comprehensiveScore || 0) - (a.comprehensiveScore || 0)
    );
  }, [filteredCandidates]);

  // Selection toggle handlers
  const handleToggleCandidate = (id: string) => {
    setActiveSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setActiveSelectedIds(new Set(allPool.map((c) => c.candidateId)));
  };

  const handleDeselectAll = () => {
    setActiveSelectedIds(new Set());
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedTier('ALL');
    setMinScore(0);
    setSelectedSkillFilter('ALL');
    handleSelectAll();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    exportCandidatesToCsv(candidatesToReport, session.title);
  };

  const handleDownloadJson = () => {
    exportCandidatesToJson(candidatesToReport, session);
  };

  const handleDownloadMatrixCsv = () => {
    exportRequirementsMatrixCsv(session, candidatesToReport);
  };

  const handleDownloadHtml = () => {
    if (!printContainerRef.current) return;
    const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EvidenceFirst - Candidate Screening Report - ${session.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1c1b1a; margin: 0; padding: 24px; background: #fafaf9; }
    .container { max-width: 960px; margin: 0 auto; background: #ffffff; padding: 36px; border: 1px solid #e5e4e1; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    h1 { font-size: 24px; margin: 4px 0 12px 0; color: #1c1b1a; }
    h2 { font-size: 16px; margin: 24px 0 12px 0; border-bottom: 2px solid #e5e4e1; padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; font-family: monospace; color: #4338ca; }
    h3 { font-size: 14px; margin: 16px 0 8px 0; font-weight: 600; color: #1c1b1a; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; font-size: 12px; }
    th { background: #f4f4f3; text-align: left; padding: 8px 12px; border: 1px solid #e5e4e1; font-family: monospace; font-size: 11px; text-transform: uppercase; color: #6b6963; }
    td { padding: 8px 12px; border: 1px solid #e5e4e1; vertical-align: top; }
    .page-break { page-break-before: always; break-before: page; margin-top: 32px; padding-top: 24px; border-top: 2px dashed #e5e4e1; }
    .badge { display: inline-block; padding: 2px 6px; font-size: 10px; font-family: monospace; font-weight: 600; border-radius: 4px; border: 1px solid transparent; }
    .quote-box { background: #f9f9f8; border-left: 3px solid #4338ca; padding: 8px 12px; font-style: italic; font-size: 11px; color: #444; margin-top: 4px; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .container { border: none; box-shadow: none; padding: 0; max-width: 100%; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; break-before: page; border-top: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    ${printContainerRef.current.innerHTML}
  </div>
</body>
</html>`;

    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_${(session.title || 'Job').replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTierLabel = (tier?: RecommendationTier) => {
    switch (tier) {
      case 'EXCELLENT_MATCH':
        return 'Excellent Match (90-100%)';
      case 'HIGH_MATCH':
        return 'High Match (80-89%)';
      case 'GOOD_MATCH':
        return 'Good Match (70-79%)';
      case 'MODERATE_MATCH':
        return 'Moderate Match (60-69%)';
      case 'LOW_MATCH':
      default:
        return 'Low Match (<60%)';
    }
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedTier !== 'ALL' ||
    minScore > 0 ||
    selectedSkillFilter !== 'ALL' ||
    activeSelectedIds.size < allPool.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-surface border border-default rounded-[10px] w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-default flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-sunken no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary uppercase tracking-wide">
                  Export & Download Screening Data
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 text-accent font-semibold border border-accent/20">
                  {candidatesToReport.length} of {allPool.length} Filtered
                </span>
              </div>
              <p className="text-[11px] text-secondary font-sans truncate max-w-sm sm:max-w-md">
                Position: <strong className="text-primary">{session.title}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors cursor-pointer border ${
                showFilterDrawer || hasActiveFilters
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface hover:bg-surface-sunken border-default text-primary'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters & Criteria</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              )}
            </button>

            {/* Quick Export Formats */}
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={candidatesToReport.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-default bg-surface hover:bg-surface-sunken text-primary text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              title="Download Filtered CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              disabled={candidatesToReport.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-default bg-surface hover:bg-surface-sunken text-primary text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              title="Download Filtered structured JSON data"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>JSON</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              disabled={candidatesToReport.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-default bg-surface hover:bg-surface-sunken text-primary text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              title="Download standalone HTML document"
            >
              <Download className="w-3.5 h-3.5" />
              <span>HTML</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={candidatesToReport.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-accent text-white hover:bg-accent-hover text-xs font-medium transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              title="Print or Save as Vector PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF / Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[6px] text-secondary hover:text-primary hover:bg-surface-sunken transition-colors cursor-pointer ml-1"
              title="Close report modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter & Criteria Toolbar Bar (Collapsible or always visible) */}
        {showFilterDrawer && (
          <div className="p-4 border-b border-default bg-surface-sunken/80 space-y-3.5 no-print animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-accent" />
                <span className="text-xs font-mono font-bold text-primary uppercase">
                  Filter Desired Data For Export
                </span>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-secondary hover:text-accent transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>

            {/* Filter Controls Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search input */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted uppercase block">
                  Search Candidate / Skill
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search candidate name..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-[6px] border border-default bg-surface text-primary focus:outline-none focus:border-accent"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Recommendation Tier Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted uppercase block">
                  Recommendation Tier
                </label>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="w-full py-1.5 px-2.5 text-xs rounded-[6px] border border-default bg-surface text-primary focus:outline-none focus:border-accent font-sans"
                >
                  <option value="ALL">All Recommendation Tiers</option>
                  <option value="EXCELLENT_MATCH">Excellent Match (90-100%)</option>
                  <option value="HIGH_MATCH">High Match (80-89%)</option>
                  <option value="GOOD_MATCH">Good Match (70-79%)</option>
                  <option value="MODERATE_MATCH">Moderate Match (60-69%)</option>
                  <option value="LOW_MATCH">Low Match (&lt;60%)</option>
                </select>
              </div>

              {/* Score Threshold */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted uppercase block">
                  Min Fit Score Cutoff ({minScore}%)
                </label>
                <select
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full py-1.5 px-2.5 text-xs rounded-[6px] border border-default bg-surface text-primary focus:outline-none focus:border-accent font-sans"
                >
                  <option value={0}>Any Score (≥0%)</option>
                  <option value={80}>≥ 80% (High / Excellent Match)</option>
                  <option value={70}>≥ 70% (Good Match and above)</option>
                  <option value={60}>≥ 60% (Moderate and above)</option>
                  <option value={50}>≥ 50% Cutoff</option>
                </select>
              </div>

              {/* Skill / Requirement filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted uppercase block">
                  Filter by Matched Skill
                </label>
                <select
                  value={selectedSkillFilter}
                  onChange={(e) => setSelectedSkillFilter(e.target.value)}
                  className="w-full py-1.5 px-2.5 text-xs rounded-[6px] border border-default bg-surface text-primary focus:outline-none focus:border-accent font-sans"
                >
                  <option value="ALL">All Skills</option>
                  {availableSkills.map((sk) => (
                    <option key={sk} value={sk}>
                      {sk}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Candidate Selector & Section Inclusions Bar */}
            <div className="pt-2 border-t border-default flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Individual Candidate Checkbox Pills */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-muted uppercase">Select:</span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] font-mono text-accent hover:underline cursor-pointer"
                >
                  Select All ({allPool.length})
                </button>
                <span className="text-muted">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-[11px] font-mono text-secondary hover:underline cursor-pointer"
                >
                  Deselect All
                </button>
              </div>

              {/* Section Inclusions Checkboxes */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-secondary">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-primary">
                  <input
                    type="checkbox"
                    checked={includeSkillsTable}
                    onChange={(e) => setIncludeSkillsTable(e.target.checked)}
                    className="rounded text-accent focus:ring-0 cursor-pointer"
                  />
                  <span>Skills Table</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-primary">
                  <input
                    type="checkbox"
                    checked={includeQuotes}
                    onChange={(e) => setIncludeQuotes(e.target.checked)}
                    className="rounded text-accent focus:ring-0 cursor-pointer"
                  />
                  <span>Evidence Quotes</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-primary">
                  <input
                    type="checkbox"
                    checked={includeStrengthsGaps}
                    onChange={(e) => setIncludeStrengthsGaps(e.target.checked)}
                    className="rounded text-accent focus:ring-0 cursor-pointer"
                  />
                  <span>Strengths & Gaps</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-primary">
                  <input
                    type="checkbox"
                    checked={includeInterviewQuestions}
                    onChange={(e) => setIncludeInterviewQuestions(e.target.checked)}
                    className="rounded text-accent focus:ring-0 cursor-pointer"
                  />
                  <span>Interview Questions</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-primary">
                  <input
                    type="checkbox"
                    checked={pageBreakPerCandidate}
                    onChange={(e) => setPageBreakPerCandidate(e.target.checked)}
                    className="rounded text-accent focus:ring-0 cursor-pointer"
                  />
                  <span>Page Breaks</span>
                </label>
              </div>
            </div>

            {/* Candidate quick-pick chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {allPool.map((c) => {
                const isSelected = activeSelectedIds.has(c.candidateId);
                return (
                  <button
                    key={c.candidateId}
                    type="button"
                    onClick={() => handleToggleCandidate(c.candidateId)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-sans border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-accent/10 border-accent/30 text-accent font-medium'
                        : 'bg-surface border-default text-muted hover:text-secondary opacity-60'
                    }`}
                  >
                    {isSelected ? <CheckSquare className="w-3 h-3 text-accent" /> : <Square className="w-3 h-3" />}
                    <span>{c.candidateName}</span>
                    <span className="font-mono text-[10px] opacity-80">({c.comprehensiveScore}%)</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Printable Report Document Body */}
        <div
          ref={printContainerRef}
          className="p-6 sm:p-10 overflow-y-auto space-y-8 text-primary bg-surface font-sans"
        >
          {candidatesToReport.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-surface-sunken border border-default flex items-center justify-center mx-auto text-muted">
                <Filter className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-primary">No candidates match current export filter</h3>
              <p className="text-xs text-secondary max-w-md mx-auto font-sans">
                Adjust your search term, min score cutoff, or tier filters above to include candidates in the download.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-accent text-white text-xs font-medium cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          ) : (
            <>
              {/* SECTION 1: EXECUTIVE COVER & MATRIX */}
              <div className="space-y-6">
                {/* Header Meta */}
                <div className="border-b-2 border-primary/20 pb-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-accent uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>EvidenceFirst Grounded Talent Intelligence</span>
                    </div>
                    <div className="text-[11px] font-mono text-muted">
                      Export Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                    </div>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold text-primary mt-2 tracking-tight">
                    Candidate Screening & Evaluation Report
                  </h1>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-default/70 text-xs font-mono">
                    <div>
                      <span className="text-muted text-[10px] uppercase block">Target Role</span>
                      <strong className="text-primary text-sm font-sans">{session.title}</strong>
                    </div>
                    <div>
                      <span className="text-muted text-[10px] uppercase block">Candidates Filtered</span>
                      <strong className="text-primary text-sm">
                        {candidatesToReport.length} of {allPool.length}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted text-[10px] uppercase block">Top Fit Score</span>
                      <strong className="text-accent text-sm font-bold">
                        {candidatesToReport[0]?.comprehensiveScore || 0}%
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted text-[10px] uppercase block">Screening Mode</span>
                      <strong className="text-secondary text-sm">Deterministic ATS + LLM</strong>
                    </div>
                  </div>
                </div>

                {/* Candidate Comparison Matrix */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-accent" />
                      <span>Executive Comparison & Ranking Matrix</span>
                    </h2>
                    <span className="text-[11px] font-mono text-muted">
                      Sorted by Overall Fit Score (DESC)
                    </span>
                  </div>

                  <div className="border border-default rounded-[6px] overflow-x-auto bg-surface">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-surface-sunken border-b border-default font-mono text-[10px] text-muted uppercase">
                          <th className="py-2.5 px-3 font-semibold w-12 text-center">Rank</th>
                          <th className="py-2.5 px-3 font-semibold">Candidate</th>
                          <th className="py-2.5 px-3 font-semibold">Experience & Role</th>
                          <th className="py-2.5 px-3 font-semibold text-center">ATS Match</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Agentic</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Overall Fit</th>
                          <th className="py-2.5 px-3 font-semibold">Recommendation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-default font-sans">
                        {candidatesToReport.map((cand, idx) => {
                          const rankNum = cand.rank || idx + 1;
                          const skills = cand.profile?.skills || [];
                          return (
                            <tr key={cand.candidateId || idx} className="hover:bg-surface-sunken/40">
                              <td className="py-2.5 px-3 font-mono font-bold text-center">
                                #{rankNum}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-primary">{cand.candidateName || 'Unknown Candidate'}</div>
                                <div className="text-[10px] font-mono text-muted">{cand.fileName}</div>
                              </td>
                              <td className="py-2.5 px-3 text-secondary text-[11px]">
                                <div>{cand.profile?.yearsOfExperience || 'Timeline parsed'}</div>
                                <div className="text-[10px] text-muted truncate max-w-xs">
                                  {skills.slice(0, 3).join(', ')}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-center font-medium">
                                {cand.atsScore || 0}%
                              </td>
                              <td className="py-2.5 px-3 font-mono text-center font-medium">
                                {cand.analysisMode === 'ats_only' ? '—' : `${cand.agenticScore || 0}%`}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-center font-bold text-accent text-sm">
                                {cand.comprehensiveScore || 0}%
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-surface-sunken border border-default text-primary">
                                  {getTierLabel(cand.recommendation)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* SECTION 2: DETAILED IN-DEPTH CANDIDATE ANALYSIS REPORTS */}
              <div className="space-y-12">
                {candidatesToReport.map((cand, index) => {
                  const rankNum = cand.rank || index + 1;
                  const workExp = cand.profile?.workExperience || [];
                  const eduList = cand.profile?.education || [];
                  const skillsList = cand.profile?.skills || [];
                  const matchedReqs = cand.ats?.matchedRequirements || [];
                  const partialReqs = cand.ats?.partialMatches || [];
                  const missingReqs = cand.ats?.missingRequirements || [];
                  const strengths = cand.strengths || cand.agentic?.strengths || [];
                  const candidateMissing = cand.missingRequirements || cand.agentic?.missingRequirements || [];

                  return (
                    <div
                      key={cand.candidateId || index}
                      className={`space-y-6 pt-6 ${
                        pageBreakPerCandidate ? 'page-break border-t-2 border-primary/20' : 'border-t border-default'
                      }`}
                      style={pageBreakPerCandidate && index > 0 ? { breakBefore: 'page', pageBreakBefore: 'always' } : {}}
                    >
                      {/* Candidate Header & Score Strip */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-surface-sunken/60 p-4 rounded-[8px] border border-default">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-accent text-white">
                              RANK #{rankNum}
                            </span>
                            <h2 className="text-xl font-bold text-primary font-sans">
                              {cand.candidateName}
                            </h2>
                          </div>
                          <div className="text-xs text-secondary font-mono mt-1 flex flex-wrap gap-x-3 gap-y-1">
                            <span>Target Role: <strong className="text-primary">{cand.targetRole || session.title}</strong></span>
                            <span>•</span>
                            <span>File: <span className="text-muted">{cand.fileName}</span></span>
                            {cand.profile?.yearsOfExperience && (
                              <>
                                <span>•</span>
                                <span>Experience: <strong className="text-primary">{cand.profile.yearsOfExperience}</strong></span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Scores Gauge */}
                        <div className="flex items-center gap-3 self-start sm:self-auto font-mono">
                          <div className="text-center px-2.5 py-1 rounded bg-surface border border-default">
                            <div className="text-[9px] text-muted uppercase">ATS Score</div>
                            <div className="text-sm font-bold text-primary">{cand.atsScore || 0}%</div>
                          </div>
                          <div className="text-center px-2.5 py-1 rounded bg-surface border border-default">
                            <div className="text-[9px] text-muted uppercase">Agentic Fit</div>
                            <div className="text-sm font-bold text-primary">
                              {cand.analysisMode === 'ats_only' ? 'N/A' : `${cand.agenticScore || 0}%`}
                            </div>
                          </div>
                          <div className="text-center px-3 py-1 rounded bg-accent/10 border border-accent/20">
                            <div className="text-[9px] text-accent font-bold uppercase">Overall Match</div>
                            <div className="text-base font-extrabold text-accent">{cand.comprehensiveScore || 0}%</div>
                          </div>
                        </div>
                      </div>

                      {/* Profile Summary & Skills Taxonomy */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        {/* Work Experience */}
                        <div className="p-3 rounded-[6px] border border-default bg-surface space-y-1.5">
                          <div className="font-mono text-[10px] text-muted uppercase font-bold flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-secondary" />
                            <span>Background & Roles</span>
                          </div>
                          <div className="space-y-1 text-secondary text-[11px]">
                            {workExp.slice(0, 3).map((w, i) => (
                              <div key={i} className="truncate">
                                <strong className="text-primary">{w.title}</strong> {w.company ? `at ${w.company}` : ''}
                              </div>
                            ))}
                            {workExp.length === 0 && (
                              <div className="italic text-muted">Work history extracted from timeline</div>
                            )}
                          </div>
                        </div>

                        {/* Education */}
                        <div className="p-3 rounded-[6px] border border-default bg-surface space-y-1.5">
                          <div className="font-mono text-[10px] text-muted uppercase font-bold flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-secondary" />
                            <span>Education & Credentials</span>
                          </div>
                          <div className="space-y-1 text-secondary text-[11px]">
                            {eduList.map((e, i) => (
                              <div key={i}>
                                <strong className="text-primary">{e.degree}</strong> {e.institution ? `— ${e.institution}` : ''}
                              </div>
                            ))}
                            {eduList.length === 0 && (
                              <div className="italic text-muted">Education details verified from resume text</div>
                            )}
                          </div>
                        </div>

                        {/* Key Technical Skills */}
                        <div className="p-3 rounded-[6px] border border-default bg-surface space-y-1.5">
                          <div className="font-mono text-[10px] text-muted uppercase font-bold flex items-center gap-1">
                            <Layers className="w-3 h-3 text-secondary" />
                            <span>Verified Technical Skills</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {skillsList.slice(0, 8).map((sk) => (
                              <span
                                key={sk}
                                className="inline-block px-1.5 py-0.2 rounded text-[10px] font-mono bg-surface-sunken border border-default text-secondary"
                              >
                                {sk}
                              </span>
                            ))}
                            {skillsList.length === 0 && (
                              <span className="italic text-muted">Skills extracted from resume content</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* LLM Agentic Executive Summary */}
                      <div className="p-4 rounded-[6px] border border-accent/20 bg-accent/5 space-y-2">
                        <div className="font-mono text-xs font-bold text-accent uppercase flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Executive Evaluation & Match Justification</span>
                        </div>
                        <p className="text-xs text-primary font-sans leading-relaxed">
                          {cand.relevanceSummary || cand.agentic?.relevanceSummary || 'Candidate screened and evaluated against job requirements.'}
                        </p>
                      </div>

                      {/* Grounded ATS Requirements Evidence Table (if enabled) */}
                      {includeSkillsTable && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-mono font-bold uppercase tracking-wide text-primary flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-status-matched" />
                              <span>Grounded Requirement Evidence Audit</span>
                            </h3>
                            <span className="text-[11px] font-mono text-muted">
                              {matchedReqs.length} Matched / {missingReqs.length} Gaps
                            </span>
                          </div>

                          <div className="border border-default rounded-[6px] overflow-hidden bg-surface">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-surface-sunken border-b border-default font-mono text-[10px] text-muted uppercase">
                                  <th className="py-2 px-3 w-28">Status</th>
                                  <th className="py-2 px-3 w-1/3">Target Job Requirement</th>
                                  <th className="py-2 px-3">Grounded Resume Proof & Verbatim Evidence</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-default">
                                {/* Matched Requirements */}
                                {matchedReqs.map((m, mIdx) => (
                                  <tr key={`m_${mIdx}`} className="bg-status-matched/5">
                                    <td className="py-2.5 px-3 align-top">
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-status-matched/15 text-status-matched border border-status-matched/30">
                                        <Check className="w-2.5 h-2.5" />
                                        <span>MATCHED</span>
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 align-top font-medium text-primary">
                                      {m.requirement}
                                      {m.matchedKeywords && m.matchedKeywords.length > 0 && (
                                        <div className="text-[10px] font-mono text-secondary mt-0.5">
                                          Keywords: {m.matchedKeywords.join(', ')}
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 align-top text-secondary text-[11px]">
                                      {includeQuotes && m.evidenceQuote ? (
                                        <div className="p-2 rounded bg-surface border border-default/70 font-mono text-[11px] text-primary italic">
                                          "{m.evidenceQuote}"
                                        </div>
                                      ) : (
                                        <span>Verified in resume experience</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}

                                {/* Partial Matches */}
                                {partialReqs.map((p, pIdx) => (
                                  <tr key={`p_${pIdx}`} className="bg-status-partial/5">
                                    <td className="py-2.5 px-3 align-top">
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-status-partial/15 text-status-partial border border-status-partial/30">
                                        <AlertTriangle className="w-2.5 h-2.5" />
                                        <span>PARTIAL</span>
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 align-top font-medium text-primary">
                                      {p.requirement}
                                    </td>
                                    <td className="py-2.5 px-3 align-top text-secondary text-[11px]">
                                      {includeQuotes && p.evidenceQuote ? (
                                        <div className="p-2 rounded bg-surface border border-default/70 font-mono text-[11px] text-primary italic">
                                          "{p.evidenceQuote}"
                                        </div>
                                      ) : (
                                        <span>Partial keyword alignment</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}

                                {/* Missing Requirements */}
                                {missingReqs.map((miss, missIdx) => (
                                  <tr key={`miss_${missIdx}`} className="bg-status-missing/5">
                                    <td className="py-2 px-3 align-top">
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-status-missing/15 text-status-missing border border-status-missing/30">
                                        <X className="w-2.5 h-2.5" />
                                        <span>MISSING</span>
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 align-top font-medium text-primary" colSpan={2}>
                                      {miss.requirement}
                                      <span className="text-[10px] font-mono text-muted ml-2">
                                        (No direct textual verification found in resume)
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Strengths & Missing Gaps Side-by-Side (if enabled) */}
                      {includeStrengthsGaps && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          {/* Strengths */}
                          <div className="p-3.5 rounded-[6px] border border-default bg-surface space-y-2">
                            <div className="font-mono text-xs font-bold text-status-matched uppercase flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Key Identified Strengths</span>
                            </div>
                            <ul className="space-y-1.5 text-primary text-[11px] list-disc list-inside">
                              {strengths.length > 0 ? (
                                strengths.map((st, i) => (
                                  <li key={i} className="leading-snug">
                                    {st}
                                  </li>
                                ))
                              ) : (
                                <li className="italic text-muted">Demonstrated foundational technical capabilities.</li>
                              )}
                            </ul>
                          </div>

                          {/* Concerns & Missing Criteria */}
                          <div className="p-3.5 rounded-[6px] border border-default bg-surface space-y-2">
                            <div className="font-mono text-xs font-bold text-status-missing uppercase flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Identified Skill & Experience Gaps</span>
                            </div>
                            <ul className="space-y-1.5 text-secondary text-[11px] list-disc list-inside">
                              {candidateMissing.length > 0 ? (
                                candidateMissing.map((gap, i) => (
                                  <li key={i} className="leading-snug text-primary">
                                    {gap}
                                  </li>
                                ))
                              ) : (
                                <li className="italic text-muted">No critical missing requirements identified.</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Interview Probing Questions (if enabled) */}
                      {includeInterviewQuestions && (
                        <div className="p-4 rounded-[6px] border border-default bg-surface-sunken/40 space-y-2">
                          <div className="font-mono text-xs font-bold text-primary uppercase flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-accent" />
                            <span>Suggested Interview Probing Questions</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="p-2.5 rounded bg-surface border border-default text-primary">
                              <strong className="block text-[11px] font-mono text-accent mb-0.5">Architecture & Depth</strong>
                              "Can you walk us through the design tradeoffs of your recent systems and how you handled high concurrency?"
                            </div>
                            <div className="p-2.5 rounded bg-surface border border-default text-primary">
                              <strong className="block text-[11px] font-mono text-accent mb-0.5">Gap Verification</strong>
                              {candidateMissing.length > 0 ? (
                                `"How much hands-on production experience do you have with ${candidateMissing[0]}?"`
                              ) : (
                                '"How do you stay current with evolving cloud and distributed patterns?"'
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Report Footer */}
              <div className="pt-8 border-t border-default text-center text-xs font-mono text-muted space-y-1">
                <div>EvidenceFirst Grounded ATS & Agentic Screening Audit</div>
                <div>This consolidated report contains deterministic keyword matching and verified resume textual citations.</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
