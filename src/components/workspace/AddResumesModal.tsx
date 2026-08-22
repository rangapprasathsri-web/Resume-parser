import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  Trash2,
  Sparkles,
  Plus,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Layers,
  Zap,
  Info,
} from 'lucide-react';
import { JobScreeningSession } from '../../types';
import { extractTextFromFile, appendResumesToExistingSession } from '../../services/apiService';
import { SAMPLE_RESUME_1, SAMPLE_RESUME_2, SAMPLE_RESUME_3 } from '../../data/sampleData';

interface CandidateFileItem {
  id: string;
  name: string;
  size: number;
  text: string;
  file?: File;
  isExistingDuplicate?: boolean;
}

interface AddResumesModalProps {
  session: JobScreeningSession;
  isOpen: boolean;
  onClose: () => void;
  onSessionUpdated: (updatedSession: JobScreeningSession) => void;
}

export const AddResumesModal: React.FC<AddResumesModalProps> = ({
  session,
  isOpen,
  onClose,
  onSessionUpdated,
}) => {
  const [candidateFiles, setCandidateFiles] = useState<CandidateFileItem[]>([]);
  const [analysisMode, setAnalysisMode] = useState<'ai_ats' | 'ats_only'>('ai_ats');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isScreening, setIsScreening] = useState(false);
  const [screeningProgress, setScreeningProgress] = useState<{
    current: number;
    total: number;
    currentName: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const existingFileNames = new Set(
    (session.candidates || []).map((c) => c.fileName.toLowerCase())
  );

  // Handle Multi-file Upload (PDF, DOCX, TXT)
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsExtracting(true);
    setErrorMessage(null);

    const fileList: File[] = Array.from(files);
    try {
      const results = await Promise.allSettled(
        fileList.map(async (file: File, i: number) => {
          const extracted = await extractTextFromFile(file);
          const isExisting = existingFileNames.has(file.name.toLowerCase());
          return {
            id: `item_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            size: file.size,
            text: extracted.text,
            file,
            isExistingDuplicate: isExisting,
          };
        })
      );

      const newItems: CandidateFileItem[] = [];
      const errors: string[] = [];

      results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
          const item = res.value;
          const isQueuedDuplicate = candidateFiles.some((c) => c.name === item.name);
          if (!isQueuedDuplicate) {
            newItems.push(item);
          }
        } else {
          errors.push(`${fileList[i].name}: ${res.reason?.message || 'Extraction failed'}`);
        }
      });

      if (errors.length > 0) {
        setErrorMessage(`Some files could not be extracted: ${errors.join(', ')}`);
      }

      setCandidateFiles((prev) => [...prev, ...newItems]);
    } catch (err: any) {
      setErrorMessage(`File extraction error: ${err.message}`);
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Add Sample Presets for Quick Testing
  const handleAddSampleResume = (name: string, rawText: string) => {
    const isQueued = candidateFiles.some((c) => c.name === name);
    if (isQueued) return;
    const isExisting = existingFileNames.has(name.toLowerCase());

    const item: CandidateFileItem = {
      id: `sample_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      size: rawText.length,
      text: rawText,
      isExistingDuplicate: isExisting,
    };
    setCandidateFiles((prev) => [...prev, item]);
  };

  const handleRemoveFile = (id: string) => {
    setCandidateFiles((prev) => prev.filter((c) => c.id !== id));
  };

  const handleClearAll = () => {
    setCandidateFiles([]);
    setErrorMessage(null);
  };

  // Start Instant Screening against the existing session's JD
  const handleExecuteAppend = async () => {
    if (candidateFiles.length === 0) {
      setErrorMessage('Please add at least one resume file to screen.');
      return;
    }

    setIsScreening(true);
    setErrorMessage(null);
    setScreeningProgress({
      current: 0,
      total: candidateFiles.length,
      currentName: candidateFiles[0].name,
    });

    try {
      const updated = await appendResumesToExistingSession(
        session,
        candidateFiles.map((c) => ({
          fileName: c.name,
          rawText: c.text,
        })),
        analysisMode,
        undefined,
        (current, total, name) => {
          setScreeningProgress({
            current,
            total,
            currentName: name,
          });
        }
      );

      onSessionUpdated(updated);
      onClose();
    } catch (err: any) {
      console.error('Failed to append resumes:', err);
      setErrorMessage(`Error screening new resumes: ${err.message || 'Unknown error'}`);
      setIsScreening(false);
      setScreeningProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-surface border border-default rounded-[10px] w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-default bg-surface-sunken/60 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 mt-0.5">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-primary tracking-tight">
                  Add Resumes to Session
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 text-accent font-semibold border border-accent/20">
                  {session.candidateCount} Existing Candidates
                </span>
              </div>

              {/* Automatic JD Inheritance Badge - No JD Re-Entry */}
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-secondary font-sans">
                <span>Target Role: <strong className="text-primary">{session.title}</strong></span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-status-matched font-mono text-[11px] font-medium">
                  <CheckCircle2 className="w-3 h-3 text-status-matched" />
                  <span>Auto-screening against {session.parsedJd?.requirements?.length || 'active'} Job Criteria</span>
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isScreening}
            className="p-1.5 rounded-[6px] text-secondary hover:text-primary hover:bg-surface-sunken transition-colors cursor-pointer disabled:opacity-50"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Information Pill */}
          <div className="p-3 rounded-[6px] bg-surface-sunken border border-default flex items-start gap-2.5 text-xs text-secondary">
            <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-primary font-medium">
                No need to enter job details or upload a job description again.
              </p>
              <p className="text-[11px]">
                Drop or select new candidate resumes below. They will be screened and ranked against <strong>"{session.title}"</strong> and added directly to this workspace.
              </p>
            </div>
          </div>

          {/* Screening Progress State if Active */}
          {isScreening && screeningProgress && (
            <div className="p-4 rounded-[8px] border border-accent/30 bg-accent/5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-accent flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 animate-pulse" />
                  <span>Screening candidate {screeningProgress.current + 1} of {screeningProgress.total}...</span>
                </span>
                <span className="text-primary font-bold">
                  {Math.round(((screeningProgress.current) / (screeningProgress.total || 1)) * 100)}%
                </span>
              </div>

              <div className="w-full bg-surface border border-default rounded-full h-2 overflow-hidden">
                <div
                  className="bg-accent h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${Math.max(5, Math.round(((screeningProgress.current + 0.5) / (screeningProgress.total || 1)) * 100))}%`,
                  }}
                />
              </div>

              <div className="text-[11px] font-mono text-secondary truncate">
                Evaluating: <strong className="text-primary">{screeningProgress.currentName}</strong>
              </div>
            </div>
          )}

          {/* Upload Dropzone */}
          {!isScreening && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFilesSelected(e.dataTransfer.files);
                }}
                className="border-2 border-dashed border-default hover:border-accent/60 bg-surface-sunken/40 hover:bg-surface-sunken/80 rounded-[8px] p-6 sm:p-8 text-center cursor-pointer transition-colors space-y-3 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.md"
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />

                <div className="w-12 h-12 mx-auto rounded-full bg-surface border border-default flex items-center justify-center text-secondary group-hover:text-accent group-hover:border-accent/40 transition-colors shadow-2xs">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-semibold text-primary">
                    Click to browse or drag & drop candidate resumes
                  </p>
                  <p className="text-[11px] text-secondary font-mono">
                    Supports multiple PDF, DOCX, TXT, MD files
                  </p>
                </div>

                {isExtracting && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-accent/10 text-accent font-mono text-xs font-semibold animate-pulse">
                    <span>Extracting text layers from files...</span>
                  </div>
                )}
              </div>

              {/* Sample Quick Presets */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-default/60">
                <span className="text-[11px] font-mono text-muted">Quick Sample Presets:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddSampleResume('Alex_Morgan_Senior_Lead.txt', SAMPLE_RESUME_1)}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface-sunken border border-default hover:border-strong text-secondary hover:text-primary transition-colors cursor-pointer"
                  >
                    + Alex Morgan (Lead)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSampleResume('Marcus_Vance_FullStack.txt', SAMPLE_RESUME_2)}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface-sunken border border-default hover:border-strong text-secondary hover:text-primary transition-colors cursor-pointer"
                  >
                    + Marcus Vance (Mid)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSampleResume('Elena_Rostova_Cloud_DevOps.txt', SAMPLE_RESUME_3)}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface-sunken border border-default hover:border-strong text-secondary hover:text-primary transition-colors cursor-pointer"
                  >
                    + Elena Rostova (Cloud)
                  </button>
                </div>
              </div>

              {/* Queued Resumes List */}
              {candidateFiles.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-primary uppercase">
                      Queued Resumes to Screen ({candidateFiles.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-[11px] font-mono text-muted hover:text-status-missing cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-default rounded-[6px] p-2 bg-surface">
                    {candidateFiles.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-2 rounded bg-surface-sunken/60 border border-default/70 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="font-semibold text-primary truncate max-w-[240px] sm:max-w-[320px]">
                            {c.name}
                          </span>
                          <span className="text-[10px] text-muted shrink-0">
                            ({Math.round(c.size / 1024)} KB • {c.text.split(/\s+/).filter(Boolean).length} words)
                          </span>
                          {c.isExistingDuplicate && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-status-partial/20 text-status-partial border border-status-partial/40 font-bold shrink-0">
                              Duplicate Name in Session
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFile(c.id)}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition-colors cursor-pointer shrink-0"
                          title="Remove file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analysis Mode Selector */}
              <div className="p-3 rounded-[6px] border border-default bg-surface space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-primary uppercase">
                    Screening Engine Mode
                  </span>
                  <span className="text-[10px] font-mono text-muted">
                    Deterministic ATS + Verification
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <label
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                      analysisMode === 'ai_ats'
                        ? 'border-accent bg-accent/10 text-primary font-bold'
                        : 'border-default text-secondary hover:border-strong'
                    }`}
                  >
                    <input
                      type="radio"
                      name="append_mode"
                      value="ai_ats"
                      checked={analysisMode === 'ai_ats'}
                      onChange={() => setAnalysisMode('ai_ats')}
                      className="text-accent focus:ring-0 cursor-pointer"
                    />
                    <span>AI + ATS Evaluation</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                      analysisMode === 'ats_only'
                        ? 'border-accent bg-accent/10 text-primary font-bold'
                        : 'border-default text-secondary hover:border-strong'
                    }`}
                  >
                    <input
                      type="radio"
                      name="append_mode"
                      value="ats_only"
                      checked={analysisMode === 'ats_only'}
                      onChange={() => setAnalysisMode('ats_only')}
                      className="text-accent focus:ring-0 cursor-pointer"
                    />
                    <span>ATS Only (Fast)</span>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-[6px] border border-status-missing/30 bg-status-missing/10 text-status-missing text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-default bg-surface-sunken/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isScreening}
            className="px-3.5 py-1.5 rounded-[6px] border border-default bg-surface hover:bg-surface-sunken text-secondary hover:text-primary text-xs font-mono transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecuteAppend}
            disabled={isScreening || candidateFiles.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-[6px] bg-accent text-white hover:bg-accent-hover text-xs font-semibold transition-colors cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isScreening ? (
              <>
                <Zap className="w-3.5 h-3.5 animate-spin" />
                <span>Screening Resumes...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>
                  Screen & Add {candidateFiles.length > 0 ? `${candidateFiles.length} ` : ''}Resumes to Session
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
