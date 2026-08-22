import React, { useState, useRef, useEffect } from 'react';
import {
  Briefcase,
  UploadCloud,
  FileText,
  Trash2,
  Sparkles,
  Zap,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  FileUp,
  FolderPlus,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { extractTextFromFile } from '../../services/apiService';
import { JobScreeningSession } from '../../types';
import { SAMPLE_JD, SAMPLE_RESUME_1, SAMPLE_RESUME_2, SAMPLE_RESUME_3 } from '../../data/sampleData';

interface CandidateFileItem {
  id: string;
  name: string;
  size: number;
  text: string;
  file?: File;
}

interface NewBatchScreeningScreenProps {
  onStartScreening: (payload: {
    jobTitle: string;
    jobDescription: string;
    resumes: Array<{ fileName: string; rawText: string }>;
    analysisMode: 'ai_ats' | 'ats_only';
  }) => void;
  onAppendToExistingSession?: (
    session: JobScreeningSession,
    resumes: Array<{ fileName: string; rawText: string }>,
    analysisMode: 'ai_ats' | 'ats_only'
  ) => void;
  existingSessions?: JobScreeningSession[];
  initialSessionId?: string;
  onCancel: () => void;
}

export const NewBatchScreeningScreen: React.FC<NewBatchScreeningScreenProps> = ({
  onStartScreening,
  onAppendToExistingSession,
  existingSessions = [],
  initialSessionId,
  onCancel,
}) => {
  // Mode: 'new_session' | 'append_existing'
  const [creationMode, setCreationMode] = useState<'new_session' | 'append_existing'>(() => {
    return initialSessionId && existingSessions.length > 0 ? 'append_existing' : 'new_session';
  });

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    initialSessionId || (existingSessions[0]?.jobId || '')
  );

  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [candidateFiles, setCandidateFiles] = useState<CandidateFileItem[]>([]);
  const [analysisMode, setAnalysisMode] = useState<'ai_ats' | 'ats_only'>('ai_ats');
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jdFileInputRef = useRef<HTMLInputElement>(null);

  const selectedExistingSession = existingSessions.find((s) => s.jobId === selectedSessionId);

  // Sync if initialSessionId changes
  useEffect(() => {
    if (initialSessionId) {
      setSelectedSessionId(initialSessionId);
      setCreationMode('append_existing');
    }
  }, [initialSessionId]);

  // Handle JD File Upload (Only for new session mode)
  const handleJdFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsExtracting(true);
    setErrorMessage(null);

    try {
      const extracted = await extractTextFromFile(file);
      setJobDescription(extracted.text);
      if (!jobTitle) {
        setJobTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    } catch (err: any) {
      setErrorMessage(`Failed to extract JD: ${err.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle Multiple Resume Files Upload (Concurrent Parallel Extraction)
  const handleResumeFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsExtracting(true);
    setErrorMessage(null);

    const fileList: File[] = Array.from(files);
    try {
      const results = await Promise.allSettled(
        fileList.map(async (file: File, i: number) => {
          const extracted = await extractTextFromFile(file);
          return {
            id: `item_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            size: file.size,
            text: extracted.text,
            file,
          };
        })
      );

      const newItems: CandidateFileItem[] = [];
      const errors: string[] = [];

      results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
          const item = res.value;
          const isDuplicate = candidateFiles.some(
            (c) => c.name === item.name || c.text.trim() === item.text.trim()
          );
          if (!isDuplicate) {
            newItems.push(item);
          }
        } else {
          errors.push(`${fileList[i].name}: ${res.reason?.message || 'Extraction failed'}`);
        }
      });

      if (errors.length > 0) {
        setErrorMessage(`Warning on some files: ${errors.join(', ')}`);
      }

      setCandidateFiles((prev) => [...prev, ...newItems]);
    } catch (err: any) {
      setErrorMessage(`Upload error: ${err.message}`);
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Load sample demo batch for quick evaluation
  const loadDemoSamplePack = () => {
    if (creationMode === 'new_session') {
      setJobTitle('Senior Python AI Engineer');
      setJobDescription(SAMPLE_JD);
    }
    setCandidateFiles([
      {
        id: 'sample_1',
        name: 'Alex_Morgan_Senior_Engineer.pdf',
        size: 24500,
        text: SAMPLE_RESUME_1,
      },
      {
        id: 'sample_2',
        name: 'Elena_Rostova_FullStack.pdf',
        size: 19800,
        text: SAMPLE_RESUME_2,
      },
      {
        id: 'sample_3',
        name: 'David_Chen_DevOps_Specialist.docx',
        size: 22100,
        text: SAMPLE_RESUME_3,
      },
    ]);
  };

  const removeCandidateFile = (id: string) => {
    setCandidateFiles((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (candidateFiles.length === 0) {
      setErrorMessage('Please upload or add at least one candidate resume.');
      return;
    }

    // APPEND TO EXISTING SESSION FLOW: ZERO JD PROMPTS NEEDED
    if (creationMode === 'append_existing' && selectedExistingSession) {
      if (onAppendToExistingSession) {
        onAppendToExistingSession(
          selectedExistingSession,
          candidateFiles.map((c) => ({
            fileName: c.name,
            rawText: c.text,
          })),
          analysisMode
        );
      } else {
        // Fallback to start screening against existing session's JD
        onStartScreening({
          jobTitle: selectedExistingSession.title,
          jobDescription: selectedExistingSession.description || selectedExistingSession.title,
          resumes: candidateFiles.map((c) => ({
            fileName: c.name,
            rawText: c.text,
          })),
          analysisMode,
        });
      }
      return;
    }

    // NEW SESSION CREATION FLOW
    if (!jobDescription.trim()) {
      setErrorMessage('Please provide a Job Description.');
      return;
    }

    onStartScreening({
      jobTitle: jobTitle.trim() || 'Target Job Screening',
      jobDescription: jobDescription.trim(),
      resumes: candidateFiles.map((c) => ({
        fileName: c.name,
        rawText: c.text,
      })),
      analysisMode,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-primary tracking-tight">
            {creationMode === 'append_existing' ? 'Add Resumes' : 'New Screening Session'}
          </h1>
          <p className="text-xs sm:text-sm text-secondary font-sans mt-0.5">
            {creationMode === 'append_existing'
              ? 'Evaluate new resumes against the existing job description.'
              : 'Upload job details and candidate resumes to screen.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadDemoSamplePack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-default bg-surface text-primary hover:bg-surface-sunken text-xs font-medium transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Load Samples</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-[6px] border border-default text-secondary hover:text-primary text-xs font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Target Action Mode Switcher (If user has existing sessions) */}
      {existingSessions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 rounded-[8px] bg-surface-sunken border border-default">
          <button
            type="button"
            onClick={() => setCreationMode('new_session')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
              creationMode === 'new_session'
                ? 'bg-surface text-primary font-bold shadow-xs border border-default'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Job Workspace</span>
          </button>

          <button
            type="button"
            onClick={() => setCreationMode('append_existing')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
              creationMode === 'append_existing'
                ? 'bg-accent text-white font-bold shadow-xs'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Add to Existing Session ({existingSessions.length})</span>
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-[8px] border border-status-missing/30 bg-status-missing/5 text-status-missing flex items-start gap-2.5 text-xs font-sans">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* EXISTING SESSION SELECTION & CRITERIA REUSE (ZERO JD PROMPTS) */}
        {creationMode === 'append_existing' ? (
          <div className="rounded-[8px] border border-accent/30 bg-accent/5 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-accent/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-accent text-white text-xs font-mono font-bold flex items-center justify-center">
                  ✓
                </span>
                <h2 className="text-sm font-semibold text-primary font-mono uppercase tracking-wider">
                  Target Job Position
                </h2>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-status-matched font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-matched" />
                <span>JD Details Automatically Inherited</span>
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-secondary mb-1">
                  Select Existing Screening Session
                </label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-sans bg-surface border border-default rounded-[6px] text-primary focus:border-strong focus:outline-none cursor-pointer"
                >
                  {existingSessions.map((s) => (
                    <option key={s.jobId} value={s.jobId}>
                      {s.title} ({s.candidateCount} existing candidates • Top score {s.topScore}%)
                    </option>
                  ))}
                </select>
              </div>

              {selectedExistingSession && (
                <div className="p-3.5 rounded-[6px] bg-surface border border-default text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-primary">{selectedExistingSession.title}</span>
                    <span className="font-mono text-muted text-[11px]">
                      Workspace: {selectedExistingSession.jobId}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-secondary">
                    <span>Candidates: <strong className="text-primary">{selectedExistingSession.candidateCount}</strong></span>
                    <span>•</span>
                    <span>Top Fit: <strong className="text-primary">{selectedExistingSession.topScore}%</strong></span>
                    <span>•</span>
                    <span>Requirements: <strong className="text-primary">{selectedExistingSession.parsedJd?.requirements?.length || 'Active'} criteria</strong></span>
                  </div>
                  <p className="text-[11px] text-muted italic font-sans pt-1 border-t border-default/50">
                    No need to re-enter JD text or upload job files. New resumes will be evaluated against this job's criteria and merged into the workspace rankings.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* STEP 1: Job Description (ONLY FOR NEW SESSIONS) */
          <div className="rounded-[8px] border border-default bg-surface p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-default pb-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-mono font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="text-sm font-semibold text-primary font-mono uppercase tracking-wider">
                  Job Description (JD)
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={jdFileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={handleJdFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => jdFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-accent hover:underline cursor-pointer"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Upload JD File</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-secondary mb-1">
                  Target Role / Job Title (Optional)
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Python AI Engineer"
                  className="w-full px-3 py-2 text-xs font-sans bg-surface-sunken border border-default rounded-[6px] text-primary placeholder:text-muted focus:border-strong focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-secondary mb-1">
                  Job Description Text (Requirements, Responsibilities, Skills)
                </label>
                <textarea
                  rows={6}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="w-full px-3 py-2 text-xs font-mono bg-surface-sunken border border-default rounded-[6px] text-primary placeholder:text-muted focus:border-strong focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP: Candidate Resumes Upload */}
        <div className="rounded-[8px] border border-default bg-surface p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-default pb-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-mono font-bold flex items-center justify-center">
                {creationMode === 'append_existing' ? '1' : '2'}
              </span>
              <h2 className="text-sm font-semibold text-primary font-mono uppercase tracking-wider">
                Candidate Resumes ({candidateFiles.length} Selected)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-muted">Supports PDF, DOCX, TXT</span>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-default hover:border-strong rounded-[8px] p-6 text-center bg-surface-sunken/40 hover:bg-surface-sunken cursor-pointer transition-colors space-y-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleResumeFilesUpload}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-[8px] bg-surface border border-default flex items-center justify-center mx-auto text-secondary">
              <UploadCloud className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs font-medium text-primary">
                Click or drag & drop candidate resumes here
              </p>
              <p className="text-[11px] text-secondary font-sans mt-0.5">
                Upload 1 resume for single screening, or 2+ for batch ranking
              </p>
            </div>
          </div>

          {/* Selected Candidates List */}
          {candidateFiles.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-mono text-secondary uppercase tracking-wider">
                Attached Candidates Queue:
              </div>
              <div className="divide-y divide-default border border-default rounded-[6px] bg-surface overflow-hidden max-h-60 overflow-y-auto">
                {candidateFiles.map((c, idx) => (
                  <div
                    key={c.id}
                    className="p-2.5 flex items-center justify-between gap-3 text-xs hover:bg-surface-sunken/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-[11px] text-muted w-5">
                        #{idx + 1}
                      </span>
                      <FileText className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} />
                      <div className="truncate">
                        <div className="font-medium text-primary truncate">{c.name}</div>
                        <div className="text-[10px] text-muted font-mono">
                          {(c.size / 1024).toFixed(1)} KB • {c.text.split(/\s+/).length} words
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeCandidateFile(c.id)}
                      className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition-colors cursor-pointer"
                      title="Remove resume"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* STEP: Screening Engine Mode Selection */}
        <div className="rounded-[8px] border border-default bg-surface p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-default pb-3">
            <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-mono font-bold flex items-center justify-center">
              {creationMode === 'append_existing' ? '2' : '3'}
            </span>
            <h2 className="text-sm font-semibold text-primary font-mono uppercase tracking-wider">
              Screening Engine Mode
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`p-3.5 rounded-[8px] border cursor-pointer transition-all flex items-start gap-3 ${
                analysisMode === 'ai_ats'
                  ? 'border-accent bg-accent/5 ring-1 ring-accent'
                  : 'border-default bg-surface hover:bg-surface-sunken'
              }`}
            >
              <input
                type="radio"
                name="analysisMode"
                value="ai_ats"
                checked={analysisMode === 'ai_ats'}
                onChange={() => setAnalysisMode('ai_ats')}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>AI + ATS Combined (Recommended)</span>
                </div>
                <p className="text-[11px] text-secondary font-sans">
                  OpenRouter agentic reasoning + independent ATS keyword matching with 0.60/0.40 weighted comprehensive scoring.
                </p>
              </div>
            </label>

            <label
              className={`p-3.5 rounded-[8px] border cursor-pointer transition-all flex items-start gap-3 ${
                analysisMode === 'ats_only'
                  ? 'border-accent bg-accent/5 ring-1 ring-accent'
                  : 'border-default bg-surface hover:bg-surface-sunken'
              }`}
            >
              <input
                type="radio"
                name="analysisMode"
                value="ats_only"
                checked={analysisMode === 'ats_only'}
                onChange={() => setAnalysisMode('ats_only')}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Zap className="w-3.5 h-3.5 text-secondary" />
                  <span>ATS Only (Deterministic Engine)</span>
                </div>
                <p className="text-[11px] text-secondary font-sans">
                  Zero LLM dependency. Pure deterministic keyword, normalized, and fuzzy skill matching with instant execution.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Start Screening CTA */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-default">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-[6px] border border-default text-secondary hover:text-primary text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              isExtracting ||
              candidateFiles.length === 0 ||
              (creationMode === 'new_session' && !jobDescription.trim())
            }
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
          >
            <span>
              {creationMode === 'append_existing'
                ? `Screen & Add ${candidateFiles.length > 0 ? candidateFiles.length : ''} Resumes`
                : `Start Screening (${candidateFiles.length} Resumes)`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
