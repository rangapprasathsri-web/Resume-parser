import { CandidateProfile, CandidateField } from '../parser/fieldParser';
import { ParsedJobDescription, ParsedRequirement } from './jdParser';

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

// Canonical technology aliases
const TECH_ALIASES: Record<string, string[]> = {
  postgresql: ['postgres', 'postgresql', 'psql', 'postgres sql', 'pg'],
  kubernetes: ['k8s', 'kubernetes', 'kube', 'kubectl'],
  react: ['react', 'react.js', 'reactjs'],
  'node.js': ['node', 'node.js', 'nodejs'],
  'vue.js': ['vue', 'vue.js', 'vuejs'],
  'next.js': ['next', 'next.js', 'nextjs'],
  golang: ['go', 'golang'],
  'amazon web services': ['aws', 'amazon web services', 'amazon cloud'],
  'google cloud platform': ['gcp', 'google cloud', 'google cloud platform'],
  docker: ['docker', 'containerization', 'containers', 'dockerfile'],
  'ci/cd': ['ci/cd', 'ci-cd', 'continuous integration', 'github actions', 'gitlab ci', 'jenkins'],
  graphql: ['graphql', 'gql'],
  typescript: ['typescript', 'ts'],
  javascript: ['javascript', 'js', 'ecmascript'],
  'machine learning': ['ml', 'machine learning', 'deep learning', 'ai/ml'],
  python: ['python', 'py', 'python3'],
};

/**
 * Calculates Levenshtein distance for bounded fuzzy matching
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Normalized token comparison
 */
