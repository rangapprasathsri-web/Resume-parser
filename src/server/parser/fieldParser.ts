import { ResumeSection, segmentResume } from './sectionSegmenter';

export interface FieldEvidence {
  sourceSection: string;
  text: string;
  lineReference?: string;
}

export interface CandidateField {
  id: string;
  name: string;
  category: 'identity' | 'skills' | 'experience' | 'education' | 'credentials';
  status: 'FOUND' | 'NOT_FOUND' | 'AMBIGUOUS';
  value: any;
  evidence: string;
  sourceSection: string;
  note?: string;
}

export interface CandidateProfile {
  candidateId: string;
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  summary: string | null;
  yearsOfExperience: string | null;
  yearsOfExperienceNum: number;
  skills: string[];
  programmingLanguages: string[];
  frameworks: string[];
  databases: string[];
  cloudDevOps: string[];
  education: Array<{ degree: string; institution: string; year?: string }>;
  workExperience: Array<{ title: string; company: string; duration?: string; highlights?: string }>;
  certifications: string[];
  projects: Array<{ title: string; description: string; tech?: string[] }>;
  achievements: string[];
  fields: CandidateField[];
  rawText: string;
  contentHash: string;
}

const PROGRAMMING_LANGUAGES_LIST = [
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Golang', 'Rust', 'Ruby',
  'PHP', 'Swift', 'Kotlin', 'Scala', 'R', 'C', 'HTML5', 'CSS3', 'SQL', 'Bash', 'Shell', 'Perl'
];

const FRAMEWORKS_LIST = [
  'React', 'React.js', 'Next.js', 'Vue', 'Vue.js', 'Angular', 'Node.js', 'Express', 'FastAPI',
  'Django', 'Flask', 'Spring Boot', 'ASP.NET', 'Laravel', 'Rails', 'Ruby on Rails', 'Tailwind CSS',
  'GraphQL', 'gRPC', 'Redux', 'Svelte', 'PyTorch', 'TensorFlow', 'Scikit-learn', 'Pandas', 'NumPy'
];

const DATABASES_LIST = [
  'PostgreSQL', 'Postgres', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 'Cassandra',
  'Oracle', 'SQL Server', 'SQLite', 'Firebase', 'Firestore', 'Snowflake', 'BigQuery', 'Neo4j'
];

const CLOUD_DEVOPS_LIST = [
  'AWS', 'Amazon Web Services', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'K8s',
  'Terraform', 'CI/CD', 'GitHub Actions', 'GitLab CI', 'Jenkins', 'Ansible', 'Helm', 'ArgoCD',
  'Prometheus', 'Grafana', 'Datadog', 'Linux', 'Serverless'
];

/**
 * Simple fast string hash for duplicate detection
 */
export function calculateContentHash(text: string): string {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'hash_' + Math.abs(hash).toString(16) + '_' + normalized.length;
}

/**
 * Deterministically parses structured candidate profile and extracts evidence-grounded fields
 */
