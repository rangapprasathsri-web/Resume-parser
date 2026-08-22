import { JobScreeningSession, FinalCandidateAnalysis } from '../types';
import { parseJobDescription } from '../server/ats/jdParser';
import { extractCandidateProfile } from '../server/parser/fieldParser';
import { runAtsEngine } from '../server/ats/engine';
import { combineCandidateEvaluation, rankCandidates } from '../server/ranking/rankingEngine';
import { generateJobId } from '../server/screening/screeningService';
import { generateFastDeterministicAnalysis } from '../server/agent/openrouter';

export interface BatchScreenRequest {
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

/**
 * Universal text extraction via /api/extract-text
 */
export async function extractTextFromFile(
  file: File
): Promise<{ text: string; fileName: string; wordCount: number }> {
  // If plain text / markdown, read as text directly
  if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
    const text = await file.text();
    return {
      text,
      fileName: file.name,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    };
  }

  // Convert to Base64 for PDF or DOCX extraction on server
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  try {
    const res = await fetch('/api/extract-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentBase64: base64,
        mimeType: file.type,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data?.text) {
        return {
          text: json.data.text,
          fileName: file.name,
          wordCount: json.data.wordCount || 0,
        };
      }
    } else {
      const errJson = await res.json().catch(() => ({}));
      if (errJson.error) {
        throw new Error(errJson.error);
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('extractable text layer')) {
      throw err;
    }
    console.warn('Backend text extraction endpoint unavailable, trying direct string fallback.');
  }

  // Fallback to text reader
  const raw = await file.text();
  if (!raw || raw.length < 20) {
    throw new Error(`Unable to extract text from ${file.name}. Please ensure the PDF or DOCX contains readable text.`);
  }

  return {
    text: raw,
    fileName: file.name,
    wordCount: raw.split(/\s+/).filter(Boolean).length,
  };
}

/**
 * Execute batch screening with instant real-time animated progress
 */
export async function executeBatchScreening(
  payload: BatchScreenRequest,
  onProgress?: (current: number, total: number, name: string) => void
): Promise<JobScreeningSession> {
  const parsedJd = parseJobDescription(payload.jobDescription);
  if (payload.jobTitle && payload.jobTitle.trim()) {
    parsedJd.title = payload.jobTitle.trim();
  }

  const jobId = payload.jobId || generateJobId(parsedJd.title);
  const candidates: FinalCandidateAnalysis[] = [];
  const seenHashes = new Set<string>();
  const total = payload.resumes.length;

  for (let i = 0; i < total; i++) {
    const resume = payload.resumes[i];
    
    // 1. Notify progress bar of start for this candidate
    if (onProgress) {
      onProgress(i, total, resume.fileName);
    }

    const text = resume.rawText || '';
    if (!text || text.length < 10) {
      if (onProgress) onProgress(i + 1, total, resume.fileName);
      continue;
    }

    const candidateId = `cand_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`;
    const cleanName = resume.fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const profile = extractCandidateProfile(text, candidateId, cleanName);

    if (seenHashes.has(profile.contentHash)) {
      if (onProgress) onProgress(i + 1, total, resume.fileName);
      continue; // Duplicate skipped
    }
    seenHashes.add(profile.contentHash);

    // 2. Run High-Precision Deterministic ATS Keyword & Criteria Engine (<5ms)
    const atsResult = runAtsEngine(profile, parsedJd);

    // 3. Grounded Agentic Evaluation (<5ms)
    const agenticResult = generateFastDeterministicAnalysis(profile, parsedJd);

    // 4. Combine into standardized candidate evaluation
    const combined = combineCandidateEvaluation(
      profile,
      parsedJd.title,
      resume.fileName,
      atsResult,
      payload.analysisMode === 'ats_only' ? null : agenticResult,
      payload.analysisMode === 'ats_only'
    );

    candidates.push(combined);

    // Micro-delay for smooth rendering so users see the progress meter advance
    await new Promise((r) => setTimeout(r, 80));

    // 5. Update progress after completing candidate
    if (onProgress) {
      onProgress(i + 1, total, resume.fileName);
    }
  }

  const ranked = rankCandidates(candidates);
  const scores = ranked.map((c) => c.comprehensiveScore);
  const avg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
  const top = scores.length > 0 ? Math.max(...scores) : 0;

  return {
    jobId,
    title: parsedJd.title,
    description: payload.jobDescription,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    candidateCount: ranked.length,
    averageScore: avg,
    topScore: top,
    status: 'completed',
    parsedJd,
    candidates: ranked,
    userId: payload.userId,
  };
}

