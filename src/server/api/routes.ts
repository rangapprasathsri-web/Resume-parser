import { Router, Request, Response } from 'express';
import {
  runBatchScreening,
  getJobSession,
  getAllJobSessions,
  deleteJobSession,
  generateJobId,
  screenSingleResume,
  saveJobSession,
  JobScreeningSession,
} from '../screening/screeningService';
import { parseJobDescription } from '../ats/jdParser';
import { extractDocumentText } from '../extraction/extractor';
import { rankCandidates } from '../ranking/rankingEngine';
import { runAllTests } from '../tests/suite';
import { validateOpenRouterCredentials } from '../agent/openrouter';

export const apiRouter = Router();

/**
 * Validate OpenRouter credentials
 */
apiRouter.get('/openrouter/validate', async (_req: Request, res: Response) => {
  try {
    const result = await validateOpenRouterCredentials();
    res.json({ success: result.valid, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});


/**
 * Run automated tests
 */
apiRouter.get('/test-suite', async (_req: Request, res: Response) => {
  try {
    const summary = await runAllTests();
    res.json({ success: true, data: summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Health check & Engine configuration status
 */
apiRouter.get('/health', (_req: Request, res: Response) => {
  const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY;
  res.json({
    status: 'ok',
    engine: 'EvidenceFirst Hybrid Screening Agent',
    openrouterAvailable: hasOpenRouterKey,
    defaultModel: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
    atsWeight: process.env.ATS_WEIGHT || '0.40',
    agentWeight: process.env.AGENT_WEIGHT || '0.60',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Universal text extraction endpoint for client file uploads
 */
apiRouter.post('/extract-text', async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileName, contentBase64, mimeType } = req.body;
    if (!contentBase64 || !fileName) {
      res.status(400).json({ error: 'Missing fileName or contentBase64 payload.' });
      return;
    }

    const buffer = Buffer.from(contentBase64, 'base64');
    const result = await extractDocumentText(buffer, fileName, mimeType);

    if (!result.hasTextLayer && result.error) {
      res.status(422).json({
        success: false,
        error: result.error,
        fileName: result.fileName,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        text: result.text,
        wordCount: result.wordCount,
        pageCount: result.pageCount,
        fileType: result.fileType,
        fileName: result.fileName,
      },
    });
  } catch (err: any) {
    console.error('Text extraction error:', err);
    res.status(500).json({ error: err.message || 'Failed to extract text from document.' });
  }
});

/**
 * GET /api/jobs — List all screening sessions
 */
apiRouter.get('/jobs', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || undefined;
  const sessions = getAllJobSessions(userId);

  // Return lightweight summary for list
  const summaries = sessions.map((s) => ({
    jobId: s.jobId,
    title: s.title,
    candidateCount: s.candidateCount,
    averageScore: s.averageScore,
    topScore: s.topScore,
    status: s.status,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));

  res.json({ success: true, data: summaries });
});

/**
 * POST /api/jobs — Create new JD workspace
 */
apiRouter.post('/jobs', (req: Request, res: Response): void => {
  const { title, description, userId } = req.body;
  if (!description || description.trim().length < 10) {
    res.status(400).json({ error: 'Job description text is required.' });
    return;
  }

  const parsedJd = parseJobDescription(description);
  if (title && title.trim()) {
    parsedJd.title = title.trim();
  }

  const jobId = generateJobId(parsedJd.title);
  const session: JobScreeningSession = {
    jobId,
    title: parsedJd.title,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    candidateCount: 0,
    averageScore: 0,
    topScore: 0,
    status: 'draft',
    parsedJd,
    candidates: [],
    userId,
  };

  saveJobSession(session);
  res.json({ success: true, data: session });
});

/**
 * GET /api/jobs/:jobId — Get specific JD workspace + candidate rankings
 */
apiRouter.get('/jobs/:jobId', (req: Request, res: Response): void => {
  const { jobId } = req.params;
  const session = getJobSession(jobId);

  if (!session) {
    res.status(404).json({ error: `Job screening workspace ${jobId} not found.` });
    return;
  }

  res.json({ success: true, data: session });
});

/**
 * DELETE /api/jobs/:jobId — Delete workspace
 */
apiRouter.delete('/jobs/:jobId', (req: Request, res: Response): void => {
  const { jobId } = req.params;
  const deleted = deleteJobSession(jobId);
  res.json({ success: deleted });
});

/**
 * POST /api/screen/batch — Batch screen multiple resumes against JD
 */
apiRouter.post('/screen/batch', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId, jobTitle, jobDescription, resumes, analysisMode, userId } = req.body;

    if (!jobDescription || !resumes || !Array.isArray(resumes) || resumes.length === 0) {
      res.status(400).json({
        error: 'Invalid request: jobDescription and a non-empty resumes array are required.',
      });
      return;
    }

    const session = await runBatchScreening({
      jobId,
      jobTitle,
      jobDescription,
      resumes,
      analysisMode,
      userId,
    });

    res.json({
      success: true,
      data: session,
    });
  } catch (err: any) {
    console.error('Batch screening error:', err);
    res.status(500).json({
      error: err.message || 'Batch screening encountered an unexpected error.',
    });
  }
});

/**
 * POST /api/screen/single — Mode A: Single Resume Screening
 */
apiRouter.post('/screen/single', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobTitle, jobDescription, resume, analysisMode } = req.body;

    if (!jobDescription || !resume) {
      res.status(400).json({ error: 'Missing jobDescription or resume payload.' });
      return;
    }

    const parsedJd = parseJobDescription(jobDescription);
    if (jobTitle && jobTitle.trim()) {
      parsedJd.title = jobTitle.trim();
    }

    let buffer: Buffer | undefined;
    if (resume.contentBase64) {
      buffer = Buffer.from(resume.contentBase64, 'base64');
    }

    const analysis = await screenSingleResume(
      {
        fileName: resume.fileName || 'candidate_resume.pdf',
        buffer,
        rawText: resume.rawText,
        mimeType: resume.mimeType,
      },
      parsedJd,
      1,
      analysisMode || 'ai_ats'
    );

    res.json({
      success: true,
      data: analysis,
    });
  } catch (err: any) {
    console.error('Single screening error:', err);
    res.status(500).json({ error: err.message || 'Screening failed.' });
  }
});

/**
 * GET /api/jobs/:jobId/candidates/:candidateId — Get detailed candidate report
 */
apiRouter.get('/jobs/:jobId/candidates/:candidateId', (req: Request, res: Response): void => {
  const { jobId, candidateId } = req.params;
  const session = getJobSession(jobId);

  if (!session) {
    res.status(404).json({ error: 'Job session not found.' });
    return;
  }

  const candidate = session.candidates.find((c) => c.candidateId === candidateId);
  if (!candidate) {
    res.status(404).json({ error: 'Candidate not found in this workspace.' });
    return;
  }

  res.json({
    success: true,
    data: {
      candidate,
      job: {
        jobId: session.jobId,
        title: session.title,
        parsedJd: session.parsedJd,
      },
    },
  });
});

/**
 * GET /api/jobs/:jobId/report — Export structured report for batch
 */
apiRouter.get('/jobs/:jobId/report', (req: Request, res: Response): void => {
  const { jobId } = req.params;
  const session = getJobSession(jobId);

  if (!session) {
    res.status(404).json({ error: 'Job session not found.' });
    return;
  }

  const report = {
    jobId: session.jobId,
    title: session.title,
    candidateCount: session.candidateCount,
    averageScore: session.averageScore,
    topScore: session.topScore,
    generatedAt: new Date().toISOString(),
    topCandidate: session.candidates[0] || null,
    ranking: session.candidates.map((c, idx) => ({
      rank: idx + 1,
      name: c.candidateName,
      atsScore: c.atsScore,
      agenticScore: c.agenticScore,
      comprehensiveScore: c.comprehensiveScore,
      recommendation: c.recommendation,
      analysisMode: c.analysisMode,
      keyStrengths: c.strengths.slice(0, 2),
      keyWeaknesses: c.weaknesses.slice(0, 2),
    })),
  };

  res.json({ success: true, data: report });
});
