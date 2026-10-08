import React from 'react';

export interface InputGroupProps {
  label?: React.ReactNode;
  isRequired?: boolean;
  hint?: React.ReactNode;
  tooltip?: React.ReactNode;
  leadingAddon?: React.ReactNode;
  trailingAddon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export interface AddonProps {
  children: React.ReactNode;
  className?: string;
}

export const InputGroup: React.FC<InputGroupProps> & {
  Prefix: React.FC<AddonProps>;
  Suffix: React.FC<AddonProps>;
} = ({
  label,
  isRequired,
  hint,
  tooltip,
  leadingAddon,
  trailingAddon,
  children,
  className = ''
}) => {
  return (
    <div className={`input-group ${className}`}>
      {label && (
        <div className="input-group-label-row">
          <label className="input-group-label">
            {label}
            {isRequired && <span className="input-group-required">*</span>}
          </label>
          {tooltip && (
            <span className="input-group-tooltip-icon" title={typeof tooltip === 'string' ? tooltip : undefined}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </span>
          )}
        </div>
      )}

      <div className={`input-group-field-box ${leadingAddon ? 'has-leading' : ''} ${trailingAddon ? 'has-trailing' : ''}`}>
        {leadingAddon}
        <div className="input-group-inner-control">{children}</div>
        {trailingAddon}
      </div>

      {hint && <p className="input-group-hint">{hint}</p>}
    </div>
  );
};

const Prefix: React.FC<AddonProps> = ({ children, className = '' }) => {
  return <span className={`input-group-prefix ${className}`}>{children}</span>;
};

const Suffix: React.FC<AddonProps> = ({ children, className = '' }) => {
  return <span className={`input-group-suffix ${className}`}>{children}</span>;
};

InputGroup.Prefix = Prefix;
InputGroup.Suffix = Suffix;
