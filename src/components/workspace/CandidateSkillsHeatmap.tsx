import React, { useState, useMemo } from 'react';
import {
  Flame,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  Grid,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Info,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  Check,
  X,
  ChevronRight,
} from 'lucide-react';
import { JobScreeningSession, FinalCandidateAnalysis } from '../../types';

interface CandidateSkillsHeatmapProps {
  session: JobScreeningSession;
  onSelectCandidate?: (candidate: FinalCandidateAnalysis) => void;
  onFilterBySkill?: (skill: string) => void;
}

export type SkillCategory = 'ALL' | 'MANDATORY' | 'PREFERRED' | 'LANGUAGES' | 'FRAMEWORKS' | 'CLOUD' | 'DATABASES' | 'CORE';
export type HeatmapViewMode = 'MATRIX' | 'DISTRIBUTION';
export type SkillSortOption = 'COVERAGE_DESC' | 'COVERAGE_ASC' | 'NAME' | 'MANDATORY_FIRST';
export type CandidateSortOption = 'SCORE_DESC' | 'SCORE_ASC' | 'NAME' | 'SKILLS_MATCHED_DESC';

interface SkillHeatmapItem {
  id: string;
  name: string;
  category: string;
  isMandatory: boolean;
  type: 'required' | 'preferred' | 'profile_skill';
  matchedCandidates: string[]; // candidateIds
  partialCandidates: string[]; // candidateIds
  missingCandidates: string[]; // candidateIds
  matchRate: number; // 0 - 100
  evidenceMap: Record<string, { status: 'MATCHED' | 'PARTIAL' | 'MISSING'; quote?: string; keywords?: string[] }>;
}

