import React, { forwardRef } from 'react';

export interface InputBaseProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tooltip?: string;
  isInvalid?: boolean;
}

export const InputBase = forwardRef<HTMLInputElement, InputBaseProps>(
  ({ className = '', tooltip, isInvalid, ...props }, ref) => {
    return (
      <div className="input-base-wrapper">
        <input
          ref={ref}
          className={`input-base-control ${isInvalid ? 'is-invalid' : ''} ${className}`}
          {...props}
        />
        {tooltip && (
          <span className="input-base-tooltip" title={tooltip}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </span>
        )}
      </div>
    );
  }
);

InputBase.displayName = 'InputBase';
