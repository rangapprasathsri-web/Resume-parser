import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { extractTextFromFile } from '../../services/apiService';
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
  onCancel: () => void;
}

export const NewBatchScreeningScreen: React.FC<NewBatchScreeningScreenProps> = ({
  onStartScreening,
  onCancel,
}) => {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [candidateFiles, setCandidateFiles] = useState<CandidateFileItem[]>([]);
  const [analysisMode, setAnalysisMode] = useState<'ai_ats' | 'ats_only'>('ai_ats');
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jdFileInputRef = useRef<HTMLInputElement>(null);

  // Handle JD File Upload
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

  // Handle Multiple Resume Files Upload
  const handleResumeFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsExtracting(true);
    setErrorMessage(null);

    const newItems: CandidateFileItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const extracted = await extractTextFromFile(file);
        // Duplicate check
        const isDuplicate = candidateFiles.some(
          (c) => c.name === file.name || c.text.trim() === extracted.text.trim()
        );

        if (!isDuplicate) {
          newItems.push({
            id: `item_${Date.now()}_${i}_${Math.random()}`,
            name: file.name,
            size: file.size,
            text: extracted.text,
            file,
          });
        }
      } catch (err: any) {
        setErrorMessage(`Warning on ${file.name}: ${err.message}`);
      }
    }

    setCandidateFiles((prev) => [...prev, ...newItems]);
    setIsExtracting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Load sample demo batch for quick evaluation
  const loadDemoSamplePack = () => {
    setJobTitle('Senior Python AI Engineer');
    setJobDescription(SAMPLE_JD);
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
    if (!jobDescription.trim()) {
      setErrorMessage('Please provide a Job Description.');
      return;
    }
    if (candidateFiles.length === 0) {
      setErrorMessage('Please upload or add at least one candidate resume.');
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
            Create Screening Session
          </h1>
          <p className="text-xs sm:text-sm text-secondary font-sans mt-0.5">
            Evaluate 1 to N resumes against your target job specification.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadDemoSamplePack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-strong bg-surface text-primary hover:bg-surface-sunken text-xs font-medium transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Load Sample Batch</span>
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

      {errorMessage && (
        <div className="p-3.5 rounded-[8px] border border-status-missing/30 bg-status-missing/5 text-status-missing flex items-start gap-2.5 text-xs font-sans">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Job Description */}
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

        {/* Step 2: Resume Candidates */}
        <div className="rounded-[8px] border border-default bg-surface p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-default pb-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-mono font-bold flex items-center justify-center">
                2
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
                      className="p-1 text-muted hover:text-status-missing rounded transition-colors cursor-pointer"
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

        {/* Step 3: Screening Engine Mode Selection */}
        <div className="rounded-[8px] border border-default bg-surface p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-default pb-3">
            <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-mono font-bold flex items-center justify-center">
              3
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
            disabled={isExtracting || candidateFiles.length === 0 || !jobDescription.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
          >
            <span>Start Screening ({candidateFiles.length} Resumes)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
