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
} from '../ranking/rankingEngine';

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
  userId?: string;
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
 * Screens a single candidate resume against a parsed JD
 */
export async function screenSingleResume(
  candidateDoc: { fileName: string; buffer?: Buffer; rawText?: string; mimeType?: string },
  parsedJd: ParsedJobDescription,
  candidateIndex: number,
  mode: 'ai_ats' | 'ats_only' = 'ai_ats'
): Promise<FinalCandidateAnalysis> {
  // 1. Text Extraction
  let extracted: ExtractedDocument;
  if (candidateDoc.rawText) {
    extracted = extractTextFromRaw(candidateDoc.rawText, candidateDoc.fileName);
  } else if (candidateDoc.buffer) {
    extracted = await extractDocumentText(
      candidateDoc.buffer,
      candidateDoc.fileName,
      candidateDoc.mimeType
    );
  } else {
    throw new Error(`No text or buffer provided for ${candidateDoc.fileName}`);
  }

  if (!extracted.hasTextLayer && extracted.error) {
    throw new Error(extracted.error);
  }

  // 2. Structured Field & Evidence Parser
  const candidateId = `cand_${Date.now()}_${candidateIndex}_${Math.random().toString(36).substring(2, 5)}`;
  const candidateProfile = extractCandidateProfile(
    extracted.text,
    candidateId,
    candidateDoc.fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
  );

  // 3. Independent ATS Engine Execution (Zero LLM)
  const atsResult = runAtsEngine(candidateProfile, parsedJd);

  // 4. OpenRouter Agentic Analysis (if in AI mode)
  let agenticResult: AgenticAnalysisResult | null = null;
  if (mode === 'ai_ats') {
    try {
      agenticResult = await runOpenRouterAgenticAnalysis(candidateProfile, parsedJd);
    } catch (e: any) {
      console.warn(`[Screening] OpenRouter failed for ${candidateProfile.name}. Using ATS fallback.`, e);
      agenticResult = null;
    }
  }

  // 5. Combined Scoring & Synthesis
  const finalAnalysis = combineCandidateEvaluation(
    candidateProfile,
    parsedJd.title,
    candidateDoc.fileName,
    atsResult,
    agenticResult,
    mode === 'ats_only'
  );

  return finalAnalysis;
}

/**
 * Controlled Concurrency Batch Screening Runner
 */
export async function runBatchScreening(
  input: BatchScreenInput,
  onProgress?: BatchScreenProgressCallback
): Promise<JobScreeningSession> {
  const { jobTitle, jobDescription, resumes, analysisMode = 'ai_ats', userId } = input;

  if (!jobDescription || jobDescription.trim().length < 10) {
    throw new Error('Job description cannot be empty.');
  }

  if (!resumes || resumes.length === 0) {
    throw new Error('At least one resume must be provided.');
  }

  // 1. Parse Job Description
  const parsedJd = parseJobDescription(jobDescription);
  if (jobTitle && jobTitle.trim()) {
    parsedJd.title = jobTitle.trim();
  }

  const jobId = input.jobId || generateJobId(parsedJd.title);

  // Retrieve existing session or initialize new
  let session = jobStore.get(jobId);
  const existingCandidates = session ? session.candidates : [];
  const existingHashes = new Set(existingCandidates.map((c) => c.contentHash));

  const analyzedCandidates: FinalCandidateAnalysis[] = [...existingCandidates];
  const totalResumes = resumes.length;

  // Controlled concurrency batch worker (2 workers)
  const CONCURRENCY = 2;
  const queue = [...resumes.entries()];

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      const [idx, resume] = item;

      if (onProgress) {
        onProgress({
          total: totalResumes,
          current: idx + 1,
          currentCandidateName: resume.fileName,
          status: 'extracting',
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

        // Check for duplicate resume content in this JD
        if (!existingHashes.has(analysis.contentHash)) {
          existingHashes.add(analysis.contentHash);
          analyzedCandidates.push(analysis);
        } else {
          console.log(`[Batch] Skipped duplicate resume: ${resume.fileName}`);
        }

        if (onProgress) {
          onProgress({
            total: totalResumes,
            current: idx + 1,
            currentCandidateName: analysis.candidateName,
            status: 'completed',
          });
        }
      } catch (err: any) {
        console.error(`[Batch] Error processing candidate ${resume.fileName}:`, err.message || err);
        // Continue processing remaining resumes in batch
        if (onProgress) {
          onProgress({
            total: totalResumes,
            current: idx + 1,
            currentCandidateName: resume.fileName,
            status: 'error',
          });
        }
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, resumes.length) }, () => worker());
  await Promise.all(workers);

  // Sort candidates by deterministic ranking
  const ranked = rankCandidates(analyzedCandidates);

  const scores = ranked.map((c) => c.comprehensiveScore);
  const averageScore = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : 0;
  const topScore = scores.length > 0 ? Math.max(...scores) : 0;

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
    userId,
  };

  jobStore.set(jobId, session);
  return session;
}
