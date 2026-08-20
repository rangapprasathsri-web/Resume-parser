export interface ResumeSection {
  name: string;
  category: 'CONTACT' | 'SUMMARY' | 'EXPERIENCE' | 'SKILLS' | 'EDUCATION' | 'CERTIFICATIONS' | 'PROJECTS' | 'ACHIEVEMENTS' | 'LANGUAGES' | 'OTHER';
  content: string;
  startLine: number;
  endLine: number;
}

const SECTION_HEADERS: Record<string, ResumeSection['category']> = {
  // Contact / Header
  contact: 'CONTACT',
  'contact information': 'CONTACT',
  'personal details': 'CONTACT',
  'personal info': 'CONTACT',

  // Summary / Profile
  summary: 'SUMMARY',
  'professional summary': 'SUMMARY',
  'executive summary': 'SUMMARY',
  'career summary': 'SUMMARY',
  objective: 'SUMMARY',
  'career objective': 'SUMMARY',
  profile: 'SUMMARY',
  'professional profile': 'SUMMARY',
  about: 'SUMMARY',
  'about me': 'SUMMARY',

  // Experience
  experience: 'EXPERIENCE',
  'work experience': 'EXPERIENCE',
  'employment history': 'EXPERIENCE',
  'work history': 'EXPERIENCE',
  'professional experience': 'EXPERIENCE',
  'career history': 'EXPERIENCE',
  'relevant experience': 'EXPERIENCE',

  // Skills
  skills: 'SKILLS',
  'technical skills': 'SKILLS',
  'core competencies': 'SKILLS',
  'skills & expertise': 'SKILLS',
  'skills and tools': 'SKILLS',
  technologies: 'SKILLS',
  'technical proficiencies': 'SKILLS',
  'programming languages': 'SKILLS',
  'key skills': 'SKILLS',

  // Education
  education: 'EDUCATION',
  'academic background': 'EDUCATION',
  'academic history': 'EDUCATION',
  'education & training': 'EDUCATION',
  qualifications: 'EDUCATION',

  // Certifications
  certifications: 'CERTIFICATIONS',
  certificates: 'CERTIFICATIONS',
  'licenses & certifications': 'CERTIFICATIONS',
  'credentials & licenses': 'CERTIFICATIONS',
  accreditations: 'CERTIFICATIONS',

  // Projects
  projects: 'PROJECTS',
  'key projects': 'PROJECTS',
  'personal projects': 'PROJECTS',
  'technical projects': 'PROJECTS',
  portfolio: 'PROJECTS',
  repositories: 'PROJECTS',

  // Achievements
  achievements: 'ACHIEVEMENTS',
  awards: 'ACHIEVEMENTS',
  'honors & awards': 'ACHIEVEMENTS',
  publications: 'ACHIEVEMENTS',
  patents: 'ACHIEVEMENTS',

  // Languages
  languages: 'LANGUAGES',
  'language proficiencies': 'LANGUAGES',
};

/**
 * Deterministically segments raw resume text into named logical sections
 */
export function segmentResume(rawText: string): ResumeSection[] {
  const lines = rawText.split('\n');
  const sections: ResumeSection[] = [];

  let currentCategory: ResumeSection['category'] = 'CONTACT';
  let currentName = 'Contact & Header';
  let currentLines: string[] = [];
  let currentStartLine = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const cleanLine = line.toLowerCase().replace(/[:\-_#=*~]/g, '').trim();

    // Check if line looks like a major section heading (short, matching header map)
    const isHeading =
      line.length > 0 &&
      line.length < 45 &&
      SECTION_HEADERS[cleanLine] !== undefined;

    if (isHeading && SECTION_HEADERS[cleanLine]) {
      // Flush previous section
      if (currentLines.length > 0) {
        sections.push({
          name: currentName,
          category: currentCategory,
          content: currentLines.join('\n').trim(),
          startLine: currentStartLine,
          endLine: i,
        });
      }

      currentCategory = SECTION_HEADERS[cleanLine];
      currentName = line.replace(/[:\-_#=*~]/g, '').trim() || cleanLine.toUpperCase();
      currentLines = [];
      currentStartLine = i + 1;
    } else {
      currentLines.push(lines[i]);
    }
  }

  // Push final remaining section
  if (currentLines.length > 0) {
    sections.push({
      name: currentName,
      category: currentCategory,
      content: currentLines.join('\n').trim(),
      startLine: currentStartLine,
      endLine: lines.length,
    });
  }

  return sections;
}