/**
 * Append and screen new resumes directly into an existing Job Screening Session
 * WITHOUT requiring the user to re-input or specify JD details.
 */
export async function appendResumesToExistingSession(
  session: JobScreeningSession,
  newResumes: Array<{
    fileName: string;
    contentBase64?: string;
    rawText?: string;
    mimeType?: string;
  }>,
  analysisMode?: 'ai_ats' | 'ats_only',
  userId?: string,
  onProgress?: (current: number, total: number, name: string) => void
): Promise<JobScreeningSession> {
  const parsedJd = (session.parsedJd as any) || parseJobDescription(session.description || session.title);
  const effectiveMode = analysisMode || session.candidates?.[0]?.analysisMode || 'ai_ats';

  // Seed seen hashes and names from existing candidates to avoid duplicates
  const seenHashes = new Set<string>();
  const existingCandidates = [...(session.candidates || [])];
  existingCandidates.forEach((c) => {
    if (c.profile?.contentHash) {
      seenHashes.add(c.profile.contentHash);
    }
  });

  const newCandidates: FinalCandidateAnalysis[] = [];
  const total = newResumes.length;

  for (let i = 0; i < total; i++) {
    const resume = newResumes[i];

    if (onProgress) {
      onProgress(i, total, resume.fileName);
    }

    const text = resume.rawText || '';
    if (!text || text.length < 10) {
      if (onProgress) onProgress(i + 1, total, resume.fileName);
      continue;
    }

    const candidateId = `cand_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`;
    const cleanName = resume.fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const profile = extractCandidateProfile(text, candidateId, cleanName);

    // Skip duplicate if identical resume content hash already in session
    if (seenHashes.has(profile.contentHash)) {
      if (onProgress) onProgress(i + 1, total, resume.fileName);
      continue;
    }
    seenHashes.add(profile.contentHash);

    // Run ATS Engine against existing session's parsed JD
    const atsResult = runAtsEngine(profile, parsedJd);

    // Run Agentic Evaluation against existing session's parsed JD
    const agenticResult = generateFastDeterministicAnalysis(profile, parsedJd);

    // Combine evaluation
    const combined = combineCandidateEvaluation(
      profile,
      parsedJd.title,
      resume.fileName,
      atsResult,
      effectiveMode === 'ats_only' ? null : agenticResult,
      effectiveMode === 'ats_only'
    );

    newCandidates.push(combined);

    await new Promise((r) => setTimeout(r, 80));

    if (onProgress) {
      onProgress(i + 1, total, resume.fileName);
    }
  }

  // Combine existing + new candidates and re-rank the entire cohort
  const allCandidates = [...existingCandidates, ...newCandidates];
  const ranked = rankCandidates(allCandidates);
  const scores = ranked.map((c) => c.comprehensiveScore);
  const avg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
  const top = scores.length > 0 ? Math.max(...scores) : 0;

  return {
    ...session,
    updatedAt: new Date().toISOString(),
    candidateCount: ranked.length,
    averageScore: avg,
    topScore: top,
    candidates: ranked,
    userId: userId || session.userId,
  };
}

/**
 * Validates OpenRouter API credentials from backend
 */
export async function validateOpenRouterStatus(): Promise<{
  configured: boolean;
  valid: boolean;
  model: string;
  keyLabel?: string;
  usage?: number;
  limit?: number | null;
  isFreeTier?: boolean;
  rateLimit?: any;
  error?: string;
  statusMessage: string;
}> {
  try {
    const res = await fetch('/api/openrouter/validate');
    if (res.ok) {
      return await res.json();
    }
    return {
      configured: false,
      valid: false,
      model: 'openai/gpt-oss-20b:free',
      statusMessage: `Validation failed with status ${res.status}`,
    };
  } catch (err: any) {
    return {
      configured: false,
      valid: false,
      model: 'openai/gpt-oss-20b:free',
      error: err.message,
      statusMessage: 'Unable to reach backend validation route.',
    };
  }
}

