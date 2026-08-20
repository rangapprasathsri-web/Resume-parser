export type FieldId =
  | 'CONTACT_INFO'
  | 'FULL_NAME'
  | 'EMAIL'
  | 'PHONE'
  | 'LINKEDIN_URL'
  | 'LOCATION'
  | 'SUMMARY'
  | 'SKILLS_LIST'
  | 'PROGRAMMING_LANGUAGES'
  | 'FRAMEWORKS_LIBRARIES'
  | 'DATABASES'
  | 'CLOUD_DEVOPS'
  | 'WORK_EXPERIENCE'
  | 'EDUCATION'
  | 'CERTIFICATIONS'
  | 'PROJECTS'
  | 'YEARS_EXPERIENCE'
  | 'ACHIEVEMENTS'
  | string;

export type FieldCategory = 'identity' | 'skills' | 'experience' | 'education' | 'credentials';

export type ExtractionStatus = 'FOUND' | 'AMBIGUOUS' | 'NOT_FOUND';

export type RequirementStatus = 'MATCHED' | 'MISSING' | 'PARTIAL';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type ScorerType = 'openrouter' | 'ats_fallback' | 'ats_only' | 'llm' | 'fallback';

export type RecommendationTier =
  | 'EXCELLENT_MATCH'
  | 'HIGH_MATCH'
  | 'GOOD_MATCH'
  | 'MODERATE_MATCH'
  | 'LOW_MATCH';

export type AnalysisMode = 'openrouter' | 'ats_fallback' | 'ats_only';

export interface ExtractedField {
  id: string;
  name?: string;
  label?: string;
  category: FieldCategory;
  status: ExtractionStatus;
  value: any;
  evidence: string;
  sourceSection?: string;
  evidenceLineRef?: string;
  not_found_reason?: string;
  ambiguity_note?: string;
  note?: string;
}

export interface CandidateField {
  id: string;
  name: string;
  category: 'identity' | 'skills' | 'experience' | 'education' | 'credentials';
  status: 'FOUND' | 'NOT_FOUND' | 'AMBIGUOUS';
  value: any;
  evidence: string;
  sourceSection: string;
  note?: string;
}

export interface JobRequirement {
  id: string;
  requirement: string;
  category: string;
  status: RequirementStatus;
  confidence: ConfidenceLevel;
  explanation: string;
  evidence_ref: string;
  evidence_quote?: string;
  isMandatory?: boolean;
}

export interface AnalysisResult {
  id: string;
  fileName: string;
  candidateName: string;
  targetRole: string;
  timestamp: string;
  scorer: ScorerType;
  fitScorePercentage: number;
  matchedCount: number;
  totalRequirements: number;
  overallSummary: string;
  keyStrengths: string[];
  keyGaps: string[];
  rawResumeText: string;
  rawJdText: string;
  fields: ExtractedField[];
  requirements: JobRequirement[];
}

export interface AtsMatchedItem {
  requirementId: string;
  requirement: string;
  category: string;
  isMandatory: boolean;
  status: 'MATCHED' | 'PARTIAL' | 'NOT_FOUND';
  matchType: 'EXACT' | 'NORMALIZED' | 'FUZZY' | 'NONE';
  matchedKeywords: string[];
  evidenceRef: string;
  evidenceQuote: string;
  scoreContribution: number;
}

export interface AtsResult {
  score: number;
  matchedRequirements: AtsMatchedItem[];
  missingRequirements: AtsMatchedItem[];
  partialMatches: AtsMatchedItem[];
  matchedKeywords: string[];
  missingKeywords: string[];
  breakdown: {
    requiredScore: number;
    preferredScore: number;
    experienceScore: number;
    educationScore: number;
    certificationsScore: number;
  };
}

export interface AgenticRequirementMatch {
  requirement: string;
  status: 'MATCHED' | 'PARTIAL' | 'MISSING';
  evidenceRef: string;
  evidenceQuote: string;
  reason: string;
}

export interface AgenticAnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  matchedRequirements: AgenticRequirementMatch[];
  missingRequirements: string[];
  relevanceSummary: string;
  experienceEvaluation: string;
  evidenceGrounded: boolean;
}

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
  ats: AtsResult;
  agentic: AgenticAnalysisResult;
  profile: {
    candidateId: string;
    name: string;
    email: string | null;
    phone: string | null;
    location: string | null;
    linkedinUrl: string | null;
    summary: string | null;
    yearsOfExperience: string | null;
    yearsOfExperienceNum: number;
    skills: string[];
    programmingLanguages: string[];
    frameworks: string[];
    databases: string[];
    cloudDevOps: string[];
    education: Array<{ degree: string; institution: string; year?: string }>;
    workExperience: Array<{ title: string; company: string; duration?: string; highlights?: string }>;
    certifications: string[];
    projects: Array<{ title: string; description: string; tech?: string[] }>;
    achievements: string[];
    fields: CandidateField[];
    rawText: string;
    contentHash: string;
  };
  strengths: string[];
  weaknesses: string[];
  matchedRequirementsCount: number;
  totalRequirementsCount: number;
  relevanceSummary: string;
}

export interface ParsedRequirement {
  id: string;
  text: string;
  category: string;
  isMandatory: boolean;
  weight: number;
  keywords: string[];
}

export interface ParsedJobDescription {
  title: string;
  company?: string;
  summary: string;
  requirements: ParsedRequirement[];
  requiredSkills: string[];
  preferredSkills: string[];
  minYearsExperience: number;
  educationLevel: string | null;
  certifications: string[];
  rawText: string;
}

export interface JobScreeningSession {
  jobId: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  candidateCount: number;
  averageScore: number;
  topScore: number;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  parsedJd: ParsedJobDescription;
  candidates: FinalCandidateAnalysis[];
  failedCandidates?: Array<{ fileName: string; error: string }>;
  userId?: string;
  batchTimings?: {
    totalDurationMs: number;
    avgCandidateMs: number;
    concurrencyUsed: number;
  };
}

export type AppView =
  | 'landing'
  | 'dashboard'
  | 'new_screening'
  | 'job_workspace'
  | 'candidate_detail'
  | 'history'
  | 'new'
  | 'processing'
  | 'results';

export type ThemeMode = 'light' | 'dark';
