import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/api/routes';
import { parseJobDescription } from './src/server/ats/jdParser';
import { extractCandidateProfile } from './src/server/parser/fieldParser';
import { runAtsEngine } from './src/server/ats/engine';
import { runOpenRouterAgenticAnalysis } from './src/server/agent/openrouter';
import { combineCandidateEvaluation } from './src/server/ranking/rankingEngine';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Mount all API routes
app.use('/api', apiRouter);

// Legacy backward-compatible /api/analyze endpoint mapped to OpenRouter + ATS engine
app.post('/api/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const { resumeText, jdText, candidateName, targetRole } = req.body;

    if (!resumeText || !jdText) {
      res.status(400).json({ error: 'Missing resumeText or jdText in request payload' });
      return;
    }

    const parsedJd = parseJobDescription(jdText);
    if (targetRole) {
      parsedJd.title = targetRole;
    }

    const candidateProfile = extractCandidateProfile(
      resumeText,
      `legacy_${Date.now()}`,
      candidateName
    );

    const atsResult = runAtsEngine(candidateProfile, parsedJd);
    let agenticResult = null;

    try {
      agenticResult = await runOpenRouterAgenticAnalysis(candidateProfile, parsedJd);
    } catch (e) {
      console.warn('OpenRouter agentic run encountered fallback:', e);
    }

    const combined = combineCandidateEvaluation(
      candidateProfile,
      parsedJd.title,
      `${candidateProfile.name}_Resume.pdf`,
      atsResult,
      agenticResult
    );

    // Map into format expected by legacy single-view callers
    const fields = candidateProfile.fields.map((f) => ({
      field_id: f.id,
      category: f.category,
      status: f.status,
      value: f.value,
      evidence: f.evidence,
      source_section: f.sourceSection,
      note: f.note || null,
    }));

    const fitReport = [
      ...atsResult.matchedRequirements.map((m) => ({
        requirement: m.requirement,
        match_status: 'MATCHED',
        explanation: m.evidenceQuote,
        evidence_ref: m.evidenceRef,
        confidence: 'high',
      })),
      ...atsResult.partialMatches.map((m) => ({
        requirement: m.requirement,
        match_status: 'PARTIAL',
        explanation: m.evidenceQuote,
        evidence_ref: m.evidenceRef,
        confidence: 'medium',
      })),
      ...atsResult.missingRequirements.map((m) => ({
        requirement: m.requirement,
        match_status: 'MISSING',
        explanation: 'No verifiable evidence found in resume.',
        evidence_ref: null,
        confidence: 'high',
      })),
    ];

    res.json({
      success: true,
      data: {
        fields,
        fit_report: fitReport,
        comprehensive_score: combined.comprehensiveScore,
        ats_score: combined.atsScore,
        agentic_score: combined.agenticScore,
        recommendation: combined.recommendation,
        analysis_mode: combined.analysisMode,
      },
      scorer: combined.analysisMode === 'openrouter' ? 'openrouter' : 'ats_fallback',
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

// Serve static assets in production
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`EvidenceFirst Server running on port ${PORT}`);
});
