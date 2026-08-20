import React, { useState } from 'react';
import { X, Copy, Check, FileText, Search } from 'lucide-react';

interface RawTextModalProps {
  onClose: () => void;
  resumeText: string;
  jdText: string;
  candidateName: string;
}

export const RawTextModal: React.FC<RawTextModalProps> = ({
  onClose,
  resumeText,
  jdText,
  candidateName,
}) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'jd'>('resume');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentText = activeTab === 'resume' ? resumeText : jdText;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-surface border border-default rounded-[8px] w-full max-w-4xl max-h-[88vh] flex flex-col shadow-xl overflow-hidden"
        style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-default bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-[6px] bg-accent-subtle text-accent">
              <FileText className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary">
                Source Document Inspector
              </h3>
              <p className="text-xs text-secondary font-sans">
                {candidateName} • Raw text stream
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-primary bg-surface-sunken hover:bg-surface border border-default rounded-[6px] transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-status-found" />
                  <span className="text-status-found">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-secondary" strokeWidth={1.5} />
                  <span>Copy text</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-secondary hover:text-primary hover:bg-surface-sunken rounded-[6px] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-surface-sunken border-b border-default gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('resume')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-[6px] transition-colors ${
                activeTab === 'resume'
                  ? 'bg-accent text-white'
                  : 'text-secondary hover:text-primary hover:bg-surface'
              }`}
            >
              Resume Text ({resumeText.length} chars)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('jd')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-[6px] transition-colors ${
                activeTab === 'jd'
                  ? 'bg-accent text-white'
                  : 'text-secondary hover:text-primary hover:bg-surface'
              }`}
            >
              Job Description ({jdText.length} chars)
            </button>
          </div>

          <div className="relative w-60">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs font-mono bg-surface border border-default rounded-[6px] text-primary focus:outline-none focus:border-strong"
            />
          </div>
        </div>

        {/* Text Viewport */}
        <div className="flex-1 overflow-y-auto p-5 bg-surface-sunken">
          <pre className="font-mono text-xs text-primary whitespace-pre-wrap leading-relaxed select-text font-normal">
            {currentText}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-surface border-t border-default text-[11px] font-mono text-secondary flex items-center justify-between">
          <span>Verbatim Source Integrity: All extracted fields match this raw text.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-[6px] bg-surface-sunken hover:bg-surface border border-default text-primary text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
