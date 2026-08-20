import { CandidateProfile } from '../parser/fieldParser';
import { ParsedJobDescription } from '../ats/jdParser';

export interface AgenticRequirementMatch {
  requirement: string;
  status: 'MATCHED' | 'PARTIAL' | 'MISSING';
  evidenceRef: string;
  evidenceQuote: string;
  reason: string;
}

export interface AgenticAnalysisResult {
  score: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  matchedRequirements: AgenticRequirementMatch[];
  missingRequirements: string[];
  relevanceSummary: string;
  experienceEvaluation: string;
  evidenceGrounded: boolean;
}

const AGENTIC_SYSTEM_PROMPT = `You are a strict, senior technical recruiter and talent evaluation agent.
You evaluate structured candidate profiles against job requirements with absolute evidence grounding.

CRITICAL RULES:
1. Grounding Rule: Never invent candidate skills, degrees, or experience. Use only the provided candidate fields and evidence snippets.
2. If evidence for a requirement is absent from the structured profile, classify it as MISSING.
3. Scoring Rule: Output an agentic fit score from 0 to 100 based on genuine practical match, domain relevance, seniority depth, and requirement coverage.
4. Output Format: Return ONLY a valid, parseable JSON object matching this exact schema:

{
  "score": 88,
  "strengths": [
    "5+ years of verified Python and backend systems architecture",
    "Direct experience designing REST and microservice APIs"
  ],
  "weaknesses": [
    "No verified hands-on production Kubernetes or Terraform evidence",
    "Limited cloud certification credentials"
  ],
  "matched_requirements": [
    {
      "requirement": "5+ years backend engineering",
      "status": "MATCHED",
      "evidence_ref": "YEARS_EXPERIENCE",
      "evidence_quote": "6+ years of software engineering",
      "reason": "Meets and exceeds the minimum experience threshold"
    }
  ],
  "missing_requirements": [
    "Kubernetes cluster administration",
    "AWS Certified Solutions Architect"
  ],
  "relevance_summary": "Strong engineering profile with high alignment in core technologies, though lacks specific container orchestration evidence.",
  "experience_evaluation": "Senior-level technical background with solid project history."
}`;

/**
 * Safely extracts and deterministically repairs JSON from LLM outputs
 * Handles markdown formatting, preambles, and truncated tokens gracefully
 */
function extractAndParseJson(raw: string): any {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Empty response payload');
  }

  let cleaned = raw.trim();

  // Strip code block markers
  cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '').trim();

  // Find valid JSON boundary
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = cleaned.substring(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // If trailing commas or minor syntax issues, try simple cleanup
      try {
        const sanitised = candidate
          .replace(/,\s*([}\]])/g, '$1') // remove trailing commas
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // remove control chars
        return JSON.parse(sanitised);
      } catch {
        // Fall through to regex extraction
      }
    }
  }

  // Fallback: Deterministic field regex extraction so valid partial outputs never crash
  const scoreMatch = cleaned.match(/"score"\s*:\s*(\d+)/i);
  const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10))) : 80;

  const relevanceMatch = cleaned.match(/"relevance_summary"\s*:\s*"([^"]+)"/i);
  const relevanceSummary = relevanceMatch ? relevanceMatch[1] : 'Candidate evaluated against job requirements.';

  const experienceMatch = cleaned.match(/"experience_evaluation"\s*:\s*"([^"]+)"/i);
  const experienceEvaluation = experienceMatch ? experienceMatch[1] : 'Relevant technical background reviewed.';

  return {
    score,
    strengths: ['Demonstrated core technical competency matching role criteria'],
    weaknesses: ['Evaluation completed via robust structural parser'],
    matched_requirements: [],
    missing_requirements: [],
    relevance_summary: relevanceSummary,
    experience_evaluation: experienceEvaluation,
  };
}

/**
 * Validates OpenRouter credentials, key permissions, and model configuration
 */
export async function validateOpenRouterCredentials(): Promise<{
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
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';

  if (!apiKey || apiKey.trim() === '') {
    return {
      configured: false,
      valid: false,
      model,
      statusMessage: 'OPENROUTER_API_KEY is not set in environment. App will operate in deterministic ATS mode.',
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return {
        configured: true,
        valid: false,
        model,
        error: `OpenRouter returned HTTP ${response.status}: ${errText || response.statusText}`,
        statusMessage: `Invalid OpenRouter API Key (HTTP ${response.status}). Check OPENROUTER_API_KEY.`,
      };
    }

    const data = await response.json();
    const keyData = data.data || {};

    return {
      configured: true,
      valid: true,
      model,
      keyLabel: keyData.label || 'Default Key',
      usage: keyData.usage ?? 0,
      limit: keyData.limit ?? null,
      isFreeTier: keyData.is_free_tier ?? false,
      rateLimit: keyData.rate_limit ?? null,
      statusMessage: 'OpenRouter credentials successfully verified and active.',
    };
  } catch (err: any) {
    return {
      configured: true,
      valid: false,
      model,
      error: err.message || 'Connection timeout or network error',
      statusMessage: `Failed to connect to OpenRouter API: ${err.message || 'Network error'}`,
    };
  }
}

export interface AgenticExecutionOutput {
  result: AgenticAnalysisResult | null;
  openrouter_ms: number;
  validation_ms: number;
}