function normalizeString(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Checks whether a requirement keyword matches candidate text via Exact, Alias, or Fuzzy
 */
function matchKeyword(
  keyword: string,
  candidateText: string,
  candidateSkills: string[]
): { matched: boolean; type: 'EXACT' | 'NORMALIZED' | 'FUZZY' | 'NONE'; matchedAs: string } {
  const normKw = normalizeString(keyword);
  if (!normKw) return { matched: false, type: 'NONE', matchedAs: '' };

  const normCandidateText = normalizeString(candidateText);

  // 1. Exact regex boundary match
  const exactRegex = new RegExp(`\\b${keyword.replace('+', '\\+').replace('.', '\\.')}\\b`, 'i');
  if (exactRegex.test(candidateText)) {
    return { matched: true, type: 'EXACT', matchedAs: keyword };
  }

  // 2. Alias lookup
  for (const [canonical, aliases] of Object.entries(TECH_ALIASES)) {
    if (aliases.includes(normKw) || canonical === normKw) {
      for (const alias of aliases) {
        const aliasRegex = new RegExp(`\\b${alias.replace('+', '\\+').replace('.', '\\.')}\\b`, 'i');
        if (aliasRegex.test(candidateText)) {
          return { matched: true, type: 'NORMALIZED', matchedAs: alias };
        }
      }
    }
  }

  // 3. Normalized phrase match
  if (normCandidateText.includes(normKw)) {
    return { matched: true, type: 'NORMALIZED', matchedAs: normKw };
  }

  // 4. Bounded Fuzzy match against candidate extracted skills (strictly for typos with length > 4)
  if (normKw.length >= 5) {
    for (const skill of candidateSkills) {
      const normSkill = normalizeString(skill);
      if (Math.abs(normSkill.length - normKw.length) <= 2) {
        const dist = levenshteinDistance(normKw, normSkill);
        if (dist === 1) {
          return { matched: true, type: 'FUZZY', matchedAs: skill };
        }
      }
    }
  }

  return { matched: false, type: 'NONE', matchedAs: '' };
}

/**
 * Deterministic, Independent ATS Matching Engine (Zero LLM dependency)
 */
export function runAtsEngine(
  candidate: CandidateProfile,
  jd: ParsedJobDescription
): AtsResult {
  const matchedRequirements: AtsMatchedItem[] = [];
  const missingRequirements: AtsMatchedItem[] = [];
  const partialMatches: AtsMatchedItem[] = [];

  const matchedKeywordsSet = new Set<string>();
  const missingKeywordsSet = new Set<string>();

  let requiredEarned = 0;
  let requiredPossible = 0;
  let preferredEarned = 0;
  let preferredPossible = 0;

  // Evaluate each parsed requirement against structured candidate fields
  for (const req of jd.requirements) {
    let reqStatus: 'MATCHED' | 'PARTIAL' | 'NOT_FOUND' = 'NOT_FOUND';
    let matchType: 'EXACT' | 'NORMALIZED' | 'FUZZY' | 'NONE' = 'NONE';
    const foundKeywordsForReq: string[] = [];
    let evidenceFieldId = 'SKILLS_LIST';
    let evidenceQuote = '';

    // Evaluate any embedded technical keywords in all requirement lines
    if (req.keywords && req.keywords.length > 0) {
      for (const kw of req.keywords) {
        const check = matchKeyword(kw, candidate.rawText, candidate.skills);
        if (check.matched) {
          matchedKeywordsSet.add(kw);
          foundKeywordsForReq.push(check.matchedAs);
        } else {
          missingKeywordsSet.add(kw);
        }
      }
    }

    if (req.category === 'EXPERIENCE') {
      evidenceFieldId = 'YEARS_EXPERIENCE';
      const candidateYears = candidate.yearsOfExperienceNum;
      if (candidateYears >= jd.minYearsExperience && candidateYears > 0) {
        reqStatus = 'MATCHED';
        matchType = 'EXACT';
        evidenceQuote = `${candidate.yearsOfExperience} verified`;
      } else if (candidateYears > 0) {
        reqStatus = 'PARTIAL';
        matchType = 'NORMALIZED';
        evidenceQuote = `${candidate.yearsOfExperience} found (JD requests ${jd.minYearsExperience}+ years)`;
      }
    } else if (req.category === 'EDUCATION') {
      evidenceFieldId = 'EDUCATION';
      const hasDegree = candidate.education && candidate.education.length > 0;
      if (hasDegree) {
        reqStatus = 'MATCHED';
        matchType = 'EXACT';
        evidenceQuote = candidate.education.map((e) => `${e.degree} - ${e.institution}`).join(', ');
      }
    } else if (req.category === 'CERTIFICATION') {
      evidenceFieldId = 'CERTIFICATIONS';
      if (candidate.certifications && candidate.certifications.length > 0) {
        reqStatus = 'MATCHED';
        matchType = 'EXACT';
        evidenceQuote = candidate.certifications.slice(0, 3).join(', ');
      }
    } else {
      // Skill / Tool / Domain requirement
      evidenceFieldId = 'SKILLS_LIST';
      let matchedCount = 0;
      const targetKeywords = req.keywords.length > 0
        ? req.keywords
        : normalizeString(req.text).split(' ').filter((w) => w.length > 3).slice(0, 4);

      for (const kw of targetKeywords) {
        const check = matchKeyword(kw, candidate.rawText, candidate.skills);
        if (check.matched) {
          matchedCount++;
          matchType = check.type;
          foundKeywordsForReq.push(check.matchedAs);
          matchedKeywordsSet.add(kw);
        } else {
          missingKeywordsSet.add(kw);
        }
      }

      const totalTarget = targetKeywords.length || 1;
      const matchRatio = matchedCount / totalTarget;

      if (matchRatio >= 0.6 || matchedCount >= 2) {
        reqStatus = 'MATCHED';
        // Locate matching evidence from candidate fields
        const relevantField = candidate.fields.find((f) =>
          f.value && JSON.stringify(f.value).toLowerCase().includes(foundKeywordsForReq[0]?.toLowerCase() || '')
        );
        evidenceQuote = relevantField ? relevantField.evidence.slice(0, 150) : foundKeywordsForReq.join(', ');
      } else if (matchRatio > 0 || matchedCount === 1) {
        reqStatus = 'PARTIAL';
        evidenceQuote = `Found partial alignment on: ${foundKeywordsForReq.join(', ')}`;
      }
    }

    const item: AtsMatchedItem = {
      requirementId: req.id,
      requirement: req.text,
      category: req.category,
      isMandatory: req.isMandatory,
      status: reqStatus,
      matchType,
      matchedKeywords: foundKeywordsForReq,
      evidenceRef: evidenceFieldId,
      evidenceQuote: evidenceQuote || 'No verifiable mention in resume text.',
      scoreContribution: reqStatus === 'MATCHED' ? 1.0 : reqStatus === 'PARTIAL' ? 0.5 : 0,
    };

    if (req.isMandatory) {
      requiredPossible += 1.0;
      requiredEarned += item.scoreContribution;
    } else {
      preferredPossible += 1.0;
      preferredEarned += item.scoreContribution;
    }

    if (reqStatus === 'MATCHED') {
      matchedRequirements.push(item);
    } else if (reqStatus === 'PARTIAL') {
      partialMatches.push(item);
    } else {
      missingRequirements.push(item);
    }
  }

  // Calculate Weighted Sub-Scores
  // Required Requirements: 60%
  const requiredScore = requiredPossible > 0 ? (requiredEarned / requiredPossible) * 60 : 60;
  // Preferred Requirements: 20%
  const preferredScore = preferredPossible > 0 ? (preferredEarned / preferredPossible) * 20 : 20;
  // Experience: 10%
  const expMatch = candidate.yearsOfExperienceNum >= (jd.minYearsExperience || 2);
  const experienceScore = expMatch ? 10 : Math.min(10, (candidate.yearsOfExperienceNum / (jd.minYearsExperience || 3)) * 10);
  // Education: 5%
  const educationScore = candidate.education.length > 0 ? 5 : 2;
  // Certifications: 5%
  const certScore = candidate.certifications.length > 0 ? 5 : 2;

  const totalAtsScore = Math.min(100, Math.max(0, Math.round(
    requiredScore + preferredScore + experienceScore + educationScore + certScore
  )));

  return {
    score: totalAtsScore,
    matchedRequirements,
    missingRequirements,
    partialMatches,
    matchedKeywords: Array.from(matchedKeywordsSet),
    missingKeywords: Array.from(missingKeywordsSet),
    breakdown: {
      requiredScore: Math.round(requiredScore),
      preferredScore: Math.round(preferredScore),
      experienceScore: Math.round(experienceScore),
      educationScore: Math.round(educationScore),
      certificationsScore: Math.round(certScore),
    },
  };
}
