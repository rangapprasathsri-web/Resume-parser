import React, { useState } from 'react';
import { Search, FileText, ArrowRight, Trash2, Sparkles, Filter } from 'lucide-react';
import { AnalysisResult } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ScorerBadge } from '../common/ScorerBadge';

interface HistoryViewProps {
  history: AnalysisResult[];
  onSelectResult: (result: AnalysisResult) => void;
  onNewAnalysis: () => void;
  onDeleteResult: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onSelectResult,
  onNewAnalysis,
  onDeleteResult,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterScore, setFilterScore] = useState<'ALL' | 'HIGH' | 'LOW'>('ALL');

  const filteredHistory = history.filter(item => {
    const matchesSearch = 
      item.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.targetRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.fileName && item.fileName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterScore === 'HIGH') return item.fitScorePercentage >= 70;
    if (filterScore === 'LOW') return item.fitScorePercentage < 70;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary tracking-tight">
            Screening History
          </h1>
          <p className="text-sm text-secondary font-sans">
            {history.length} candidate assessments recorded with verified evidence groundings.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewAnalysis}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-medium transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>New Analysis</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-[8px] border border-default bg-surface p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search by filename, candidate, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-sans bg-surface-sunken border border-default rounded-[6px] text-primary placeholder:text-muted focus:border-strong focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-mono text-secondary">
          <span>Filter score:</span>
          <select
            value={filterScore}
            onChange={(e) => setFilterScore(e.target.value as any)}
            className="py-1 px-2 text-xs font-mono bg-surface border border-default rounded-[4px] text-primary focus:outline-none"
          >
            <option value="ALL">All Scores</option>
            <option value="HIGH">≥ 70% Fit</option>
            <option value="LOW">&lt; 70% Fit</option>
          </select>
        </div>
      </div>

      {/* History Table (§9 Screen 6: filename, role, processed date, match score, status badge) */}
      <div className="rounded-[8px] border border-default bg-surface overflow-hidden">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm text-secondary font-sans">
              No analyses found matching your query.
            </p>
            <button
              type="button"
              onClick={onNewAnalysis}
              className="px-3.5 py-1.5 rounded-[6px] border border-strong bg-transparent text-primary text-xs font-medium hover:bg-surface-sunken"
            >
              Start New Analysis
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-default bg-surface-sunken text-[11px] font-mono text-muted uppercase tracking-wider">
                  <th className="py-3 px-4 font-medium">Filename / Candidate</th>
                  <th className="py-3 px-4 font-medium">Target Role</th>
                  <th className="py-3 px-4 font-medium">Processed Date</th>
                  <th className="py-3 px-4 font-medium">Match Score</th>
                  <th className="py-3 px-4 font-medium">Status Badge</th>
                  <th className="py-3 px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default text-xs">
                {filteredHistory.map((item) => {
                  const statusVariant = 
                    item.fitScorePercentage >= 80 ? 'MATCHED' : 
                    item.fitScorePercentage >= 50 ? 'PARTIAL' : 'MISSING';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectResult(item)}
                      className="hover:bg-surface-sunken/70 cursor-pointer transition-colors group"
                    >
                      {/* Filename & Candidate */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-secondary group-hover:text-accent shrink-0 transition-colors" strokeWidth={1.5} />
                          <div>
                            <div className="font-semibold text-primary group-hover:text-accent transition-colors">
                              {item.fileName || `${item.candidateName.replace(/\s+/g, '_')}_CV.pdf`}
                            </div>
                            <div className="text-[11px] text-secondary font-sans">
                              {item.candidateName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Target Role */}
                      <td className="py-3.5 px-4 text-secondary font-sans">
                        {item.targetRole}
                      </td>

                      {/* Processed Date */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-muted">
                        {item.timestamp}
                      </td>

                      {/* Match Score */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-primary text-sm">
                            {item.fitScorePercentage}%
                          </span>
                          <span className="font-mono text-[11px] text-secondary">
                            ({item.matchedCount}/{item.totalRequirements})
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={statusVariant} size="sm" />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => onSelectResult(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-surface-sunken hover:bg-surface border border-default text-primary text-xs font-medium transition-colors"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3 text-secondary" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteResult(item.id)}
                            className="p-1 text-muted hover:text-status-missing hover:bg-surface-sunken rounded transition-colors"
                            title="Delete history record"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
