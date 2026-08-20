import { AtsResult } from '../ats/engine';
import { AgenticAnalysisResult } from '../agent/openrouter';
import { CandidateProfile } from '../parser/fieldParser';

export type RecommendationTier =
  | 'EXCELLENT_MATCH'
  | 'HIGH_MATCH'
  | 'GOOD_MATCH'
  | 'MODERATE_MATCH'
  | 'LOW_MATCH';

export type AnalysisMode = 'openrouter' | 'ats_fallback' | 'ats_only';

export interface PerformanceTimings {
  extraction_ms: number;
  segmentation_ms: number;
  field_parser_ms: number;
  jd_parser_ms: number;
  ats_ms: number;
  openrouter_ms: number;
  validation_ms: number;
  firestore_ms: number;
  total_ms: number;
}

export interface FinalCandidateAnalysis {
  candidateId: string;
  candidateName: string;
  targetRole: string;
  fileName: string;
  atsScore: number;
  agenticScore: number;
  comprehensiveScore: number;
  recommendation: RecommendationTier;
  analysisMode: AnalysisMode;
  evidenceGrounded: boolean;
  contentHash: string;
  createdAt: string;
  timings?: PerformanceTimings;

  // Detailed breakdowns
  ats: AtsResult;
  agentic: AgenticAnalysisResult;
  profile: CandidateProfile;

  // Quick summaries for UI cards and reports
  strengths: string[];
  weaknesses: string[];
  matchedRequirementsCount: number;
  totalRequirementsCount: number;
  relevanceSummary: string;
}

/**
 * Calculates recommendation tier based on comprehensive score
 */
export function getRecommendationTier(score: number): RecommendationTier {
  if (score >= 90) return 'EXCELLENT_MATCH';
  if (score >= 80) return 'HIGH_MATCH';
  if (score >= 70) return 'GOOD_MATCH';
  if (score >= 60) return 'MODERATE_MATCH';
  return 'LOW_MATCH';
}

/**
 * Combines ATS and Agentic scores using weighted formula
 */
export function combineCandidateEvaluation(
  candidate: CandidateProfile,
  targetRole: string,
  fileName: string,
  atsResult: AtsResult,
  agenticResult: AgenticAnalysisResult | null,
  forceAtsOnly: boolean = false,
  timings?: PerformanceTimings
): FinalCandidateAnalysis {
  const atsWeight = parseFloat(process.env.ATS_WEIGHT || '0.40');
  const agentWeight = parseFloat(process.env.AGENT_WEIGHT || '0.60');

  let analysisMode: AnalysisMode = 'openrouter';
  let finalAgenticResult: AgenticAnalysisResult;
  let comprehensiveScore: number;

  if (forceAtsOnly) {
    analysisMode = 'ats_only';
    finalAgenticResult = createAtsDerivedAgenticResult(candidate, atsResult, 'ATS Only screening executed.');
    comprehensiveScore = atsResult.score;
  } else if (!agenticResult) {
    analysisMode = 'ats_fallback';
    finalAgenticResult = createAtsDerivedAgenticResult(candidate, atsResult, 'Evaluated via deterministic ATS scoring engine.');
    comprehensiveScore = atsResult.score;
  } else {
    analysisMode = 'openrouter';
    finalAgenticResult = agenticResult;
    const rawComp = (atsResult.score * atsWeight) + (agenticResult.score * agentWeight);
    comprehensiveScore = Math.round(rawComp * 10) / 10;
  }

  const recommendation = getRecommendationTier(comprehensiveScore);

  const matchedCount = (finalAgenticResult.matchedRequirements?.length || 0) +
    atsResult.matchedRequirements.length;
  const totalCount = atsResult.matchedRequirements.length +
    atsResult.partialMatches.length +
    atsResult.missingRequirements.length;

  return {
    candidateId: candidate.candidateId,
    candidateName: candidate.name,
    targetRole,
    fileName,
    atsScore: atsResult.score,
    agenticScore: finalAgenticResult.score,
    comprehensiveScore,
    recommendation,
    analysisMode,
    evidenceGrounded: true,
    contentHash: candidate.contentHash,
    createdAt: new Date().toISOString(),
    timings,
    ats: atsResult,
    agentic: finalAgenticResult,
    profile: candidate,
    strengths: finalAgenticResult.strengths,
    weaknesses: finalAgenticResult.weaknesses,
    matchedRequirementsCount: atsResult.matchedRequirements.length,
    totalRequirementsCount: totalCount || 1,
    relevanceSummary: finalAgenticResult.relevanceSummary,
  };
}

/**
 * Creates fallback agentic structure from ATS results
 */
function createAtsDerivedAgenticResult(
  candidate: CandidateProfile,
  ats: AtsResult,
  note: string
): AgenticAnalysisResult {
  const strengths: string[] = [];
  if (ats.matchedRequirements.length > 0) {
    strengths.push(...ats.matchedRequirements.slice(0, 3).map((m) => `Verified match on requirement: ${m.requirement}`));
  }
  if (candidate.yearsOfExperienceNum > 0) {
    strengths.push(`Verified work timeline: ${candidate.yearsOfExperience}`);
  }
  if (strengths.length === 0) {
    strengths.push('Candidate meets foundational background criteria.');
  }

  const weaknesses: string[] = [];
  if (ats.missingRequirements.length > 0) {
    weaknesses.push(...ats.missingRequirements.slice(0, 3).map((m) => `Missing evidence for: ${m.requirement}`));
  }
  if (weaknesses.length === 0) {
    weaknesses.push('No critical requirement gaps identified.');
  }

  return {
    score: ats.score,
    strengths,
    weaknesses,
    matchedRequirements: ats.matchedRequirements.map((m) => ({
      requirement: m.requirement,
      status: 'MATCHED',
      evidenceRef: m.evidenceRef,
      evidenceQuote: m.evidenceQuote,
      reason: `Matched via ATS ${m.matchType} keyword verification.`,
    })),
    missingRequirements: ats.missingRequirements.map((m) => m.requirement),
    relevanceSummary: note,
    experienceEvaluation: candidate.yearsOfExperience || 'Timeline verified.',
    evidenceGrounded: true,
  };
}

/**
 * Deterministic Candidate Ranking
 * Sorts by:
 * 1. comprehensiveScore DESC
 * 2. agenticScore DESC
 * 3. atsScore DESC
 * 4. candidateId ASC
 */
export function rankCandidates(candidates: FinalCandidateAnalysis[]): FinalCandidateAnalysis[] {
  return [...candidates].sort((a, b) => {
    // 1. comprehensiveScore DESC
    if (b.comprehensiveScore !== a.comprehensiveScore) {
      return b.comprehensiveScore - a.comprehensiveScore;
    }
    // 2. agenticScore DESC
    if (b.agenticScore !== a.agenticScore) {
      return b.agenticScore - a.agenticScore;
    }
    // 3. atsScore DESC
    if (b.atsScore !== a.atsScore) {
      return b.atsScore - a.atsScore;
    }
    // 4. candidateId ASC (deterministic tie-breaker)
    return a.candidateId.localeCompare(b.candidateId);
  });
}
