import React from 'react';
import {
  Briefcase,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { JobScreeningSession } from '../../types';

interface AgentDashboardProps {
  sessions: JobScreeningSession[];
  onNewScreening: () => void;
  onSelectSession: (jobId: string) => void;
  onDeleteSession: (jobId: string) => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({
  sessions,
  onNewScreening,
  onSelectSession,
  onDeleteSession,
}) => {
  const totalCandidates = sessions.reduce((acc, s) => acc + s.candidateCount, 0);
  const totalHighMatch = sessions.reduce((acc, s) => {
    const high = s.candidates?.filter(
      (c) => c.recommendation === 'EXCELLENT_MATCH' || c.recommendation === 'HIGH_MATCH'
    ).length || 0;
    return acc + high;
  }, 0);

  const avgScore =
    sessions.length > 0
      ? Math.round((sessions.reduce((acc, s) => acc + s.averageScore, 0) / sessions.length) * 10) / 10
      : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-primary tracking-tight">
            Resume Screening Agent
          </h1>
          <p className="text-xs sm:text-sm text-secondary font-sans mt-0.5">
            Hybrid ATS keyword matching with OpenRouter agentic fit analysis.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewScreening}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          <span>New Screening Session</span>
        </button>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-[8px] border border-default bg-surface space-y-1">
          <div className="flex items-center justify-between text-muted text-xs font-mono">
            <span>ACTIVE JDS</span>
            <Briefcase className="w-4 h-4 text-secondary" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold font-mono text-primary">{sessions.length}</div>
          <div className="text-[11px] text-secondary">Target positions created</div>
        </div>

        <div className="p-4 rounded-[8px] border border-default bg-surface space-y-1">
          <div className="flex items-center justify-between text-muted text-xs font-mono">
            <span>TOTAL SCREENED</span>
            <Users className="w-4 h-4 text-secondary" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold font-mono text-primary">{totalCandidates}</div>
          <div className="text-[11px] text-secondary">Resumes extracted & scored</div>
        </div>

        <div className="p-4 rounded-[8px] border border-default bg-surface space-y-1">
          <div className="flex items-center justify-between text-muted text-xs font-mono">
            <span>HIGH-MATCH POOL</span>
            <Award className="w-4 h-4 text-accent" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold font-mono text-accent">{totalHighMatch}</div>
          <div className="text-[11px] text-secondary">≥ 80% comprehensive fit</div>
        </div>

        <div className="p-4 rounded-[8px] border border-default bg-surface space-y-1">
          <div className="flex items-center justify-between text-muted text-xs font-mono">
            <span>AVERAGE FIT</span>
            <TrendingUp className="w-4 h-4 text-secondary" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold font-mono text-primary">{avgScore}%</div>
          <div className="text-[11px] text-secondary">Across all active batches</div>
        </div>
      </div>

      {/* Screening Workspaces Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold font-mono text-primary uppercase tracking-wider">
            Screening Sessions & Workspaces
          </h2>
          <span className="text-xs font-mono text-muted">{sessions.length} recorded</span>
        </div>

        <div className="rounded-[8px] border border-default bg-surface overflow-hidden">
          {sessions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-[8px] bg-surface-sunken border border-default flex items-center justify-center mx-auto text-muted">
                <Briefcase className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-primary">No screening sessions yet</h3>
                <p className="text-xs text-secondary max-w-sm mx-auto font-sans">
                  Create your first job workspace and upload resumes to run automated ATS + Agentic ranking.
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
                    <th className="py-3 px-4 font-medium">Job Title & Workspace</th>
                    <th className="py-3 px-4 font-medium">Candidates</th>
                    <th className="py-3 px-4 font-medium">Top Match</th>
                    <th className="py-3 px-4 font-medium">Average Score</th>
                    <th className="py-3 px-4 font-medium">Created</th>
                    <th className="py-3 px-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default text-xs">
                  {sessions.map((s) => (
                    <tr
                      key={s.jobId}
                      onClick={() => onSelectSession(s.jobId)}
                      className="hover:bg-surface-sunken/60 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <FileText
                            className="w-4 h-4 text-secondary group-hover:text-accent shrink-0 transition-colors"
                            strokeWidth={1.5}
                          />
                          <div>
                            <div className="font-semibold text-primary group-hover:text-accent transition-colors">
                              {s.title}
                            </div>
                            <div className="text-[11px] text-muted font-mono">
                              ID: {s.jobId}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-primary">
                        {s.candidateCount} resumes
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-bold text-primary">
                            {s.topScore > 0 ? `${s.topScore}%` : '—'}
                          </span>
                          {s.topScore >= 80 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-status-matched/10 text-status-matched font-semibold">
                              High
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-secondary">
                        {s.averageScore > 0 ? `${s.averageScore}%` : '—'}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-muted">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
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
                            onClick={() => onDeleteSession(s.jobId)}
                            className="p-1 text-muted hover:text-status-missing hover:bg-surface-sunken rounded transition-colors cursor-pointer"
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
    </div>
  );
};
