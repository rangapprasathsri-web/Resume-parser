import { JobScreeningSession, FinalCandidateAnalysis } from '../types';
import { parseJobDescription } from '../server/ats/jdParser';
import { extractCandidateProfile } from '../server/parser/fieldParser';
import { runAtsEngine } from '../server/ats/engine';
import { combineCandidateEvaluation, rankCandidates } from '../server/ranking/rankingEngine';
import { generateJobId } from '../server/screening/screeningService';

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
 * Execute batch screening through backend API with client fallback
 */
export async function executeBatchScreening(
  payload: BatchScreenRequest,
  onProgress?: (current: number, total: number, name: string) => void
): Promise<JobScreeningSession> {
  try {
    const res = await fetch('/api/screen/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Batch screening API call redirected to client processing pipeline.', err);
  }

  // Client-side fallback pipeline
  const parsedJd = parseJobDescription(payload.jobDescription);
  if (payload.jobTitle && payload.jobTitle.trim()) {
    parsedJd.title = payload.jobTitle.trim();
  }

  const jobId = payload.jobId || generateJobId(parsedJd.title);
  const candidates: FinalCandidateAnalysis[] = [];
  const seenHashes = new Set<string>();

  for (let i = 0; i < payload.resumes.length; i++) {
    const resume = payload.resumes[i];
    if (onProgress) {
      onProgress(i + 1, payload.resumes.length, resume.fileName);
    }

    const text = resume.rawText || '';
    if (!text || text.length < 10) continue;

    const candidateId = `cand_${Date.now()}_${i}`;
    const profile = extractCandidateProfile(text, candidateId, resume.fileName.replace(/\.[^/.]+$/, ''));

    if (seenHashes.has(profile.contentHash)) {
      continue; // Duplicate skipped
    }
    seenHashes.add(profile.contentHash);

    const atsResult = runAtsEngine(profile, parsedJd);
    const combined = combineCandidateEvaluation(
      profile,
      parsedJd.title,
      resume.fileName,
      atsResult,
      null, // OpenRouter fallback in client
      payload.analysisMode === 'ats_only'
    );

    candidates.push(combined);
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

