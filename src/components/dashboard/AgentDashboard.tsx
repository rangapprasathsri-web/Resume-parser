import React, { useState } from 'react';
import {
  Briefcase,
  Users,
  Award,
  ArrowRight,
  TrendingUp,
  Plus,
  Trash2,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { JobScreeningSession } from '../../types';
import { AddResumesModal } from '../workspace/AddResumesModal';

interface AgentDashboardProps {
  sessions: JobScreeningSession[];
  onNewScreening: () => void;
  onSelectSession: (jobId: string) => void;
  onDeleteSession: (jobId: string) => void;
  onUpdateSession?: (session: JobScreeningSession) => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({
  sessions,
  onNewScreening,
  onSelectSession,
  onDeleteSession,
  onUpdateSession,
}) => {
  const [activeModalSession, setActiveModalSession] = useState<JobScreeningSession | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<JobScreeningSession | null>(null);

  const totalCandidates = sessions.reduce((acc, s) => acc + (s.candidateCount || 0), 0);
  const totalHighMatch = sessions.reduce((acc, s) => {
    const high = s.candidates?.filter(
      (c) => c.recommendation === 'EXCELLENT_MATCH' || c.recommendation === 'HIGH_MATCH'
    ).length || 0;
    return acc + high;
  }, 0);

  const avgScore =
    sessions.length > 0
      ? Math.round((sessions.reduce((acc, s) => acc + (s.averageScore || 0), 0) / sessions.length) * 10) / 10
      : 0;

  const handleConfirmDelete = () => {
    if (sessionToDelete) {
      onDeleteSession(sessionToDelete.jobId);
      setSessionToDelete(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-primary tracking-tight">
            Resume Screening
          </h1>
          <p className="text-xs sm:text-sm text-secondary font-sans mt-0.5">
            Screen and rank candidates against job requirements.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewScreening}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          <span>New Screening</span>
        </button>
      </div>

      {/* 4 Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-[8px] border border-default bg-surface space-y-1">
          <div className="flex items-center justify-between text-muted text-xs font-mono">
            <span>JOBS</span>
            <Briefcase className="w-3.5 h-3.5 text-secondary" strokeWidth={1.5} />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-primary">{sessions.length}</div>
        </div>

        <div className="p-3.5 rounded-[8px] border border-default bg-surface space-y-1">
          <div className="flex items-center justify-between text-muted text-xs font-mono">
            <span>CANDIDATES</span>
            <Users className="w-3.5 h-3.5 text-secondary" strokeWidth={1.5} />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-primary">{totalCandidates}</div>
        </div>

        <div className="p-3.5 rounded-[8px] border border-default bg-surface space-y-1">
          <div className="flex items-center justify-between text-muted text-xs font-mono">
            <span>HIGH MATCH (≥80%)</span>
            <Award className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-accent">{totalHighMatch}</div>
        </div>

        <div className="p-3.5 rounded-[8px] border border-default bg-surface space-y-1">
          <div className="flex items-center justify-between text-muted text-xs font-mono">
            <span>AVG FIT</span>
            <TrendingUp className="w-3.5 h-3.5 text-secondary" strokeWidth={1.5} />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-primary">{avgScore}%</div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-semibold font-mono text-primary uppercase tracking-wider">
            Job Workspaces
          </h2>
          <span className="text-xs font-mono text-muted">{sessions.length} total</span>
        </div>

        <div className="rounded-[8px] border border-default bg-surface overflow-hidden shadow-xs">
          {sessions.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-10 h-10 rounded-[8px] bg-surface-sunken border border-default flex items-center justify-center mx-auto text-muted">
                <Briefcase className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-primary">No screening sessions yet</h3>
                <p className="text-xs text-secondary font-sans">
                  Create a new job screening to evaluate candidate resumes.
                </p>
              </div>
              <button
                type="button"
                onClick={onNewScreening}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start Screening</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-default bg-surface-sunken text-[11px] font-mono text-muted uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-medium">Job Title</th>
                    <th className="py-2.5 px-4 font-medium">Candidates</th>
                    <th className="py-2.5 px-4 font-medium">Top Match</th>
                    <th className="py-2.5 px-4 font-medium">Average</th>
                    <th className="py-2.5 px-4 font-medium">Date</th>
                    <th className="py-2.5 px-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default text-xs">
                  {sessions.map((s) => (
                    <tr
                      key={s.jobId}
                      onClick={() => onSelectSession(s.jobId)}
                      className="hover:bg-surface-sunken/60 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <FileText
                            className="w-4 h-4 text-secondary group-hover:text-accent shrink-0 transition-colors"
                            strokeWidth={1.5}
                          />
                          <div className="font-semibold text-primary group-hover:text-accent transition-colors truncate max-w-xs sm:max-w-md">
                            {s.title}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-secondary">
                        {s.candidateCount}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold font-mono text-primary">
                          {s.topScore > 0 ? `${s.topScore}%` : '—'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-secondary">
                        {s.averageScore > 0 ? `${s.averageScore}%` : '—'}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-muted">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveModalSession(s)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-[4px] bg-accent/10 hover:bg-accent/20 text-accent text-xs font-medium transition-colors cursor-pointer"
                            title="Add resumes to this job"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectSession(s.jobId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-surface-sunken hover:bg-surface border border-default text-primary text-xs font-medium transition-colors cursor-pointer"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3 text-secondary" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSessionToDelete(s)}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition-colors cursor-pointer"
                            title="Delete session"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-default rounded-[10px] max-w-md w-full p-5 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-status-missing/10 text-status-missing flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-primary">Delete Job Workspace?</h3>
                <p className="text-xs text-secondary font-sans">
                  Are you sure you want to delete <span className="font-semibold text-primary">"{sessionToDelete.title}"</span>? This will permanently remove all {sessionToDelete.candidateCount} candidate evaluations and ranking data.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-default">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="px-3 py-1.5 rounded-[6px] border border-default text-secondary hover:text-primary text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-[6px] bg-status-missing hover:bg-red-600 text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
              >
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Resumes Modal */}
      {activeModalSession && (
        <AddResumesModal
          session={activeModalSession}
          isOpen={!!activeModalSession}
          onClose={() => setActiveModalSession(null)}
          onSessionUpdated={(updated) => {
            if (onUpdateSession) {
              onUpdateSession(updated);
            }
            setActiveModalSession(null);
            onSelectSession(updated.jobId);
          }}
        />
      )}
    </div>
  );
};
