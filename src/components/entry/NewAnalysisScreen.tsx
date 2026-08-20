import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Briefcase, 
  ArrowRight, 
  Sparkles,
  Check,
  FileCheck
} from 'lucide-react';

interface NewAnalysisScreenProps {
  onStartAnalysis: (resumeText: string, jdText: string, customName?: string, customRole?: string) => void;
}

export const NewAnalysisScreen: React.FC<NewAnalysisScreenProps> = ({
  onStartAnalysis,
}) => {
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showPasteMode, setShowPasteMode] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = (resumeText.trim().length > 10) && jdText.trim().length > 10;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setFileError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content && content.trim().length > 10) {
        setResumeText(content);
      } else {
        // If binary or unextractable via raw text reader
        setFileError('Could not extract plain text from this file format. Please paste the resume text directly.');
        setShowPasteMode(true);
      }
    };
    reader.onerror = () => {
      setFileError('Failed to read file. Please paste the resume text.');
      setShowPasteMode(true);
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onStartAnalysis(resumeText.trim(), jdText.trim(), candidateName || undefined, targetRole || undefined);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Title & Introduction */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold text-primary tracking-tight">
          New Analysis
        </h1>
        <p className="text-sm text-secondary font-sans">
          Upload candidate resume and provide job description to run two-stage field extraction and fit scoring.
        </p>
      </div>

      {/* Two-Column Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* COLUMN 1: Candidate Resume */}
          <div className="rounded-[8px] border border-default bg-surface p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Header with Numbered Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-xs font-mono font-bold">
                    1
                  </span>
                  <h2 className="text-sm font-semibold text-primary">
                    Candidate Resume
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasteMode(!showPasteMode)}
                  className="text-xs font-mono text-accent hover:underline"
                >
                  {showPasteMode ? 'Switch to Dropzone' : 'Paste Raw Text'}
                </button>
              </div>

              {fileError && (
                <div className="text-xs text-status-missing bg-status-missing/10 p-2.5 rounded-[6px] border border-status-missing/20 font-sans">
                  {fileError}
                </div>
              )}

              {/* Upload Dropzone or Textarea */}
              {!showPasteMode ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`rounded-[8px] p-8 text-center border-dashed transition-all flex flex-col items-center justify-center min-h-[260px] ${
                    isDragging
                      ? 'border-accent bg-accent-subtle border-2'
                      : 'border-[1.5px] border-strong bg-surface-sunken hover:bg-surface'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
                    accept=".txt,.pdf,.docx,.md"
                    className="hidden"
                  />

                  <div className="w-10 h-10 rounded-full bg-surface border border-default flex items-center justify-center text-secondary mb-3">
                    <Upload className="w-5 h-5" strokeWidth={1.5} />
                  </div>

                  <p className="text-sm font-medium text-primary mb-1">
                    {fileName ? (
                      <span className="font-mono text-accent font-semibold">{fileName}</span>
                    ) : (
                      'Drag and drop resume file'
                    )}
                  </p>

                  <p className="text-xs text-muted mb-4 font-sans">
                    Supports .txt, .pdf, .docx, .md
                  </p>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-strong bg-transparent text-primary text-xs font-medium hover:bg-surface-sunken transition-colors cursor-pointer"
                  >
                    Browse Files
                  </button>

                  {fileName && resumeText && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-status-found font-mono">
                      <Check className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Resume text loaded ({resumeText.length} characters)</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={resumeText}
                    onChange={(e) => {
                      setResumeText(e.target.value);
                      if (!fileName) setFileName('Pasted_Resume.txt');
                    }}
                    placeholder="Paste resume text here..."
                    rows={11}
                    className="w-full bg-surface-sunken border border-default focus:border-strong rounded-[6px] p-3 text-xs font-mono text-primary placeholder:text-muted resize-y outline-none leading-relaxed"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-muted">
                    <span>{resumeText.length} characters</span>
                    {resumeText.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setResumeText(''); setFileName(null); }}
                        className="text-secondary hover:text-status-missing cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-default text-[11px] font-mono text-secondary">
              Stage 1 extracts 12 canonical fields with exact source evidence.
            </div>
          </div>

          {/* COLUMN 2: Job Description */}
          <div className="rounded-[8px] border border-default bg-surface p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Header with Numbered Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-xs font-mono font-bold">
                    2
                  </span>
                  <h2 className="text-sm font-semibold text-primary">
                    Job Description
                  </h2>
                </div>
              </div>

              {/* Textarea */}
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste Job Description with required skills, experience, and criteria..."
                rows={11}
                className="w-full bg-surface-sunken border border-default focus:border-strong rounded-[6px] p-3 text-xs font-mono text-primary placeholder:text-muted resize-y outline-none leading-relaxed"
                required
              />

              <div className="flex justify-between text-[11px] font-mono text-muted">
                <span>{jdText.length} characters</span>
                {jdText.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setJdText('')}
                    className="text-secondary hover:text-status-missing cursor-pointer"
                  >
                    Clear JD
                  </button>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-default text-[11px] font-mono text-secondary">
              Stage 2 scores requirements exclusively against Stage 1 fields.
            </div>
          </div>
        </div>

        {/* Bottom Submission Bar */}
        <div className="rounded-[8px] border border-default bg-surface p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-secondary font-sans flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>Zero-hallucination evidence grounding enabled</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                setResumeText('');
                setJdText('');
                setFileName(null);
                setFileError(null);
              }}
              className="px-3.5 py-2 rounded-[6px] text-xs font-medium text-secondary hover:text-primary transition-colors cursor-pointer"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-[6px] text-sm font-medium transition-colors ${
                canSubmit
                  ? 'bg-accent hover:bg-accent-hover text-white cursor-pointer'
                  : 'bg-surface-sunken text-muted cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" strokeWidth={1.75} />
              <span>Run Analysis</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
