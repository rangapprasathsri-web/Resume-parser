import { extractDocumentText, extractTextFromRaw, ExtractedDocument } from '../extraction/extractor';
import { extractCandidateProfile, CandidateProfile } from '../parser/fieldParser';
import { parseJobDescription, ParsedJobDescription } from '../ats/jdParser';
import { runAtsEngine, AtsResult } from '../ats/engine';
import { runOpenRouterAgenticAnalysis, AgenticAnalysisResult } from '../agent/openrouter';
import {
  FinalCandidateAnalysis,
  combineCandidateEvaluation,
  rankCandidates,
  RecommendationTier,
  PerformanceTimings,
} from '../ranking/rankingEngine';
import {
  getCachedJd,
  setCachedJd,
  getCachedCandidateProfile,
  setCachedCandidateProfile,
} from '../cache/engineCache';

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

export interface BatchScreenInput {
  jobId?: string;
  jobTitle?: string;
  jobDescription: string;
  resumes: Array<{
    fileName: string;
    contentBase64?: string;
    rawText?: string;
    mimeType?: string;
  }>;
  analysisMode?: 'ai_ats' | 'ats_only';
  userId?: string;
}

export interface BatchScreenProgressCallback {
  (progress: {
    total: number;
    current: number;
    currentCandidateName: string;
    status: 'extracting' | 'ats' | 'agent' | 'completed' | 'error';
    stageDescription?: string;
  }): void;
}

/**
 * Creates a unique, URL-safe Job ID from title
 */
