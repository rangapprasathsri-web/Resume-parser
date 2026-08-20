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
 * Safely extracts JSON from an LLM response string that might contain markdown blocks
 */
function extractAndParseJson(raw: string): any {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  }

  // Find the first '{' and last '}'
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }

  return JSON.parse(cleaned);
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

export async function runOpenRouterAgenticAnalysis(
  candidate: CandidateProfile,
  jd: ParsedJobDescription
): Promise<AgenticAnalysisResult | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn('[OpenRouter] OPENROUTER_API_KEY not configured. Falling back to ATS engine.');
    return null;
  }

  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';
  const timeoutMs = parseInt(process.env.OPENROUTER_TIMEOUT || '60', 10) * 1000;
  const maxRetries = parseInt(process.env.OPENROUTER_MAX_RETRIES || '2', 10);

  // Prepare structured candidate summary for the model (NOT raw PDF binaries)
  const candidateStructured = {
    name: candidate.name,
    years_experience: candidate.yearsOfExperience,
    skills: candidate.skills,
    programming_languages: candidate.programmingLanguages,
    frameworks: candidate.frameworks,
    databases: candidate.databases,
    cloud_devops: candidate.cloudDevOps,
    education: candidate.education,
    work_experience_highlights: candidate.workExperience.map((w) => `${w.title} at ${w.company}: ${w.highlights}`),
    certifications: candidate.certifications,
    projects: candidate.projects.map((p) => `${p.title}: ${p.description}`),
    achievements: candidate.achievements,
  };

  const userPrompt = `Evaluate this candidate for the target role.

JOB DESCRIPTION:
Title: ${jd.title}
Required Skills: ${jd.requiredSkills.join(', ') || 'Not specified'}
Preferred Skills: ${jd.preferredSkills.join(', ') || 'Not specified'}
Experience Required: ${jd.minYearsExperience > 0 ? jd.minYearsExperience + '+ years' : 'Standard'}
Education: ${jd.educationLevel || 'Relevant degree or experience'}
Key Requirements:
${jd.requirements.map((r, i) => `${i + 1}. [${r.isMandatory ? 'REQUIRED' : 'PREFERRED'}] ${r.text}`).join('\n')}

CANDIDATE PROFILE (STRUCTURED & EXTRACTED):
${JSON.stringify(candidateStructured, null, 2)}

Provide strict, grounded analysis in the requested JSON format.`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://evidencefirst.ai',
          'X-Title': 'EvidenceFirst Resume Screening Agent',
        },
        body: JSON.stringify({
          model,
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

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[OpenRouter] HTTP ${response.status} on attempt ${attempt}:`, errText);
        if (attempt === maxRetries) return null;
        continue;
      }

      const json = await response.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content) {
        console.warn(`[OpenRouter] Empty content returned on attempt ${attempt}`);
        if (attempt === maxRetries) return null;
        continue;
      }

      const parsed = extractAndParseJson(content);

      // Validate schema
      const score = typeof parsed.score === 'number' ? Math.min(100, Math.max(0, Math.round(parsed.score))) : 75;
      const strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
      const weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [];
      const matchedRequirements = Array.isArray(parsed.matched_requirements)
        ? parsed.matched_requirements.map((m: any) => ({
            requirement: String(m.requirement || 'Requirement'),
            status: m.status === 'MATCHED' ? 'MATCHED' : m.status === 'PARTIAL' ? 'PARTIAL' : 'MISSING',
            evidenceRef: String(m.evidence_ref || 'SKILLS_LIST'),
            evidenceQuote: String(m.evidence_quote || ''),
            reason: String(m.reason || ''),
          }))
        : [];
      const missingRequirements = Array.isArray(parsed.missing_requirements) ? parsed.missing_requirements : [];
      const relevanceSummary = String(parsed.relevance_summary || 'Evaluated against candidate qualifications.');
      const experienceEvaluation = String(parsed.experience_evaluation || 'Candidate experience analyzed.');

      return {
        score,
        strengths,
        weaknesses,
        matchedRequirements,
        missingRequirements,
        relevanceSummary,
        experienceEvaluation,
        evidenceGrounded: true,
      };
    } catch (err: any) {
      console.warn(`[OpenRouter] Error on attempt ${attempt}:`, err.message || err);
      if (attempt === maxRetries) {
        return null;
      }
    }
  }

  return null;
}
