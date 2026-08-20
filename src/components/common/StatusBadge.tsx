import React from 'react';
import { Check, MinusCircle, AlertCircle } from 'lucide-react';
import { ExtractionStatus, RequirementStatus } from '../../types';

export type AnyStatus = ExtractionStatus | RequirementStatus;

interface StatusBadgeProps {
  status: AnyStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const isFoundOrMatched = status === 'FOUND' || status === 'MATCHED';
  const isAmbiguousOrPartial = status === 'AMBIGUOUS' || status === 'PARTIAL';
  const isNotFoundOrMissing = status === 'NOT_FOUND' || status === 'MISSING';

  let colorClasses = 'bg-surface-sunken text-secondary';
  let IconComponent = Check;

  if (isFoundOrMatched) {
    colorClasses = 'bg-status-found text-status-found';
    IconComponent = Check;
  } else if (isAmbiguousOrPartial) {
    colorClasses = 'bg-status-ambiguous text-status-ambiguous';
    IconComponent = AlertCircle;
  } else if (isNotFoundOrMissing) {
    // Muted calm missing state (never alarm-red)
    colorClasses = 'bg-status-missing text-status-missing';
    IconComponent = MinusCircle;
  }

  const paddingClass = size === 'sm' ? 'py-0.5 px-2 text-[11px]' : 'py-1 px-2.5 text-[12px]';

  return (
    <span
      className={`inline-flex items-center rounded-full font-mono font-medium whitespace-nowrap shrink-0 leading-none gap-1.5 transition-colors ${paddingClass} ${colorClasses} ${className}`}
    >
      {showIcon && (
        <IconComponent
          className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'}
          strokeWidth={2}
        />
      )}
      <span>{status}</span>
    </span>
  );
};