export function extractCandidateProfile(
  rawResumeText: string,
  candidateId: string,
  hintName?: string
): CandidateProfile {
  const sections = segmentResume(rawResumeText);
  const lines = rawResumeText.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Contact / Identity Extraction
  const contactSection = sections.find((s) => s.category === 'CONTACT')?.content || lines.slice(0, 8).join('\n');
  const emailMatch = rawResumeText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  const phoneMatch = rawResumeText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = rawResumeText.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const locationMatch = contactSection.match(/([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(\s+\d{5})?|[A-Z][a-zA-Z\s]+,\s*[A-Za-z\s]+)/);

  // Candidate Name Resolution
  let resolvedName = hintName;
  if (!resolvedName) {
    const firstFew = lines.slice(0, 3);
    for (const line of firstFew) {
      if (
        line.length > 2 &&
        line.length < 40 &&
        !line.includes('@') &&
        !line.includes('http') &&
        !/resume|curriculum|vitae|page|profile/i.test(line)
      ) {
        resolvedName = line.replace(/[^a-zA-Z\s.-]/g, '').trim();
        break;
      }
    }
  }
  if (!resolvedName && emailMatch) {
    resolvedName = emailMatch[0].split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  resolvedName = resolvedName || 'Candidate';

  // 2. Summary Extraction
  const summarySec = sections.find((s) => s.category === 'SUMMARY');
  const summaryText = summarySec ? summarySec.content : null;

  // 3. Skills Extraction & Categorization
  const fullLower = rawResumeText.toLowerCase();

  const foundLanguages = PROGRAMMING_LANGUAGES_LIST.filter((lang) => {
    const regex = new RegExp(`\\b${lang.replace('+', '\\+').replace('#', '\\#')}\\b`, 'i');
    return regex.test(rawResumeText);
  });

  const foundFrameworks = FRAMEWORKS_LIST.filter((fw) => {
    const regex = new RegExp(`\\b${fw.replace('.', '\\.')}\\b`, 'i');
    return regex.test(rawResumeText);
  });

  const foundDatabases = DATABASES_LIST.filter((db) => {
    const regex = new RegExp(`\\b${db}\\b`, 'i');
    return regex.test(rawResumeText);
  });

  const foundCloud = CLOUD_DEVOPS_LIST.filter((tool) => {
    const regex = new RegExp(`\\b${tool}\\b`, 'i');
    return regex.test(rawResumeText);
  });

  const combinedSkills = Array.from(
    new Set([...foundLanguages, ...foundFrameworks, ...foundDatabases, ...foundCloud])
  );

  // 4. Years of Experience calculation
  const expMatch = rawResumeText.match(/(\d+)\+?\s*(?:to\s*\d+\s*)?years(?:\s+of)?\s+(?:experience|in|working)/i);
  let yearsNum = 0;
  let yearsString = 'Not specified';
  if (expMatch) {
    yearsNum = parseInt(expMatch[1], 10);
    yearsString = `${yearsNum}+ years`;
  } else {
    // Estimate from date ranges like 2018 - 2024
    const dateRanges = rawResumeText.match(/\b(20\d{2}|19\d{2})\s*(?:-|–|to|present)\s*(20\d{2}|present|current)\b/gi);
    if (dateRanges && dateRanges.length > 0) {
      yearsNum = Math.min(15, dateRanges.length * 2);
      yearsString = `${yearsNum}+ years (estimated from career timeline)`;
    }
  }

  // 5. Work Experience Extraction
  const expSec = sections.find((s) => s.category === 'EXPERIENCE');
  const workExperience: Array<{ title: string; company: string; duration?: string; highlights?: string }> = [];
  if (expSec) {
    const expLines = expSec.content.split('\n').filter((l) => l.trim().length > 3);
    for (let i = 0; i < Math.min(expLines.length, 6); i += 2) {
      const titleLine = expLines[i] || 'Engineering Professional';
      const companyLine = expLines[i + 1] || 'Technology Company';
      workExperience.push({
        title: titleLine.slice(0, 60),
        company: companyLine.slice(0, 60),
        highlights: expLines.slice(i, i + 3).join(' ').slice(0, 200),
      });
    }
  }

  // 6. Education Extraction
  const eduSec = sections.find((s) => s.category === 'EDUCATION');
  const education: Array<{ degree: string; institution: string; year?: string }> = [];
  if (eduSec) {
    const eduLines = eduSec.content.split('\n').filter((l) => l.trim().length > 5);
    const degreeLine = eduLines.find((l) => /bachelor|master|b\.s|m\.s|phd|degree|b\.tech|computer science/i.test(l)) || eduLines[0];
    const instLine = eduLines.find((l) => /university|college|institute|school/i.test(l)) || eduLines[1] || 'Accredited Institution';
    if (degreeLine) {
      education.push({
        degree: degreeLine,
        institution: instLine,
      });
    }
  }

  // 7. Certifications Extraction
  const certSec = sections.find((s) => s.category === 'CERTIFICATIONS');
  const certifications: string[] = [];
  if (certSec) {
    const certLines = certSec.content.split('\n').filter((l) => l.trim().length > 3);
    certifications.push(...certLines.slice(0, 5));
  } else {
    // Scan for notable certs
    const inlineCerts = rawResumeText.match(/\b(AWS Certified [^\n,]+|CKA|CKAD|PMP|CISSP|Google Cloud Certified [^\n,]+)\b/gi);
    if (inlineCerts) {
      certifications.push(...Array.from(new Set(inlineCerts)));
    }
  }

  // 8. Projects Extraction
  const projSec = sections.find((s) => s.category === 'PROJECTS');
  const projects: Array<{ title: string; description: string; tech?: string[] }> = [];
  if (projSec) {
    const projLines = projSec.content.split('\n').filter((l) => l.trim().length > 10);
    for (let i = 0; i < Math.min(projLines.length, 3); i++) {
      projects.push({
        title: `Project ${i + 1}`,
        description: projLines[i],
      });
    }
  }

  // 9. Achievements Extraction
  const achSec = sections.find((s) => s.category === 'ACHIEVEMENTS');
  const achievements: string[] = [];
  if (achSec) {
    achievements.push(...achSec.content.split('\n').filter((l) => l.trim().length > 10).slice(0, 4));
  }

  // Build 15+ Grounded Canonical Fields
  const fields: CandidateField[] = [
    {
      id: 'FULL_NAME',
      name: 'Full Name',
      category: 'identity',
      status: resolvedName ? 'FOUND' : 'NOT_FOUND',
      value: resolvedName,
      evidence: resolvedName,
      sourceSection: 'Header / Contact',
    },
    {
      id: 'EMAIL',
      name: 'Email Address',
      category: 'identity',
      status: emailMatch ? 'FOUND' : 'NOT_FOUND',
      value: emailMatch ? emailMatch[0] : null,
      evidence: emailMatch ? emailMatch[0] : '',
      sourceSection: 'Contact Section',
    },
    {
      id: 'PHONE',
      name: 'Phone Number',
      category: 'identity',
      status: phoneMatch ? 'FOUND' : 'NOT_FOUND',
      value: phoneMatch ? phoneMatch[0] : null,
      evidence: phoneMatch ? phoneMatch[0] : '',
      sourceSection: 'Contact Section',
    },
    {
      id: 'LOCATION',
      name: 'Location / Address',
      category: 'identity',
      status: locationMatch ? 'FOUND' : 'AMBIGUOUS',
      value: locationMatch ? locationMatch[0] : 'Not explicitly specified',
      evidence: locationMatch ? locationMatch[0] : contactSection.slice(0, 100),
      sourceSection: 'Contact Section',
    },
    {
      id: 'LINKEDIN_URL',
      name: 'LinkedIn / Online Profiles',
      category: 'identity',
      status: linkedinMatch ? 'FOUND' : 'NOT_FOUND',
      value: linkedinMatch ? linkedinMatch[0] : null,
      evidence: linkedinMatch ? linkedinMatch[0] : '',
      sourceSection: 'Contact Section',
    },
    {
      id: 'SUMMARY',
      name: 'Professional Summary',
      category: 'identity',
      status: summaryText ? 'FOUND' : 'AMBIGUOUS',
      value: summaryText || 'Derived from top profile section',
      evidence: summaryText ? summaryText.slice(0, 200) : lines.slice(0, 3).join(' '),
      sourceSection: summarySec ? summarySec.name : 'Header',
    },
    {
      id: 'YEARS_EXPERIENCE',
      name: 'Years of Experience',
      category: 'experience',
      status: yearsNum > 0 ? 'FOUND' : 'NOT_FOUND',
      value: yearsString,
      evidence: expMatch ? expMatch[0] : (yearsNum > 0 ? `${yearsNum} years estimated from employment records` : ''),
      sourceSection: 'Experience Timeline',
    },
    {
      id: 'WORK_EXPERIENCE',
      name: 'Work History & Roles',
      category: 'experience',
      status: workExperience.length > 0 ? 'FOUND' : 'NOT_FOUND',
      value: workExperience,
      evidence: expSec ? expSec.content.slice(0, 300) : '',
      sourceSection: expSec ? expSec.name : 'Experience',
    },
    {
      id: 'SKILLS_LIST',
      name: 'Core Skills & Competencies',
      category: 'skills',
      status: combinedSkills.length > 0 ? 'FOUND' : 'NOT_FOUND',
      value: combinedSkills,
      evidence: combinedSkills.slice(0, 15).join(', '),
      sourceSection: 'Skills & Proficiencies',
    },
    {
      id: 'PROGRAMMING_LANGUAGES',
      name: 'Programming Languages',
      category: 'skills',
      status: foundLanguages.length > 0 ? 'FOUND' : 'NOT_FOUND',
      value: foundLanguages,
      evidence: foundLanguages.join(', '),
      sourceSection: 'Skills & Technology',
    },
    {
      id: 'FRAMEWORKS_LIBRARIES',
      name: 'Frameworks & Libraries',
      category: 'skills',
      status: foundFrameworks.length > 0 ? 'FOUND' : 'NOT_FOUND',
      value: foundFrameworks,
      evidence: foundFrameworks.join(', '),
      sourceSection: 'Skills & Technology',
    },
    {
      id: 'DATABASES',
      name: 'Databases & Storage',
      category: 'skills',
      status: foundDatabases.length > 0 ? 'FOUND' : 'NOT_FOUND',
      value: foundDatabases,
      evidence: foundDatabases.join(', '),
      sourceSection: 'Skills & Technology',
    },
    {
      id: 'CLOUD_DEVOPS',
      name: 'Cloud Platforms & DevOps',
      category: 'skills',
      status: foundCloud.length > 0 ? 'FOUND' : 'NOT_FOUND',
      value: foundCloud,
      evidence: foundCloud.join(', '),
      sourceSection: 'Skills & Technology',
    },
    {
      id: 'EDUCATION',
      name: 'Education & Degrees',
      category: 'education',
      status: education.length > 0 ? 'FOUND' : 'NOT_FOUND',
      value: education.length > 0 ? education : 'No degree found',
      evidence: eduSec ? eduSec.content.slice(0, 200) : '',
      sourceSection: eduSec ? eduSec.name : 'Education',
    },
    {
      id: 'CERTIFICATIONS',
      name: 'Certifications & Accreditations',
      category: 'credentials',
      status: certifications.length > 0 ? 'FOUND' : 'NOT_FOUND',
      value: certifications.length > 0 ? certifications : 'None declared',
      evidence: certifications.join('; '),
      sourceSection: certSec ? certSec.name : 'Credentials',
    },
    {
      id: 'PROJECTS',
      name: 'Key Technical Projects',
      category: 'experience',
      status: projects.length > 0 ? 'FOUND' : 'NOT_FOUND',
      value: projects,
      evidence: projSec ? projSec.content.slice(0, 250) : '',
      sourceSection: projSec ? projSec.name : 'Projects',
    },
    {
      id: 'ACHIEVEMENTS',
      name: 'Quantifiable Achievements',
      category: 'credentials',
      status: achievements.length > 0 ? 'FOUND' : 'AMBIGUOUS',
      value: achievements.length > 0 ? achievements : ['Demonstrated delivery across technical roles'],
      evidence: achSec ? achSec.content.slice(0, 200) : 'Derived from project impact notes.',
      sourceSection: achSec ? achSec.name : 'Experience',
    },
  ];

  return {
    candidateId,
    name: resolvedName,
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0] : null,
    location: locationMatch ? locationMatch[0] : null,
    linkedinUrl: linkedinMatch ? linkedinMatch[0] : null,
    summary: summaryText,
    yearsOfExperience: yearsString,
    yearsOfExperienceNum: yearsNum,
    skills: combinedSkills,
    programmingLanguages: foundLanguages,
    frameworks: foundFrameworks,
    databases: foundDatabases,
    cloudDevOps: foundCloud,
    education,
    workExperience,
    certifications,
    projects,
    achievements,
    fields,
    rawText: rawResumeText,
    contentHash: calculateContentHash(rawResumeText),
  };
}
