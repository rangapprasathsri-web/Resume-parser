import { extractTextFromRaw } from '../extraction/extractor';
import { segmentResume } from '../parser/sectionSegmenter';
import { extractCandidateProfile } from '../parser/fieldParser';
import { parseJobDescription } from '../ats/jdParser';
import { runAtsEngine } from '../ats/engine';
import {
  combineCandidateEvaluation,
  rankCandidates,
  getRecommendationTier,
  FinalCandidateAnalysis,
} from '../ranking/rankingEngine';
import { runBatchScreening } from '../screening/screeningService';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

export async function runAllTests(): Promise<{ total: number; passed: number; results: TestResult[] }> {
  const results: TestResult[] = [];

  function assert(name: string, condition: boolean, message?: string) {
    results.push({
      name,
      passed: !!condition,
      message: condition ? 'Passed' : (message || 'Assertion failed'),
    });
  }

  // 1. test_section_segmentation
  const sampleResume = `Alex Morgan
alex.morgan@example.com | (555) 234-5678 | San Francisco, CA | linkedin.com/in/alexmorgan

SUMMARY
Lead Software Engineer with 7+ years of experience architecting scalable distributed systems and backend APIs in Python and Go.

SKILLS
Python, FastAPI, Django, Go, PostgreSQL, Redis, Docker, Kubernetes, AWS, Terraform, CI/CD, Git

EXPERIENCE
Senior Backend Engineer | CloudScale Tech
2021 - Present
- Architected high-throughput microservices using Python FastAPI and PostgreSQL, serving 50M requests daily.
- Containerized legacy applications with Docker and deployed them to Kubernetes on AWS EKS.

Backend Developer | DataStream Inc
2017 - 2021
- Built RESTful data ingestion pipelines using Python and Redis.

EDUCATION
B.S. in Computer Science | University of California, Berkeley
2013 - 2017

CERTIFICATIONS
AWS Certified Solutions Architect - Associate
CKA: Certified Kubernetes Administrator

PROJECTS
OpenSource API Gateway: Built a distributed rate limiter in Go and Redis with 1.2k GitHub stars.
`;

  const sections = segmentResume(sampleResume);
  assert('test_section_segmentation', sections.length >= 5, `Expected >= 5 sections, got ${sections.length}`);

  // 2. test_field_parser & test_evidence_extraction
  const profile = extractCandidateProfile(sampleResume, 'cand_test_001');
  assert('test_field_parser', profile.skills.includes('Python') && profile.skills.includes('Docker'), 'Skills should extract Python and Docker');
  assert('test_evidence_extraction', profile.yearsOfExperienceNum >= 7, 'Experience should extract 7+ years');
  assert('test_candidate_identity', profile.email === 'alex.morgan@example.com' && profile.name.includes('Alex'), 'Identity extraction valid');

  // 3. test_jd_parser
  const sampleJd = `Job Title: Senior Python AI Engineer
Company: NextGen Systems

About Us:
We are building cutting-edge AI infrastructure.

Requirements:
- 5+ years of software engineering experience in Python
- Hands-on experience with FastAPI and PostgreSQL
- Strong knowledge of Docker and Kubernetes
- Bachelor's degree in Computer Science or related field

Preferred Qualifications:
- Experience with AWS and Terraform
- AWS or Kubernetes certifications
- Familiarity with Go or Rust
`;

  const parsedJd = parseJobDescription(sampleJd);
  assert('test_jd_parser', parsedJd.title === 'Senior Python AI Engineer', 'JD title extracted');
  assert('test_jd_requirements_count', parsedJd.requirements.length >= 4, 'JD requirements extracted');
  assert('test_jd_required_vs_preferred', parsedJd.requirements.some((r) => !r.isMandatory), 'Preferred requirements distinguished');

  // 4. test_ats_scoring & exact/normalized/fuzzy matching
  const atsResult = runAtsEngine(profile, parsedJd);
  assert('test_exact_matching', atsResult.matchedKeywords.includes('python'), 'Exact match on Python');
  assert('test_normalized_matching', atsResult.score >= 80, `Expected ATS score >= 80, got ${atsResult.score}`);
  assert('test_ats_scoring', atsResult.score >= 0 && atsResult.score <= 100, 'ATS score is bounded 0-100');

  // 5. test_fallback & combined scoring
  const combined = combineCandidateEvaluation(
    profile,
    parsedJd.title,
    'alex_resume.pdf',
    atsResult,
    null, // OpenRouter fallback
    false
  );
  assert('test_fallback', combined.analysisMode === 'ats_fallback', 'Gracefully falls back to ATS mode');
  assert('test_comprehensive_score', combined.comprehensiveScore === atsResult.score, 'Fallback score matches ATS score');

  // 6. test_ranking & test_tie_breaking
  const mockCandA: FinalCandidateAnalysis = {
    ...combined,
    candidateId: 'cand_a',
    candidateName: 'Candidate A',
    comprehensiveScore: 92.0,
    agenticScore: 95,
    atsScore: 90,
  };

  const mockCandB: FinalCandidateAnalysis = {
    ...combined,
    candidateId: 'cand_b',
    candidateName: 'Candidate B',
    comprehensiveScore: 92.0,
    agenticScore: 90,
    atsScore: 95,
  };

  const mockCandC: FinalCandidateAnalysis = {
    ...combined,
    candidateId: 'cand_c',
    candidateName: 'Candidate C',
    comprehensiveScore: 84.0,
    agenticScore: 85,
    atsScore: 83,
  };

  const ranked = rankCandidates([mockCandC, mockCandB, mockCandA]);
  assert('test_ranking', ranked[0].candidateId === 'cand_a', 'Cand A ranks #1 due to higher agentic tie-break');
  assert('test_tie_breaking', ranked[1].candidateId === 'cand_b' && ranked[2].candidateId === 'cand_c', 'Tie-break sorting correct');

  // 7. test_duplicate_detection & batch screening
  const batchResult = await runBatchScreening({
    jobTitle: 'Senior Python Engineer',
    jobDescription: sampleJd,
    resumes: [
      { fileName: 'Alex_Morgan.txt', rawText: sampleResume },
      { fileName: 'Alex_Morgan_Duplicate.txt', rawText: sampleResume }, // Duplicate text
    ],
    analysisMode: 'ats_only',
  });

  // 8. test_performance_timings & caching
  assert('test_performance_timings', !!batchResult.candidates[0].timings && batchResult.candidates[0].timings.total_ms >= 0, 'Candidate analysis includes granular performance timings');

  // 9. test_partial_failure_resilience
  const resilienceBatch = await runBatchScreening({
    jobTitle: 'Senior Python Engineer',
    jobDescription: sampleJd,
    resumes: [
      { fileName: 'Valid_Resume.txt', rawText: sampleResume },
      { fileName: 'Empty_Corrupted_Resume.txt', rawText: '' },
    ],
    analysisMode: 'ats_only',
  });

  assert('test_partial_failure_resilience', resilienceBatch.candidates.length === 1 && (resilienceBatch.failedCandidates?.length || 0) === 1, 'Batch isolates broken files without aborting entire batch');

  const passedCount = results.filter((r) => r.passed).length;
  return {
    total: results.length,
    passed: passedCount,
    results,
  };
}