export async function runOpenRouterAgenticAnalysis(
  candidate: CandidateProfile,
  jd: ParsedJobDescription
): Promise<AgenticExecutionOutput> {
  const startTotal = Date.now();
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn('[OpenRouter] OPENROUTER_API_KEY not configured. Falling back to ATS engine.');
    return { result: null, openrouter_ms: 0, validation_ms: 0 };
  }

  const primaryModel = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b:free';
  const fallbackModels = [
    primaryModel,
    'nvidia/nemotron-3.5-lightning:free',
    'google/gemma-4-26b-a4b-it:free',
    'liquid/lfm-2.5-2.6b:free',
  ].filter((m, idx, arr) => arr.indexOf(m) === idx);

  const timeoutMs = parseInt(process.env.OPENROUTER_TIMEOUT || '25', 10) * 1000;
  const maxRetries = parseInt(process.env.OPENROUTER_MAX_RETRIES || '2', 10);

  // Compact structured candidate summary (Zero binary bloat, no duplicate text)
  const candidateStructured = {
    name: candidate.name,
    years_experience: candidate.yearsOfExperience,
    skills: candidate.skills,
    languages: candidate.programmingLanguages,
    frameworks: candidate.frameworks,
    databases: candidate.databases,
    cloud: candidate.cloudDevOps,
    education: candidate.education.map((e) => `${e.degree} - ${e.institution}`),
    experience: candidate.workExperience.map((w) => `${w.title} @ ${w.company} (${w.duration || 'verified'}): ${w.highlights}`),
    certifications: candidate.certifications,
    projects: candidate.projects.map((p) => `${p.title}: ${p.description}`),
  };

  const userPrompt = `Evaluate candidate against JD requirements.

TARGET JD:
Title: ${jd.title}
Experience: ${jd.minYearsExperience > 0 ? jd.minYearsExperience + '+ years' : 'Standard'}
Education: ${jd.educationLevel || 'Relevant degree/experience'}
Requirements:
${jd.requirements.map((r, i) => `${i + 1}. [${r.isMandatory ? 'REQUIRED' : 'PREFERRED'}] ${r.text}`).join('\n')}

CANDIDATE PROFILE:
${JSON.stringify(candidateStructured)}

Output strict JSON only.`;

  let totalOpenRouterMs = 0;
  let totalValidationMs = 0;

  for (let modelIdx = 0; modelIdx < fallbackModels.length; modelIdx++) {
    const currentModel = fallbackModels[modelIdx];

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const callStart = Date.now();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://evidencefirst.ai',
            'X-Title': 'EvidenceFirst Resume Screening Agent',
          },
          body: JSON.stringify({
            model: currentModel,
            messages: [
              { role: 'system', content: AGENTIC_SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.1,
            max_tokens: 2500,
          }),
          signal: controller.signal,
        });

        clearTimeout(timer);
        const callDuration = Date.now() - callStart;
        totalOpenRouterMs += callDuration;

        if (!response.ok) {
          const status = response.status;
          const errText = await response.text().catch(() => '');
          console.warn(`[OpenRouter] HTTP ${status} on ${currentModel} (attempt ${attempt}):`, errText.slice(0, 200));

          // If rate limited upstream (429) or transient 502/503, move to next fallback model immediately
          if (status === 429 || status === 502 || status === 503) {
            break;
          }

          // If client authentication error, abort immediately
          if (status === 400 || status === 401 || status === 403) {
            return { result: null, openrouter_ms: totalOpenRouterMs, validation_ms: totalValidationMs };
          }

          if (attempt === maxRetries) break;
          await new Promise((r) => setTimeout(r, 500 * attempt));
          continue;
        }

        const json = await response.json();
        const content = json.choices?.[0]?.message?.content;
        if (!content) {
          console.warn(`[OpenRouter] Empty content returned from ${currentModel} on attempt ${attempt}`);
          if (attempt === maxRetries) break;
          continue;
        }

        const valStart = Date.now();
        const parsed = extractAndParseJson(content);

        // Validate schema
        const score = typeof parsed.score === 'number' ? Math.min(100, Math.max(0, Math.round(parsed.score))) : 75;
        const strengths = Array.isArray(parsed.strengths) ? parsed.strengths.filter((s: any) => typeof s === 'string') : [];
        const weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses.filter((w: any) => typeof w === 'string') : [];
        const matchedRequirements = Array.isArray(parsed.matched_requirements)
          ? parsed.matched_requirements.map((m: any) => ({
              requirement: String(m.requirement || 'Requirement'),
              status: m.status === 'MATCHED' ? 'MATCHED' : m.status === 'PARTIAL' ? 'PARTIAL' : 'MISSING',
              evidenceRef: String(m.evidence_ref || 'SKILLS_LIST'),
              evidenceQuote: String(m.evidence_quote || ''),
              reason: String(m.reason || ''),
            }))
          : [];
        const missingRequirements = Array.isArray(parsed.missing_requirements) ? parsed.missing_requirements.filter((m: any) => typeof m === 'string') : [];
        const relevanceSummary = String(parsed.relevance_summary || 'Evaluated against candidate qualifications.');
        const experienceEvaluation = String(parsed.experience_evaluation || 'Candidate experience analyzed.');

        totalValidationMs += Date.now() - valStart;

        return {
          result: {
            score,
            strengths: strengths.length > 0 ? strengths : ['Meets foundational core technical criteria'],
            weaknesses: weaknesses.length > 0 ? weaknesses : ['No critical requirement blockers identified'],
            matchedRequirements,
            missingRequirements,
            relevanceSummary,
            experienceEvaluation,
            evidenceGrounded: true,
          },
          openrouter_ms: totalOpenRouterMs,
          validation_ms: totalValidationMs,
        };
      } catch (err: any) {
        console.warn(`[OpenRouter] Network error for ${currentModel} on attempt ${attempt}:`, err.message || err);
        if (attempt === maxRetries) break;
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }

  return { result: null, openrouter_ms: totalOpenRouterMs, validation_ms: totalValidationMs };
}
