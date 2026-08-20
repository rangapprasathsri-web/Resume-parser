import React from 'react';
import { ConfidenceLevel } from '../../types';

interface ConfidenceTagProps {
  confidence: ConfidenceLevel;
  showLabel?: boolean;
  className?: string;
}

export const ConfidenceTag: React.FC<ConfidenceTagProps> = ({
  confidence,
  showLabel = true,
  className = '',
}) => {
  // 3 opacity levels of text-secondary for high / medium / low
  let dotOpacity = 'opacity-100';
  let label = 'High confidence';

  if (confidence === 'medium') {
    dotOpacity = 'opacity-60';
    label = 'Medium confidence';
  } else if (confidence === 'low') {
    dotOpacity = 'opacity-30';
    label = 'Low confidence';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs text-secondary font-sans ${className}`}
      title={`${label} grounding`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full bg-current ${dotOpacity}`}
        aria-hidden="true"
      />
      {showLabel && (
        <span className="capitalize text-[12px]">{confidence}</span>
      )}
    </span>
  );
};