export const CandidateSkillsHeatmap: React.FC<CandidateSkillsHeatmapProps> = ({
  session,
  onSelectCandidate,
  onFilterBySkill,
}) => {
  const [viewMode, setViewMode] = useState<HeatmapViewMode>('MATRIX');
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>('ALL');
  const [skillSearch, setSkillSearch] = useState('');
  const [skillSort, setSkillSort] = useState<SkillSortOption>('COVERAGE_DESC');
  const [candidateSort, setCandidateSort] = useState<CandidateSortOption>('SCORE_DESC');
  const [hoveredCell, setHoveredCell] = useState<{
    candidateId: string;
    candidateName: string;
    skillName: string;
    status: 'MATCHED' | 'PARTIAL' | 'MISSING';
    quote?: string;
    keywords?: string[];
  } | null>(null);

  const candidates = useMemo(() => session.candidates || [], [session]);
  const totalCandidates = candidates.length;

  // 1. Build unified list of skills with deep evidence extraction across all candidates
  const heatmapSkills = useMemo(() => {
    const map = new Map<string, SkillHeatmapItem>();

    const getOrInitSkill = (
      name: string,
      category: string = 'General',
      isMandatory: boolean = false,
      type: 'required' | 'preferred' | 'profile_skill' = 'profile_skill'
    ) => {
      const cleanName = name.trim();
      const lower = cleanName.toLowerCase();
      if (map.has(lower)) {
        const existing = map.get(lower)!;
        if (isMandatory) existing.isMandatory = true;
        if (type === 'required') existing.type = 'required';
        return existing;
      }
      const item: SkillHeatmapItem = {
        id: lower,
        name: cleanName,
        category,
        isMandatory,
        type,
        matchedCandidates: [],
        partialCandidates: [],
        missingCandidates: [],
        matchRate: 0,
        evidenceMap: {},
      };
      map.set(lower, item);
      return item;
    };

    // A. Extract from Parsed JD
    if (session.parsedJd) {
      if (Array.isArray(session.parsedJd.requiredSkills)) {
        session.parsedJd.requiredSkills.forEach((s) => {
          if (s && s.trim()) getOrInitSkill(s, 'Core Technical', true, 'required');
        });
      }
      if (Array.isArray(session.parsedJd.preferredSkills)) {
        session.parsedJd.preferredSkills.forEach((s) => {
          if (s && s.trim()) getOrInitSkill(s, 'Preferred', false, 'preferred');
        });
      }
      if (Array.isArray(session.parsedJd.requirements)) {
        session.parsedJd.requirements.forEach((req) => {
          if (req.text) {
            getOrInitSkill(req.text, req.category || 'Job Requirement', req.isMandatory, req.isMandatory ? 'required' : 'preferred');
          }
          if (Array.isArray(req.keywords)) {
            req.keywords.forEach((kw) => {
              if (kw && kw.length > 2) {
                getOrInitSkill(kw, req.category || 'Keyword', req.isMandatory, req.isMandatory ? 'required' : 'preferred');
              }
            });
          }
        });
      }
    }

    // B. Extract from Candidates Profile Taxonomy (Languages, Frameworks, Cloud, Databases, Skills)
    candidates.forEach((c) => {
      c.profile?.programmingLanguages?.forEach((l) => l && getOrInitSkill(l, 'Languages', false, 'profile_skill'));
      c.profile?.frameworks?.forEach((f) => f && getOrInitSkill(f, 'Frameworks', false, 'profile_skill'));
      c.profile?.cloudDevOps?.forEach((cd) => cd && getOrInitSkill(cd, 'Cloud & DevOps', false, 'profile_skill'));
      c.profile?.databases?.forEach((db) => db && getOrInitSkill(db, 'Databases', false, 'profile_skill'));
      c.profile?.skills?.slice(0, 10).forEach((sk) => sk && getOrInitSkill(sk, 'General Skills', false, 'profile_skill'));
    });

    // C. Evaluate each candidate against each skill
    const skillList = Array.from(map.values());

    skillList.forEach((skill) => {
      const skillLower = skill.name.toLowerCase();

      candidates.forEach((cand) => {
        let status: 'MATCHED' | 'PARTIAL' | 'MISSING' = 'MISSING';
        let evidenceQuote: string | undefined;
        let matchedKeywords: string[] = [];

        // 1. Check ATS Matched Requirements
        const atsMatchedReq = cand.ats?.matchedRequirements?.find(
          (r) =>
            r.requirement.toLowerCase().includes(skillLower) ||
            r.matchedKeywords?.some((k) => k.toLowerCase().includes(skillLower) || skillLower.includes(k.toLowerCase()))
        );

        if (atsMatchedReq) {
          status = 'MATCHED';
          evidenceQuote = atsMatchedReq.evidenceQuote;
          matchedKeywords = atsMatchedReq.matchedKeywords || [];
        }

        // 2. Check Candidate Profile Skill categories
        if (status === 'MISSING' && cand.profile) {
          const inLangs = cand.profile.programmingLanguages?.some((l) => l.toLowerCase() === skillLower);
          const inFw = cand.profile.frameworks?.some((f) => f.toLowerCase() === skillLower);
          const inDb = cand.profile.databases?.some((d) => d.toLowerCase() === skillLower);
          const inCloud = cand.profile.cloudDevOps?.some((c) => c.toLowerCase() === skillLower);
          const inSkills = cand.profile.skills?.some((s) => s.toLowerCase().includes(skillLower) || skillLower.includes(s.toLowerCase()));

          if (inLangs || inFw || inDb || inCloud || inSkills) {
            status = 'MATCHED';
            evidenceQuote = `Directly verified in candidate skill taxonomy (${cand.profile.yearsOfExperience || 'Experienced'})`;
            matchedKeywords = [skill.name];
          }
        }

        // 3. Check ATS Partial matches
        if (status === 'MISSING') {
          const partialReq = cand.ats?.partialMatches?.find(
            (r) =>
              r.requirement.toLowerCase().includes(skillLower) ||
              r.matchedKeywords?.some((k) => k.toLowerCase().includes(skillLower))
          );
          if (partialReq) {
            status = 'PARTIAL';
            evidenceQuote = partialReq.evidenceQuote || 'Partial alignment found in candidate background';
            matchedKeywords = partialReq.matchedKeywords || [];
          }
        }

        // 4. Check Agentic match evaluation
        if (status === 'MISSING' && cand.agentic?.matchedRequirements) {
          const agenticMatch = cand.agentic.matchedRequirements.find((m) =>
            m.requirement.toLowerCase().includes(skillLower) || skillLower.includes(m.requirement.toLowerCase())
          );
          if (agenticMatch) {
            status = agenticMatch.status === 'MATCHED' ? 'MATCHED' : 'PARTIAL';
            evidenceQuote = agenticMatch.evidenceQuote || agenticMatch.reason;
          }
        }

        // Record in skill item
        if (status === 'MATCHED') {
          skill.matchedCandidates.push(cand.candidateId);
        } else if (status === 'PARTIAL') {
          skill.partialCandidates.push(cand.candidateId);
        } else {
          skill.missingCandidates.push(cand.candidateId);
        }

        skill.evidenceMap[cand.candidateId] = {
          status,
          quote: evidenceQuote,
          keywords: matchedKeywords,
        };
      });

      // Calculate cohort coverage rate
      skill.matchRate =
        totalCandidates > 0
          ? Math.round(((skill.matchedCandidates.length + skill.partialCandidates.length * 0.5) / totalCandidates) * 100)
          : 0;
    });

    return skillList;
  }, [session, candidates, totalCandidates]);

  // 2. Filter & Sort Skills for Display
  const filteredSkills = useMemo(() => {
    return heatmapSkills.filter((s) => {
      // Search filter
      if (skillSearch.trim()) {
        const query = skillSearch.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesCat = s.category.toLowerCase().includes(query);
        if (!matchesName && !matchesCat) return false;
      }

      // Category filter
      if (selectedCategory === 'MANDATORY') return s.isMandatory || s.type === 'required';
      if (selectedCategory === 'PREFERRED') return s.type === 'preferred' && !s.isMandatory;
      if (selectedCategory === 'LANGUAGES') return s.category.toLowerCase().includes('lang');
      if (selectedCategory === 'FRAMEWORKS') return s.category.toLowerCase().includes('framework');
      if (selectedCategory === 'CLOUD') return s.category.toLowerCase().includes('cloud') || s.category.toLowerCase().includes('devops');
      if (selectedCategory === 'DATABASES') return s.category.toLowerCase().includes('data') || s.category.toLowerCase().includes('sql');
      if (selectedCategory === 'CORE') return s.isMandatory || s.type === 'required' || s.type === 'preferred';

      return true;
    });
  }, [heatmapSkills, skillSearch, selectedCategory]);

  const sortedSkills = useMemo(() => {
    return [...filteredSkills].sort((a, b) => {
      if (skillSort === 'COVERAGE_DESC') return b.matchRate - a.matchRate;
      if (skillSort === 'COVERAGE_ASC') return a.matchRate - b.matchRate;
      if (skillSort === 'NAME') return a.name.localeCompare(b.name);
      if (skillSort === 'MANDATORY_FIRST') {
        if (a.isMandatory && !b.isMandatory) return -1;
        if (!a.isMandatory && b.isMandatory) return 1;
        return b.matchRate - a.matchRate;
      }
      return 0;
    });
  }, [filteredSkills, skillSort]);

  // 3. Sort Candidates for Display
  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => {
      if (candidateSort === 'SCORE_DESC') return (b.comprehensiveScore || 0) - (a.comprehensiveScore || 0);
      if (candidateSort === 'SCORE_ASC') return (a.comprehensiveScore || 0) - (b.comprehensiveScore || 0);
      if (candidateSort === 'NAME') return a.candidateName.localeCompare(b.candidateName);
      if (candidateSort === 'SKILLS_MATCHED_DESC') {
        const aMatches = sortedSkills.filter((s) => s.evidenceMap[a.candidateId]?.status === 'MATCHED').length;
        const bMatches = sortedSkills.filter((s) => s.evidenceMap[b.candidateId]?.status === 'MATCHED').length;
        return bMatches - aMatches;
      }
      return 0;
    });
  }, [candidates, candidateSort, sortedSkills]);

  // 4. Cohort Analytics Insights (Common Strengths vs Missing Expertise Gaps)
  const cohortStrengths = useMemo(() => {
    return [...heatmapSkills]
      .filter((s) => s.matchedCandidates.length > 0)
      .sort((a, b) => b.matchedCandidates.length - a.matchedCandidates.length || b.matchRate - a.matchRate)
      .slice(0, 4);
  }, [heatmapSkills]);

  const cohortGaps = useMemo(() => {
    return [...heatmapSkills]
      .filter((s) => s.isMandatory || s.type === 'required' || s.type === 'preferred')
      .sort((a, b) => a.matchedCandidates.length - b.matchedCandidates.length || a.matchRate - b.matchRate)
      .slice(0, 4);
  }, [heatmapSkills]);

  const averageCohortMatchRate = useMemo(() => {
    if (heatmapSkills.length === 0) return 0;
    const sum = heatmapSkills.reduce((acc, s) => acc + s.matchRate, 0);
    return Math.round(sum / heatmapSkills.length);
  }, [heatmapSkills]);

  // Export Matrix as CSV
  const handleExportCsv = () => {
    const headers = ['Rank', 'Candidate Name', 'Fit Score %', 'ATS Score %', ...sortedSkills.map((s) => `"${s.name}"`)];
    const rows = sortedCandidates.map((c, idx) => {
      const row = [
        c.rank || idx + 1,
        `"${c.candidateName}"`,
        c.comprehensiveScore || 0,
        c.atsScore || 0,
        ...sortedSkills.map((s) => {
          const st = s.evidenceMap[c.candidateId]?.status || 'MISSING';
          return `"${st}"`;
        }),
      ];
      return row.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Skills_Heatmap_${session.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-[10px] border border-default bg-surface shadow-sm overflow-hidden space-y-4">
      {/* Top Banner: Header, Mode Switcher & Export */}
      <div className="p-4 sm:p-5 border-b border-default bg-surface-sunken/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[6px] bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-primary">
                Skills Heatmap
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent/10 text-accent font-medium">
                {totalCandidates} Candidates • {heatmapSkills.length} Skills
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Matrix vs Distribution */}
          <div className="flex items-center bg-surface border border-default rounded-[6px] p-0.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => setViewMode('MATRIX')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer ${
                viewMode === 'MATRIX'
                  ? 'bg-primary text-white font-medium shadow-xs'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Matrix</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('DISTRIBUTION')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer ${
                viewMode === 'DISTRIBUTION'
                  ? 'bg-primary text-white font-medium shadow-xs'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Distribution</span>
            </button>
          </div>

          {/* Export Heatmap Data */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-default bg-surface hover:bg-surface-sunken text-primary text-xs font-medium transition-colors cursor-pointer"
            title="Download CSV of the candidate skill matrix"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Cohort Insights Strip (Top Strengths & Critical Talent Gaps) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-4 sm:px-5">
        {/* Most Common Strengths */}
        <div className="p-3.5 rounded-[8px] border border-status-matched/20 bg-status-matched/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-status-matched uppercase">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Top Cohort Strengths</span>
            </div>
            <span className="text-[10px] font-mono text-muted">High saturation</span>
          </div>
          <div className="space-y-1.5">
            {cohortStrengths.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs font-sans">
                <button
                  type="button"
                  onClick={() => onFilterBySkill && onFilterBySkill(s.name)}
                  className="font-medium text-primary hover:text-accent hover:underline truncate max-w-[170px] text-left cursor-pointer"
                  title={`Filter workspace by ${s.name}`}
                >
                  {s.name}
                </button>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="text-secondary font-medium">
                    {s.matchedCandidates.length}/{totalCandidates}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-status-matched/15 text-status-matched font-bold text-[10px]">
                    {Math.round((s.matchedCandidates.length / (totalCandidates || 1)) * 100)}%
                  </span>
                </div>
              </div>
            ))}
            {cohortStrengths.length === 0 && (
              <div className="text-[11px] text-muted italic">No matching skills identified.</div>
            )}
          </div>
        </div>

        {/* Critical Missing Talent Gaps */}
        <div className="p-3.5 rounded-[8px] border border-status-missing/20 bg-status-missing/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-status-missing uppercase">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Critical Talent Gaps</span>
            </div>
            <span className="text-[10px] font-mono text-muted">Required deficits</span>
          </div>
          <div className="space-y-1.5">
            {cohortGaps.map((s) => {
              const gapCount = totalCandidates - s.matchedCandidates.length;
              return (
                <div key={s.id} className="flex items-center justify-between text-xs font-sans">
                  <button
                    type="button"
                    onClick={() => onFilterBySkill && onFilterBySkill(s.name)}
                    className="font-medium text-primary hover:text-status-missing hover:underline truncate max-w-[170px] text-left cursor-pointer"
                    title={`Filter workspace by ${s.name}`}
                  >
                    {s.name}
                  </button>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-secondary font-medium">
                      {gapCount} missing
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-status-missing/15 text-status-missing font-bold text-[10px]">
                      {Math.round((gapCount / (totalCandidates || 1)) * 100)}% gap
                    </span>
                  </div>
                </div>
              );
            })}
            {cohortGaps.length === 0 && (
              <div className="text-[11px] text-muted italic">All core job requirements met.</div>
            )}
          </div>
        </div>

        {/* Cohort Coverage Health Index */}
        <div className="p-3.5 rounded-[8px] border border-default bg-surface-sunken/50 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-primary uppercase">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Cohort Health Index</span>
              </div>
              <span className="text-[10px] font-mono text-muted">Aggregated Fit</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-2xl font-bold font-mono text-primary">{averageCohortMatchRate}%</div>
              <span className="text-xs text-secondary font-sans">avg candidate requirement match</span>
            </div>
          </div>

          <div className="space-y-1 text-[11px] font-mono text-secondary">
            <div className="w-full bg-surface border border-default rounded-full h-2 overflow-hidden">
              <div
                className="bg-accent h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(5, averageCohortMatchRate))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted pt-0.5">
              <span>0% (No overlap)</span>
              <span>100% (Complete match)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Search, Category Selector & Sorters */}
      <div className="px-4 sm:px-5 space-y-2.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pt-1">
          {/* Skill Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search skill, tool or requirement (e.g., Python, Kubernetes, React)..."
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              className="w-full pl-8 pr-8 py-1 text-xs bg-surface-sunken border border-default rounded-[6px] text-primary placeholder:text-muted focus:border-strong focus:outline-none"
            />
            {skillSearch && (
              <button
                type="button"
                onClick={() => setSkillSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Sorters and Category Filter */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-secondary">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-surface-sunken border border-default rounded-[6px] px-2 py-1">
              <Filter className="w-3 h-3 text-muted shrink-0" />
              <span className="text-[11px] text-muted whitespace-nowrap">Filter:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as SkillCategory)}
                className="text-xs font-mono bg-transparent text-primary focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="CORE">Core & Mandatory JD</option>
                <option value="MANDATORY">Mandatory Requirements</option>
                <option value="PREFERRED">Preferred Skills</option>
                <option value="LANGUAGES">Languages</option>
                <option value="FRAMEWORKS">Frameworks</option>
                <option value="CLOUD">Cloud & DevOps</option>
                <option value="DATABASES">Databases</option>
              </select>
            </div>

            {/* Skill Sort */}
            <div className="flex items-center gap-1.5 bg-surface-sunken border border-default rounded-[6px] px-2 py-1">
              <ArrowUpDown className="w-3 h-3 text-muted shrink-0" />
              <span className="text-[11px] text-muted whitespace-nowrap">Skills Sort:</span>
              <select
                value={skillSort}
                onChange={(e) => setSkillSort(e.target.value as SkillSortOption)}
                className="text-xs font-mono bg-transparent text-primary focus:outline-none cursor-pointer"
              >
                <option value="COVERAGE_DESC">Most Possessed (Strengths First)</option>
                <option value="COVERAGE_ASC">Least Possessed (Gaps First)</option>
                <option value="MANDATORY_FIRST">Mandatory First</option>
                <option value="NAME">Alphabetical (A-Z)</option>
              </select>
            </div>

            {/* Candidate Sort (only in matrix mode) */}
            {viewMode === 'MATRIX' && (
              <div className="flex items-center gap-1.5 bg-surface-sunken border border-default rounded-[6px] px-2 py-1">
                <span className="text-[11px] text-muted whitespace-nowrap">Candidates:</span>
                <select
                  value={candidateSort}
                  onChange={(e) => setCandidateSort(e.target.value as CandidateSortOption)}
                  className="text-xs font-mono bg-transparent text-primary focus:outline-none cursor-pointer"
                >
                  <option value="SCORE_DESC">Fit Score (High to Low)</option>
                  <option value="SKILLS_MATCHED_DESC">Skills Matched Count</option>
                  <option value="NAME">Name (A-Z)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Legend strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-default/60 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-muted">Legend:</span>
            <div className="flex items-center gap-1 text-[11px] text-primary">
              <span className="w-3 h-3 rounded-xs bg-status-matched/20 border border-status-matched/40 flex items-center justify-center text-status-matched">
                <Check className="w-2.5 h-2.5" />
              </span>
              <span>Matched / Verified</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-primary">
              <span className="w-3 h-3 rounded-xs bg-status-partial/20 border border-status-partial/40 flex items-center justify-center text-status-partial">
                <AlertTriangle className="w-2 h-2" />
              </span>
              <span>Partial Alignment</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted">
              <span className="w-3 h-3 rounded-xs bg-status-missing/15 border border-status-missing/30 flex items-center justify-center text-status-missing">
                <X className="w-2 h-2" />
              </span>
              <span>Missing Gap</span>
            </div>
          </div>

          <div className="text-[11px] text-muted">
            Showing <strong className="text-primary">{sortedSkills.length}</strong> of {heatmapSkills.length} skills
          </div>
        </div>
      </div>

      {/* Main Visualization Body */}
      <div className="border-t border-default">
        {sortedSkills.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Info className="w-6 h-6 text-muted mx-auto" />
            <p className="text-xs font-semibold text-primary">No skills match the current search or category filter</p>
            <button
              type="button"
              onClick={() => {
                setSkillSearch('');
                setSelectedCategory('ALL');
              }}
              className="text-xs font-mono text-accent hover:underline cursor-pointer"
            >
              Reset Skill Filters
            </button>
          </div>
        ) : viewMode === 'MATRIX' ? (
          /* ========================================================================= */
          /* MODE 1: INTERACTIVE CANDIDATE × SKILLS HEATMAP MATRIX                      */
          /* ========================================================================= */
          <div className="relative overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-sunken border-b border-default text-[10px] font-mono text-muted uppercase">
                  {/* Sticky Candidate Header */}
                  <th className="py-3 px-3 font-semibold sticky left-0 z-20 bg-surface-sunken min-w-[190px] max-w-[220px] shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                    Candidate ({sortedCandidates.length})
                  </th>

                  {/* Candidate Overall Fit Score */}
                  <th className="py-3 px-2 font-semibold text-center w-14">Fit</th>

                  {/* Dynamic Skill Columns */}
                  {sortedSkills.map((skill) => {
                    const matchPercent = Math.round(
                      ((skill.matchedCandidates.length + skill.partialCandidates.length * 0.5) /
                        (totalCandidates || 1)) *
                        100
                    );

                    return (
                      <th
                        key={skill.id}
                        className="py-2.5 px-2 font-normal text-center min-w-[100px] max-w-[130px] border-l border-default/50 hover:bg-surface transition-colors cursor-pointer group"
                        onClick={() => onFilterBySkill && onFilterBySkill(skill.name)}
                        title={`Click to filter workspace by ${skill.name} (${matchPercent}% cohort coverage)`}
                      >
                        <div className="flex flex-col items-center space-y-1">
                          <div className="flex items-center gap-1">
                            {skill.isMandatory && (
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-accent"
                                title="Mandatory Requirement"
                              />
                            )}
                            <span className="font-semibold text-primary group-hover:text-accent truncate max-w-[95px] text-[11px] font-sans">
                              {skill.name}
                            </span>
                          </div>

                          {/* Skill Cohort Coverage Micro-Bar */}
                          <div className="w-full bg-surface-sunken rounded-full h-1.5 overflow-hidden border border-default/40">
                            <div
                              className={`h-full rounded-full ${
                                matchPercent >= 70
                                  ? 'bg-status-matched'
                                  : matchPercent >= 40
                                  ? 'bg-status-partial'
                                  : 'bg-status-missing'
                              }`}
                              style={{ width: `${Math.max(8, matchPercent)}%` }}
                            />
                          </div>

                          <div className="text-[9px] font-mono text-muted flex items-center justify-between w-full px-0.5">
                            <span>{skill.matchedCandidates.length}/{totalCandidates}</span>
                            <span className="font-bold text-primary">{matchPercent}%</span>
                          </div>
                        </div>
                      </th>
                    );
                  })}

                  {/* Summary Coverage Column */}
                  <th className="py-3 px-3 font-semibold text-center min-w-[90px] border-l border-default">
                    Coverage
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-default">
                {sortedCandidates.map((cand, idx) => {
                  const rankNum = cand.rank || idx + 1;
                  const matchedCount = sortedSkills.filter(
                    (s) => s.evidenceMap[cand.candidateId]?.status === 'MATCHED'
                  ).length;
                  const partialCount = sortedSkills.filter(
                    (s) => s.evidenceMap[cand.candidateId]?.status === 'PARTIAL'
                  ).length;
                  const candidateCoveragePct = Math.round(
                    ((matchedCount + partialCount * 0.5) / (sortedSkills.length || 1)) * 100
                  );

                  return (
                    <tr
                      key={cand.candidateId}
                      className="hover:bg-surface-sunken/40 transition-colors group"
                    >
                      {/* Sticky Candidate Name Cell */}
                      <td className="py-2.5 px-3 sticky left-0 z-10 bg-surface group-hover:bg-surface-sunken/90 transition-colors border-r border-default/70 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-muted font-bold w-5">
                            #{rankNum}
                          </span>
                          <div className="truncate max-w-[140px]">
                            <button
                              type="button"
                              onClick={() => onSelectCandidate && onSelectCandidate(cand)}
                              className="font-semibold text-primary group-hover:text-accent hover:underline text-left cursor-pointer truncate block"
                              title={`Inspect ${cand.candidateName}`}
                            >
                              {cand.candidateName}
                            </button>
                            <span className="text-[10px] font-mono text-muted truncate block">
                              {cand.profile?.yearsOfExperience || cand.fileName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Candidate Fit Score */}
                      <td className="py-2.5 px-2 font-mono text-center font-bold text-accent text-xs">
                        {cand.comprehensiveScore || 0}%
                      </td>

                      {/* Matrix Cells per Skill */}
                      {sortedSkills.map((skill) => {
                        const evidence = skill.evidenceMap[cand.candidateId] || {
                          status: 'MISSING',
                        };
                        const status = evidence.status;

                        return (
                          <td
                            key={skill.id}
                            className="py-1.5 px-1.5 text-center border-l border-default/40 align-middle"
                            onMouseEnter={() =>
                              setHoveredCell({
                                candidateId: cand.candidateId,
                                candidateName: cand.candidateName,
                                skillName: skill.name,
                                status,
                                quote: evidence.quote,
                                keywords: evidence.keywords,
                              })
                            }
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            <div
                              className={`w-full py-1.5 px-1 rounded-[4px] flex items-center justify-center transition-all cursor-pointer ${
                                status === 'MATCHED'
                                  ? 'bg-status-matched/15 text-status-matched border border-status-matched/30 hover:bg-status-matched/25 shadow-2xs font-semibold'
                                  : status === 'PARTIAL'
                                  ? 'bg-status-partial/15 text-status-partial border border-status-partial/30 hover:bg-status-partial/25 font-medium'
                                  : 'bg-surface-sunken/60 text-muted/60 border border-default/40 hover:bg-status-missing/10 hover:text-status-missing'
                              }`}
                              title={`${cand.candidateName} — ${skill.name}: ${status}${
                                evidence.quote ? `\n\nEvidence: "${evidence.quote}"` : ''
                              }`}
                            >
                              {status === 'MATCHED' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                              {status === 'PARTIAL' && <AlertTriangle className="w-3 h-3 stroke-[2]" />}
                              {status === 'MISSING' && <span className="text-[10px] font-mono leading-none">—</span>}
                            </div>
                          </td>
                        );
                      })}

                      {/* Candidate Coverage % Bar */}
                      <td className="py-2.5 px-3 border-l border-default text-center font-mono text-xs">
                        <div className="space-y-1">
                          <span className="font-bold text-primary">{candidateCoveragePct}%</span>
                          <div className="w-full bg-surface-sunken rounded-full h-1 overflow-hidden border border-default/50">
                            <div
                              className="bg-accent h-full rounded-full"
                              style={{ width: `${candidateCoveragePct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Bottom Aggregation Row: Cohort Match Rate */}
              <tfoot>
                <tr className="bg-surface-sunken border-t-2 border-default font-mono text-[10px] text-muted">
                  <td className="py-2.5 px-3 font-bold text-primary sticky left-0 z-10 bg-surface-sunken border-r border-default/70">
                    COHORT COVERAGE
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-primary">
                    {averageCohortMatchRate}%
                  </td>
                  {sortedSkills.map((skill) => (
                    <td key={skill.id} className="py-2.5 px-1.5 text-center border-l border-default/50 font-bold">
                      <span
                        className={
                          skill.matchRate >= 70
                            ? 'text-status-matched'
                            : skill.matchRate >= 40
                            ? 'text-status-partial'
                            : 'text-status-missing'
                        }
                      >
                        {skill.matchRate}%
                      </span>
                    </td>
                  ))}
                  <td className="py-2.5 px-3 border-l border-default text-center font-bold text-primary">
                    {totalCandidates} Cands
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          /* ========================================================================= */
          /* MODE 2: DISTRIBUTION & TALENT SATURATION BREAKDOWN                          */
          /* ========================================================================= */
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-accent" />
                <span>Skill Possession & Deficit Distribution</span>
              </h3>
              <span className="text-[11px] font-mono text-muted">
                Ranked by Cohort Saturation %
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {sortedSkills.map((skill) => {
                const matchedCount = skill.matchedCandidates.length;
                const partialCount = skill.partialCandidates.length;
                const missingCount = totalCandidates - (matchedCount + partialCount);

                const matchedPct = Math.round((matchedCount / (totalCandidates || 1)) * 100);
                const partialPct = Math.round((partialCount / (totalCandidates || 1)) * 100);
                const missingPct = Math.max(0, 100 - (matchedPct + partialPct));

                return (
                  <div
                    key={skill.id}
                    className="p-3 rounded-[8px] border border-default bg-surface space-y-2 hover:border-strong transition-colors"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {skill.isMandatory && (
                          <span className="w-2 h-2 rounded-full bg-accent shrink-0" title="Mandatory Requirement" />
                        )}
                        <button
                          type="button"
                          onClick={() => onFilterBySkill && onFilterBySkill(skill.name)}
                          className="font-bold text-xs text-primary hover:text-accent hover:underline truncate text-left cursor-pointer"
                        >
                          {skill.name}
                        </button>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-sunken border border-default text-secondary shrink-0">
                          {skill.category}
                        </span>
                      </div>

                      <div className="font-mono text-xs font-bold text-primary shrink-0">
                        {skill.matchRate}%
                      </div>
                    </div>

                    {/* Multi-Segment Stacked Bar */}
                    <div className="w-full bg-surface-sunken h-2.5 rounded-full overflow-hidden flex border border-default/50">
                      {matchedPct > 0 && (
                        <div
                          className="bg-status-matched h-full transition-all"
                          style={{ width: `${matchedPct}%` }}
                          title={`Matched: ${matchedCount} (${matchedPct}%)`}
                        />
                      )}
                      {partialPct > 0 && (
                        <div
                          className="bg-status-partial h-full transition-all"
                          style={{ width: `${partialPct}%` }}
                          title={`Partial: ${partialCount} (${partialPct}%)`}
                        />
                      )}
                      {missingPct > 0 && (
                        <div
                          className="bg-status-missing/40 h-full transition-all"
                          style={{ width: `${missingPct}%` }}
                          title={`Missing: ${missingCount} (${missingPct}%)`}
                        />
                      )}
                    </div>

                    {/* Numbers Footer */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-muted pt-0.5">
                      <span className="text-status-matched font-medium">
                        ✓ {matchedCount} Matched
                      </span>
                      {partialCount > 0 && (
                        <span className="text-status-partial font-medium">
                          ~ {partialCount} Partial
                        </span>
                      )}
                      <span className="text-status-missing font-medium">
                        ✗ {missingCount} Missing
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating Tooltip / Inspector for Hovered Matrix Cell */}
      {hoveredCell && (
        <div className="p-3 bg-surface border border-default rounded-[6px] text-xs font-mono space-y-1 mx-4 sm:mx-5 mb-4 shadow-sm animate-in fade-in duration-100">
          <div className="flex items-center justify-between">
            <span className="font-bold text-primary">
              {hoveredCell.candidateName} • <span className="text-accent">{hoveredCell.skillName}</span>
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                hoveredCell.status === 'MATCHED'
                  ? 'bg-status-matched/15 text-status-matched'
                  : hoveredCell.status === 'PARTIAL'
                  ? 'bg-status-partial/15 text-status-partial'
                  : 'bg-status-missing/15 text-status-missing'
              }`}
            >
              {hoveredCell.status}
            </span>
          </div>
          {hoveredCell.quote ? (
            <p className="text-[11px] text-secondary font-sans italic border-l-2 border-accent/40 pl-2 py-0.5">
              "{hoveredCell.quote}"
            </p>
          ) : (
            <p className="text-[11px] text-muted italic">
              {hoveredCell.status === 'MISSING'
                ? 'No textual evidence found in candidate profile or work experience.'
                : 'Verified via candidate profile taxonomy.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