export function generateJobId(title: string): string {
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${cleanTitle || 'job'}-${suffix}`;
}

/**
 * In-memory / server-authoritative store cache for rapid workspace retrieval
 */
const jobStore = new Map<string, JobScreeningSession>();

export function getJobSession(jobId: string): JobScreeningSession | undefined {
  return jobStore.get(jobId);
}

export function getAllJobSessions(userId?: string): JobScreeningSession[] {
  const all = Array.from(jobStore.values());
  if (!userId) return all;
  return all.filter((j) => !j.userId || j.userId === userId);
}

export function saveJobSession(session: JobScreeningSession): void {
  jobStore.set(session.jobId, session);
}

export function deleteJobSession(jobId: string): boolean {
  return jobStore.delete(jobId);
}

/**
 * Screens a single candidate resume against an already parsed JD with fine-grained performance timings
 */
export async function screenSingleResume(
  candidateDoc: { fileName: string; buffer?: Buffer; rawText?: string; mimeType?: string },
  parsedJd: ParsedJobDescription,
  candidateIndex: number,
  mode: 'ai_ats' | 'ats_only' = 'ai_ats'
): Promise<FinalCandidateAnalysis> {
  const startOverall = Date.now();
  let extractionMs = 0;
  let segmentationMs = 0;
  let fieldParserMs = 0;
  let atsMs = 0;
  let openRouterMs = 0;
  let validationMs = 0;

  // 1. Text Extraction
  const startExt = Date.now();
  let extractedText: string;

  if (candidateDoc.rawText) {
    extractedText = candidateDoc.rawText.replace(/\r\n/g, '\n').trim();
    extractionMs = Date.now() - startExt;
  } else if (candidateDoc.buffer) {
    const extracted = await extractDocumentText(
      candidateDoc.buffer,
      candidateDoc.fileName,
      candidateDoc.mimeType
    );
    extractionMs = Date.now() - startExt;

    if (!extracted.hasTextLayer && extracted.error) {
      throw new Error(extracted.error);
    }
    extractedText = extracted.text;
  } else {
    throw new Error(`No text or buffer provided for ${candidateDoc.fileName}`);
  }

  // 2. Structured Field & Evidence Parser (Check Profile Cache First)
  let candidateProfile = getCachedCandidateProfile(extractedText);

  if (!candidateProfile) {
    const startParse = Date.now();
    const candidateId = `cand_${Date.now()}_${candidateIndex}_${Math.random().toString(36).substring(2, 5)}`;
    candidateProfile = extractCandidateProfile(
      extractedText,
      candidateId,
      candidateDoc.fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
    );
    fieldParserMs = Date.now() - startParse;
    segmentationMs = Math.round(fieldParserMs * 0.3); // segmentation is part of field parsing pipeline
    setCachedCandidateProfile(extractedText, candidateProfile);
  } else {
    // Reused cached profile
    fieldParserMs = 1;
    segmentationMs = 0;
  }

  // 3. Independent ATS Engine Execution (Zero LLM)
  const startAts = Date.now();
  const atsResult = runAtsEngine(candidateProfile, parsedJd);
  atsMs = Date.now() - startAts;

  // 4. OpenRouter Agentic Analysis (if in AI mode)
  let agenticResult: AgenticAnalysisResult | null = null;
  if (mode === 'ai_ats') {
    try {
      const output = await runOpenRouterAgenticAnalysis(candidateProfile, parsedJd);
      agenticResult = output.result;
      openRouterMs = output.openrouter_ms;
      validationMs = output.validation_ms;
    } catch (e: any) {
      console.warn(`[Screening] OpenRouter execution failed for ${candidateProfile.name}. Using ATS fallback.`, e);
      agenticResult = null;
    }
  }

  // 5. Combined Scoring & Synthesis
  const totalMs = Date.now() - startOverall;
  const timings: PerformanceTimings = {
    extraction_ms: extractionMs,
    segmentation_ms: segmentationMs,
    field_parser_ms: fieldParserMs,
    jd_parser_ms: 0, // JD is parsed once outside
    ats_ms: atsMs,
    openrouter_ms: openRouterMs,
    validation_ms: validationMs,
    firestore_ms: 0,
    total_ms: totalMs,
  };

  const finalAnalysis = combineCandidateEvaluation(
    candidateProfile,
    parsedJd.title,
    candidateDoc.fileName,
    atsResult,
    agenticResult,
    mode === 'ats_only',
    timings
  );

  return finalAnalysis;
}

/**
 * Controlled Concurrency Batch Screening Runner
 * Optimized for bounded parallel throughput, single JD parsing, candidate profile caching, and error resilience
 */
export async function runBatchScreening(
  input: BatchScreenInput,
  onProgress?: BatchScreenProgressCallback
): Promise<JobScreeningSession> {
  const batchStart = Date.now();
  const { jobTitle, jobDescription, resumes, analysisMode = 'ai_ats', userId } = input;

  if (!jobDescription || jobDescription.trim().length < 10) {
    throw new Error('Job description cannot be empty.');
  }

  if (!resumes || resumes.length === 0) {
    throw new Error('At least one resume must be provided.');
  }

  // 1. Parse Job Description ONCE (Check Cache)
  const jdStart = Date.now();
  let parsedJd = getCachedJd(jobDescription, jobTitle);
  if (!parsedJd) {
    parsedJd = parseJobDescription(jobDescription);
    if (jobTitle && jobTitle.trim()) {
      parsedJd.title = jobTitle.trim();
    }
    setCachedJd(jobDescription, parsedJd, jobTitle);
  }
  const jdParseDurationMs = Date.now() - jdStart;

  const jobId = input.jobId || generateJobId(parsedJd.title);

  // Retrieve existing session or initialize new
  let session = jobStore.get(jobId);
  const existingCandidates = session ? session.candidates : [];
  const existingHashes = new Set(existingCandidates.map((c) => c.contentHash));

  const analyzedCandidates: FinalCandidateAnalysis[] = [...existingCandidates];
  const failedCandidates: Array<{ fileName: string; error: string }> = [];
  const totalResumes = resumes.length;

  // Controlled concurrency batch worker pool (Default 4 workers)
  const configuredConcurrency = parseInt(process.env.SCREENING_CONCURRENCY || '4', 10);
  const CONCURRENCY = Math.max(1, Math.min(configuredConcurrency, resumes.length));
  const queue = [...resumes.entries()];
  let processedCount = 0;

  async function worker(workerId: number) {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      const [idx, resume] = item;

      if (onProgress) {
        onProgress({
          total: totalResumes,
          current: processedCount,
          currentCandidateName: resume.fileName,
          status: 'extracting',
          stageDescription: `Analyzing candidate ${idx + 1} of ${totalResumes}`,
        });
      }

      try {
        let buffer: Buffer | undefined;
        if (resume.contentBase64) {
          buffer = Buffer.from(resume.contentBase64, 'base64');
        }

        const analysis = await screenSingleResume(
          {
            fileName: resume.fileName,
            buffer,
            rawText: resume.rawText,
            mimeType: resume.mimeType,
          },
          parsedJd,
          idx + 1,
          analysisMode
        );

        // Deduplicate resumes within same JD session
        if (!existingHashes.has(analysis.contentHash)) {
          existingHashes.add(analysis.contentHash);
          analyzedCandidates.push(analysis);
        } else {
          console.log(`[Batch] Reused / deduplicated identical resume content for: ${resume.fileName}`);
        }

        processedCount++;

        if (onProgress) {
          onProgress({
            total: totalResumes,
            current: processedCount,
            currentCandidateName: analysis.candidateName,
            status: 'completed',
            stageDescription: `Completed analysis for ${analysis.candidateName}`,
          });
        }
      } catch (err: any) {
        console.error(`[Batch] Error on resume "${resume.fileName}":`, err.message || err);
        failedCandidates.push({
          fileName: resume.fileName,
          error: err.message || 'Extraction or parsing error',
        });
        processedCount++;

        if (onProgress) {
          onProgress({
            total: totalResumes,
            current: processedCount,
            currentCandidateName: resume.fileName,
            status: 'error',
            stageDescription: `Skipped corrupt resume: ${resume.fileName}`,
          });
        }
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  // Sort candidates by deterministic ranking
  const ranked = rankCandidates(analyzedCandidates);

  const scores = ranked.map((c) => c.comprehensiveScore);
  const averageScore = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : 0;
  const topScore = scores.length > 0 ? Math.max(...scores) : 0;

  const totalDurationMs = Date.now() - batchStart;
  const avgCandidateMs = ranked.length > 0 ? Math.round(totalDurationMs / ranked.length) : 0;

  session = {
    jobId,
    title: parsedJd.title,
    description: jobDescription,
    createdAt: session?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    candidateCount: ranked.length,
    averageScore,
    topScore,
    status: 'completed',
    parsedJd,
    candidates: ranked,
    failedCandidates: failedCandidates.length > 0 ? failedCandidates : undefined,
    userId,
    batchTimings: {
      totalDurationMs,
      avgCandidateMs,
      concurrencyUsed: CONCURRENCY,
    },
  };

  jobStore.set(jobId, session);
  return session;
}
