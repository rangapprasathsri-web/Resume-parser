import { FinalCandidateAnalysis, JobScreeningSession, ParsedRequirement } from '../types';

/**
 * Escape string for CSV format
 */
function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Trigger browser file download
 */
function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Export filtered candidate roster as a CSV spreadsheet
 */
export function exportCandidatesToCsv(
  candidates: FinalCandidateAnalysis[],
  jobTitle: string = 'Screening'
) {
  const headers = [
    'Rank',
    'Candidate Name',
    'Overall Fit (%)',
    'ATS Score (%)',
    'Agentic AI Score (%)',
    'Recommendation',
    'File Name',
    'Email',
    'Phone',
    'Location',
    'Experience',
    'Matched Skills',
    'Missing Skills / Gaps',
    'Key Strengths',
    'Key Weaknesses / Flags',
    'Executive Summary',
  ];

  const rows = candidates.map((c, idx) => {
    const matchedSkills = c.ats?.matchedKeywords?.join('; ') || c.profile?.skills?.slice(0, 8).join('; ') || '';
    const missingSkills = c.ats?.missingKeywords?.join('; ') || '';
    const strengths = c.strengths?.join('; ') || '';
    const weaknesses = c.weaknesses?.join('; ') || '';

    return [
      escapeCsv(c.rank || idx + 1),
      escapeCsv(c.candidateName || 'Unknown'),
      escapeCsv(c.comprehensiveScore),
      escapeCsv(c.atsScore),
      escapeCsv(c.analysisMode === 'ats_only' ? 'N/A' : c.agenticScore),
      escapeCsv(c.recommendation),
      escapeCsv(c.fileName),
      escapeCsv(c.profile?.email || ''),
      escapeCsv(c.profile?.phone || ''),
      escapeCsv(c.profile?.location || ''),
      escapeCsv(c.profile?.yearsOfExperience || ''),
      escapeCsv(matchedSkills),
      escapeCsv(missingSkills),
      escapeCsv(strengths),
      escapeCsv(weaknesses),
      escapeCsv(c.relevanceSummary || ''),
    ].join(',');
  });

  const csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const sanitizedTitle = jobTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  triggerDownload(blob, `${sanitizedTitle}_Candidates_${Date.now()}.csv`);
}

/**
 * Export detailed Requirement-by-Candidate match matrix CSV
 */
export function exportRequirementsMatrixCsv(
  session: JobScreeningSession,
  candidates: FinalCandidateAnalysis[]
) {
  const reqs = session.parsedJd?.requirements || [];
  const reqHeaders = reqs.map((r, i) => `Req ${i + 1}: ${r.text.replace(/"/g, "'")}`);

  const headers = [
    'Rank',
    'Candidate Name',
    'Overall Fit (%)',
    'ATS Score (%)',
    ...reqHeaders,
  ];

  const rows = candidates.map((c, idx) => {
    const reqStatusColumns = reqs.map((r) => {
      // Check candidate ATS matches
      const atsItem = c.ats?.matchedRequirements?.find(
        (m) => m.requirementId === r.id || m.requirement.toLowerCase() === r.text.toLowerCase()
      );
      if (atsItem) return escapeCsv(atsItem.status === 'MATCHED' ? 'MATCHED (100%)' : 'PARTIAL (50%)');

      const missingItem = c.ats?.missingRequirements?.find(
        (m) => m.requirementId === r.id || m.requirement.toLowerCase() === r.text.toLowerCase()
      );
      if (missingItem) return escapeCsv('MISSING (0%)');

      // Fallback
      return escapeCsv('NOT FOUND');
    });

    return [
      escapeCsv(c.rank || idx + 1),
      escapeCsv(c.candidateName),
      escapeCsv(c.comprehensiveScore),
      escapeCsv(c.atsScore),
      ...reqStatusColumns,
    ].join(',');
  });

  const csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const sanitizedTitle = session.title.replace(/[^a-zA-Z0-9_-]/g, '_');
  triggerDownload(blob, `${sanitizedTitle}_Matrix_${Date.now()}.csv`);
}

/**
 * Export filtered candidate data as structured JSON
 */
export function exportCandidatesToJson(
  candidates: FinalCandidateAnalysis[],
  session?: JobScreeningSession
) {
  const exportPayload = {
    exportDate: new Date().toISOString(),
    jobId: session?.jobId || 'custom',
    jobTitle: session?.title || 'Candidates Export',
    jobDescription: session?.description || '',
    totalExported: candidates.length,
    sessionCandidateCount: session?.candidateCount || candidates.length,
    candidates: candidates.map((c) => ({
      rank: c.rank,
      candidateId: c.candidateId,
      candidateName: c.candidateName,
      fileName: c.fileName,
      scores: {
        overall: c.comprehensiveScore,
        ats: c.atsScore,
        agentic: c.agenticScore,
      },
      recommendation: c.recommendation,
      analysisMode: c.analysisMode,
      contact: {
        email: c.profile?.email,
        phone: c.profile?.phone,
        location: c.profile?.location,
        linkedinUrl: c.profile?.linkedinUrl,
      },
      experience: {
        years: c.profile?.yearsOfExperience,
        summary: c.profile?.summary,
        workExperience: c.profile?.workExperience,
        education: c.profile?.education,
      },
      skills: {
        all: c.profile?.skills,
        languages: c.profile?.programmingLanguages,
        frameworks: c.profile?.frameworks,
        databases: c.profile?.databases,
        cloudDevOps: c.profile?.cloudDevOps,
        matched: c.ats?.matchedKeywords,
        missing: c.ats?.missingKeywords,
      },
      evaluation: {
        strengths: c.strengths,
        weaknesses: c.weaknesses,
        relevanceSummary: c.relevanceSummary,
        matchedRequirementsCount: c.matchedRequirementsCount,
        totalRequirementsCount: c.totalRequirementsCount,
      },
      atsBreakdown: c.ats?.breakdown,
      matchedRequirements: c.ats?.matchedRequirements?.map((m) => ({
        requirement: m.requirement,
        status: m.status,
        matchType: m.matchType,
        evidenceQuote: m.evidenceQuote,
        evidenceRef: m.evidenceRef,
      })),
      createdAt: c.createdAt,
    })),
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const sanitizedTitle = (session?.title || 'Candidates').replace(/[^a-zA-Z0-9_-]/g, '_');
  triggerDownload(blob, `${sanitizedTitle}_Export_${Date.now()}.json`);
}
