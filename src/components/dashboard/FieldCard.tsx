import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Briefcase,
  GraduationCap,
  Code2,
  Mail,
  Phone,
  Globe,
  Copy,
  Check,
  Award,
  Layers
} from 'lucide-react';
import { ExtractedField } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { EvidenceBlock } from '../common/EvidenceBlock';

interface FieldCardProps {
  field: ExtractedField;
  isHighlighted?: boolean;
  defaultExpanded?: boolean;
  forceEvidenceExpanded?: boolean;
}

export const FieldCard: React.FC<FieldCardProps> = ({
  field,
  isHighlighted = false,
  defaultExpanded = true,
  forceEvidenceExpanded,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (forceEvidenceExpanded !== undefined) {
      setIsExpanded(forceEvidenceExpanded);
    }
  }, [forceEvidenceExpanded]);

  const handleCopyFieldValue = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = typeof field.value === 'string' 
      ? field.value 
      : JSON.stringify(field.value, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  // Formatted rendering of extracted structured values
  const renderValueContent = () => {
    if (field.status === 'NOT_FOUND') {
      return (
        <div className="py-1">
          <span className="italic text-sm text-muted">
            {field.not_found_reason || 'Section not present'}
          </span>
        </div>
      );
    }

    if (field.id === 'CONTACT-INFO' && typeof field.value === 'object' && !Array.isArray(field.value)) {
      const contact = field.value as Record<string, any>;
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {contact.email && (
            <div className="flex items-center gap-2 text-secondary">
              <Mail className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
              <span className="text-primary truncate">{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-secondary">
              <Phone className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
              <span className="text-primary">{contact.phone}</span>
            </div>
          )}
          {contact.location && (
            <div className="flex items-center gap-2 text-secondary">
              <Globe className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
              <span className="text-primary">{contact.location}</span>
            </div>
          )}
          {contact.links && contact.links.length > 0 && (
            <div className="sm:col-span-2 flex flex-wrap gap-1.5 pt-1">
              {contact.links.map((link: string, idx: number) => (
                <span
                  key={idx}
                  className="font-mono text-xs px-2 py-0.5 rounded-[4px] bg-surface-sunken border border-default text-secondary"
                >
                  {link}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (Array.isArray(field.value)) {
      if (typeof field.value[0] === 'string') {
        return (
          <div className="flex flex-wrap gap-1.5">
            {field.value.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-surface-sunken border border-default text-primary text-xs font-mono"
              >
                {item}
              </span>
            ))}
          </div>
        );
      }

      if (field.id === 'WORK-EXPERIENCE') {
        return (
          <div className="space-y-2">
            {(field.value as any[]).map((exp, idx) => (
              <div key={idx} className="rounded-[6px] bg-surface-sunken p-2.5 text-xs">
                <div className="flex items-center justify-between font-medium text-primary mb-1 flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.5} />
                    <span className="font-semibold text-primary">{exp.title}</span>
                    <span className="text-muted">•</span>
                    <span className="text-secondary">{exp.company}</span>
                  </div>
                  <span className="font-mono text-[11px] text-muted">{exp.period}</span>
                </div>
                <p className="text-secondary leading-relaxed text-[12px] pl-5 font-sans">
                  {exp.highlights}
                </p>
              </div>
            ))}
          </div>
        );
      }

      if (field.id === 'EDUCATION') {
        return (
          <div className="space-y-1.5">
            {(field.value as any[]).map((edu, idx) => (
              <div key={idx} className="rounded-[6px] bg-surface-sunken p-2.5 text-xs">
                <div className="flex items-center justify-between font-medium text-primary flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.5} />
                    <span className="font-semibold text-primary">{edu.degree}</span>
                  </div>
                  <span className="font-mono text-[11px] text-muted">{edu.year}</span>
                </div>
                <div className="text-secondary text-[12px] pl-5 mt-0.5">{edu.institution}</div>
              </div>
            ))}
          </div>
        );
      }

      if (field.id === 'PROJECTS') {
        return (
          <div className="space-y-1.5">
            {(field.value as any[]).map((proj, idx) => (
              <div key={idx} className="rounded-[6px] bg-surface-sunken p-2.5 text-xs">
                <div className="flex items-center justify-between font-medium text-primary mb-1 flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.5} />
                    <span className="font-semibold text-primary">{proj.name}</span>
                  </div>
                  <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-surface text-secondary border border-default">
                    {proj.tech}
                  </span>
                </div>
                <p className="text-secondary text-[12px] leading-relaxed pl-5 font-sans">
                  {proj.description}
                </p>
              </div>
            ))}
          </div>
        );
      }
    }

    return (
      <p className="text-sm text-primary leading-relaxed font-sans select-text">
        {String(field.value)}
      </p>
    );
  };

  return (
    <div
      id={`field-${field.id}`}
      className={`rounded-[8px] border bg-surface p-4 transition-all duration-200 scroll-mt-20 ${
        isHighlighted
          ? 'highlight-flash border-accent'
          : 'border-default hover:border-strong'
      }`}
    >
      {/* Field Row Header: [category tag] [field label] ..................... [status badge] [chevron] */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <span className="font-mono text-xs font-medium text-secondary bg-surface-sunken px-2 py-0.5 rounded-[4px] border border-default shrink-0">
            {field.id}
          </span>
          <span className="text-sm font-semibold text-primary truncate">
            {field.label}
          </span>
          <span className="text-[11px] font-mono text-muted uppercase tracking-wider hidden sm:inline">
            [{field.category}]
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyFieldValue}
            className="p-1 rounded text-muted hover:text-primary hover:bg-surface-sunken transition-colors"
            title="Copy field data"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-status-found" /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />}
          </button>
          
          <StatusBadge status={field.status} size="sm" />

          <button
            type="button"
            className="p-1 text-secondary hover:text-primary transition-colors"
            title={isExpanded ? 'Collapse row' : 'Expand row'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" strokeWidth={1.75} />
            ) : (
              <ChevronDown className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Value Content & Evidence Block */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-default space-y-2.5">
          {/* Extracted Value */}
          <div>{renderValueContent()}</div>

          {/* Ambiguity Note if any */}
          {field.status === 'AMBIGUOUS' && field.ambiguity_note && (
            <div className="text-xs font-sans text-status-ambiguous bg-status-ambiguous/10 p-2.5 rounded-[6px] border border-status-ambiguous/20">
              <span className="font-semibold">Note on Ambiguity:</span> {field.ambiguity_note}
            </div>
          )}

          {/* Source Evidence Block (only if found or has text snippet) */}
          {field.status !== 'NOT_FOUND' && field.evidence && (
            <EvidenceBlock
              evidence={field.evidence}
              sourceSection={field.sourceSection}
              evidenceLineRef={field.evidenceLineRef}
            />
          )}
        </div>
      )}
    </div>
  );
};
