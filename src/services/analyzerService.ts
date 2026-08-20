import { AnalysisResult, ExtractedField, JobRequirement, FieldId, ExtractionStatus, RequirementStatus, ConfidenceLevel } from '../types';
import { parseResumeAndJd } from '../utils/parserSimulator';

interface AnalyzeRequestPayload {
  resumeText: string;
  jdText: string;
  candidateName?: string;
  targetRole?: string;
}

export async function runResumeAnalysis(payload: AnalyzeRequestPayload): Promise<AnalysisResult> {
  const { resumeText, jdText, candidateName, targetRole } = payload;

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeText,
        jdText,
        candidateName,
        targetRole,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return mapTwoStageResponseToAnalysisResult(json.data, resumeText, jdText, candidateName, targetRole);
      }
    }
  } catch (err) {
    console.warn('Backend /api/analyze call skipped or unavailable. Running high-precision local parser.', err);
  }

  // Fallback to client-side deterministic grounding engine
  return parseResumeAndJd(resumeText, jdText, candidateName, targetRole);
}

function mapTwoStageResponseToAnalysisResult(
  data: {
    fields?: Array<{
      field_id: string;
      category?: string;
      status: string;
      value: any;
      evidence: string | null;
      source_section?: string;
      note?: string | null;
    }>;
    fit_report?: Array<{
      requirement: string;
      match_status: string;
      explanation: string;
      evidence_ref?: string | null;
      confidence?: string;
    }>;
  },
  rawResumeText: string,
  rawJdText: string,
  customName?: string,
  customRole?: string
): AnalysisResult {
  const rawFields = data.fields || [];
  const rawFitReport = data.fit_report || [];

  // Map fields
  const fields: ExtractedField[] = rawFields.map((rf) => {
    const canonicalId = (rf.field_id || 'FIELD').toUpperCase() as FieldId;
    const status: ExtractionStatus =
      rf.status === 'FOUND' ? 'FOUND' : rf.status === 'AMBIGUOUS' ? 'AMBIGUOUS' : 'NOT_FOUND';

    let category = rf.category as any;
    if (!category) {
      if (/NAME|EMAIL|PHONE|LINKEDIN|LOCATION|CONTACT/i.test(canonicalId)) category = 'identity';
      else if (/SKILL|TOOL/i.test(canonicalId)) category = 'skills';
      else if (/TITLE|COMPANY|EXPERIENCE|PROJECT|WORK/i.test(canonicalId)) category = 'experience';
      else if (/DEGREE|EDUCATION|UNIVERSITY/i.test(canonicalId)) category = 'education';
      else category = 'credentials';
    }

    return {
      id: canonicalId,
      label: formatFieldLabel(canonicalId),
      category: category || 'identity',
      status,
      value: rf.value ?? 'None found',
      evidence: rf.evidence || '',
      sourceSection: rf.source_section || 'Document Segment',
      ambiguity_note: rf.note || undefined,
      not_found_reason: status === 'NOT_FOUND' ? (rf.note || 'No verifiable mention found in resume text.') : undefined,
    };
  });

  // Map fit report requirements
  const requirements: JobRequirement[] = rawFitReport.map((rr, idx) => {
    const status: RequirementStatus =
      rr.match_status === 'MATCHED' ? 'MATCHED' : rr.match_status === 'PARTIAL' ? 'PARTIAL' : 'MISSING';
    const confidence: ConfidenceLevel =
      rr.confidence === 'low' ? 'low' : rr.confidence === 'medium' ? 'medium' : 'high';

    const refId = (rr.evidence_ref ? rr.evidence_ref.toUpperCase() : 'SKILLS-LIST') as FieldId;
    const fieldObj = fields.find((f) => f.id === refId);

    return {
      id: `req-ai-${idx + 1}`,
      requirement: rr.requirement,
      category: determineReqCategory(rr.requirement),
      status,
      confidence,
      explanation: rr.explanation,
      evidence_ref: refId,
      evidence_quote: status !== 'MISSING' && fieldObj ? (fieldObj.evidence.split('\n')[0] || undefined) : undefined,
      isMandatory: idx < 4,
    };
  });

  // Sort fit_report: MATCHED, then PARTIAL, then MISSING; ties broken by evidence_ref alphabetically
  const statusRank: Record<RequirementStatus, number> = {
    MATCHED: 1,
    PARTIAL: 2,
    MISSING: 3,
  };

  requirements.sort((a, b) => {
    const rankDiff = statusRank[a.status] - statusRank[b.status];
    if (rankDiff !== 0) return rankDiff;
    return (a.evidence_ref || '').localeCompare(b.evidence_ref || '');
  });

  const matchedCount = requirements.filter((r) => r.status === 'MATCHED').length;
  const totalRequirements = requirements.length || 1;
  const fitScorePercentage = Math.round((matchedCount / totalRequirements) * 100);

  const candidateName =
    customName ||
    (fields.find((f) => f.id === 'FULL_NAME' || f.id === 'CONTACT-INFO')?.value as any)?.name ||
    'Evaluated Candidate';

  const targetRole = customRole || 'Target Role Assessment';

  return {
    id: `run-${Date.now()}`,
    fileName: `${String(candidateName).replace(/[^a-zA-Z0-9]/g, '_')}_CV.pdf`,
    candidateName: String(candidateName),
    targetRole,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
    scorer: 'llm',
    fitScorePercentage,
    matchedCount,
    totalRequirements,
    overallSummary: `Stage 1 extracted ${fields.filter((f) => f.status === 'FOUND').length} verified fields. Stage 2 scored candidate against ${totalRequirements} JD criteria, matching ${matchedCount} requirements.`,
    keyStrengths: requirements
      .filter((r) => r.status === 'MATCHED')
      .slice(0, 3)
      .map((r) => r.requirement),
    keyGaps: requirements
      .filter((r) => r.status === 'MISSING')
      .map((r) => `Missing evidence: ${r.requirement}`),
    rawResumeText,
    rawJdText,
    fields,
    requirements,
  };
}

function formatFieldLabel(id: string): string {
  return id
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function determineReqCategory(text: string): string {
  if (/year|senior|experience/i.test(text)) return 'Experience & Seniority';
  if (/react|go|rust|python|typescript|java|node/i.test(text)) return 'Core Languages & Tech';
  if (/degree|education|bachelor|master|phd/i.test(text)) return 'Education';
  if (/cloud|aws|docker|kubernetes|infra/i.test(text)) return 'Infrastructure & Cloud';
  if (/certif|license/i.test(text)) return 'Certifications';
  return 'Domain & Technical Fit';
}
