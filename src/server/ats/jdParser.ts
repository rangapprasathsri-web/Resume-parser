export interface ParsedRequirement {
  id: string;
  text: string;
  category: 'SKILL' | 'EXPERIENCE' | 'EDUCATION' | 'CERTIFICATION' | 'TOOL' | 'DOMAIN';
  isMandatory: boolean; // Required vs Preferred
  weight: number; // Configurable weight
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

const COMMON_TECH_KEYWORDS = [
  'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'golang', 'go', 'rust', 'ruby', 'php',
  'react', 'vue', 'angular', 'next.js', 'node.js', 'node', 'express', 'fastapi', 'django', 'flask',
  'spring', 'spring boot', 'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'k8s', 'terraform', 'ci/cd', 'git', 'graphql',
  'rest api', 'microservices', 'machine learning', 'deep learning', 'pytorch', 'tensorflow', 'llm',
  'nlp', 'sql', 'nosql', 'linux', 'tailwind', 'redux', 'kafka', 'spark', 'pandas', 'scikit-learn'
];

/**
 * Extracts job title from JD text
 */
export function extractJobTitle(jdText: string): string {
  const lines = jdText.split('\n').map((l) => l.trim()).filter(Boolean);
  const titlePrefix = lines.find((l) =>
    /^(job title|position|role|title|opening|seeking|hiring):\s*/i.test(l)
  );

  if (titlePrefix) {
    return titlePrefix.replace(/^(job title|position|role|title|opening|seeking|hiring):\s*/i, '').trim();
  }

  // First non-empty short line
  const firstShort = lines.find((l) => l.length > 3 && l.length < 50 && !/requirements|responsibilities|about|overview/i.test(l));
  return firstShort || 'Target Job Position';
}

/**
 * Deterministically parses Job Description into structured requirements
 */
export function parseJobDescription(jdText: string): ParsedJobDescription {
  const lines = jdText.split('\n').map((l) => l.trim()).filter(Boolean);
  const title = extractJobTitle(jdText);

  const requirements: ParsedRequirement[] = [];
  const requiredSkills: string[] = [];
  const preferredSkills: string[] = [];
  let isPreferredSection = false;
  let minYears = 0;
  let educationLevel: string | null = null;
  const certifications: string[] = [];

  // Extract years requirement from entire JD
  const expMatch = jdText.match(/(\d+)\+?\s*(?:to\s*\d+\s*)?years(?:\s+of)?\s+(?:experience|in|working)/i);
  if (expMatch) {
    minYears = parseInt(expMatch[1], 10);
  }

  // Extract education requirements
  if (/phd|doctorate/i.test(jdText)) {
    educationLevel = 'PhD';
  } else if (/master|m\.s|msc|mba/i.test(jdText)) {
    educationLevel = "Master's Degree";
  } else if (/bachelor|b\.s|bsc|b\.tech|degree in computer science/i.test(jdText)) {
    educationLevel = "Bachelor's Degree";
  }

  let reqCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Detect section headers for preferred vs required
    if (/preferred|nice to have|bonus|plus|desirable|optional/i.test(lowerLine) && lowerLine.length < 40) {
      isPreferredSection = true;
      continue;
    }
    if (/required|minimum qualifications|must have|requirements|what we're looking for/i.test(lowerLine) && lowerLine.length < 40) {
      isPreferredSection = false;
      continue;
    }

    // Skip generic headers
    if (/^(about us|who we are|responsibilities|what you'll do|perks|benefits|company overview):?$/i.test(lowerLine)) {
      continue;
    }

    // Identify requirement lines (bullets or lines with keywords)
    const isBullet = /^[-*•\d.]+\s+/.test(line);
    const cleanText = line.replace(/^[-*•\d.]+\s*/, '').trim();

    if (cleanText.length > 15 && cleanText.length < 300) {
      const isPreferred = isPreferredSection || /preferred|plus|bonus|nice to have/i.test(cleanText);

      // Determine category
      let category: ParsedRequirement['category'] = 'SKILL';
      if (/year|experience|senior|lead|track record|background/i.test(cleanText)) {
        category = 'EXPERIENCE';
      } else if (/degree|bachelor|master|phd|education|university/i.test(cleanText)) {
        category = 'EDUCATION';
      } else if (/certif|license|aws certified|pmp|cka/i.test(cleanText)) {
        category = 'CERTIFICATION';
      } else if (/docker|kubernetes|aws|cloud|terraform|git|linux|tool/i.test(cleanText)) {
        category = 'TOOL';
      } else if (/domain|healthcare|fintech|e-commerce|security|distributed systems/i.test(cleanText)) {
        category = 'DOMAIN';
      }

      // Extract tech keywords from this requirement
      const matchedKeywords = COMMON_TECH_KEYWORDS.filter((kw) => {
        const regex = new RegExp(`\\b${kw.replace('+', '\\+').replace('.', '\\.')}\\b`, 'i');
        return regex.test(cleanText);
      });

      if (matchedKeywords.length > 0) {
        if (isPreferred) {
          preferredSkills.push(...matchedKeywords);
        } else {
          requiredSkills.push(...matchedKeywords);
        }
      }

      reqCount++;
      requirements.push({
        id: `req-${reqCount}`,
        text: cleanText,
        category,
        isMandatory: !isPreferred,
        weight: !isPreferred ? 1.5 : 1.0,
        keywords: matchedKeywords,
      });
    }
  }

  // If no requirements parsed, fallback to synthesized requirements from keywords
  if (requirements.length === 0) {
    const allFoundKeywords = COMMON_TECH_KEYWORDS.filter((kw) => {
      const regex = new RegExp(`\\b${kw.replace('+', '\\+').replace('.', '\\.')}\\b`, 'i');
      return regex.test(jdText);
    });

    if (allFoundKeywords.length > 0) {
      allFoundKeywords.slice(0, 8).forEach((kw, idx) => {
        requirements.push({
          id: `req-${idx + 1}`,
          text: `Demonstrated proficiency and hands-on experience in ${kw.toUpperCase()}`,
          category: 'SKILL',
          isMandatory: idx < 4,
          weight: idx < 4 ? 1.5 : 1.0,
          keywords: [kw],
        });
      });
    } else {
      requirements.push(
        {
          id: 'req-1',
          text: `${minYears > 0 ? minYears : 3}+ years of professional engineering experience`,
          category: 'EXPERIENCE',
          isMandatory: true,
          weight: 1.5,
          keywords: ['experience'],
        },
        {
          id: 'req-2',
          text: 'Proficiency with core programming languages and system design',
          category: 'SKILL',
          isMandatory: true,
          weight: 1.5,
          keywords: ['programming', 'system design'],
        },
        {
          id: 'req-3',
          text: 'Experience with version control, testing, and modern deployment pipelines',
          category: 'TOOL',
          isMandatory: false,
          weight: 1.0,
          keywords: ['git', 'ci/cd'],
        }
      );
    }
  }

  return {
    title,
    summary: lines.slice(0, 3).join(' '),
    requirements: requirements.slice(0, 15),
    requiredSkills: Array.from(new Set(requiredSkills)),
    preferredSkills: Array.from(new Set(preferredSkills)),
    minYearsExperience: minYears,
    educationLevel,
    certifications: Array.from(new Set(certifications)),
    rawText: jdText,
  };
}
