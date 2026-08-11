// src/components/ui/Input.tsx
// Premium input field with Cerefy dark-mode styling

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconRight, fullWidth = true, className = '', ...props }, ref) => {
    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-dark-muted-strong text-xs font-medium mb-1.5 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute start-3 top-1/2 -translate-y-1/2 text-dark-muted">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-dark-panel-raised/50 border rounded-lg px-4 py-2.5 text-dark-text text-sm
              placeholder-dark-muted
              focus:outline-none focus:ring-1 transition-all duration-200
              ${icon ? 'ps-10' : ''}
              ${iconRight ? 'pe-10' : ''}
              ${error
                ? 'border-rose-signal/50 focus:border-rose-signal/70 focus:ring-rose-signal/20'
                : 'border-dark-border/50 focus:border-cyan-signal/50 focus:ring-cyan-signal/20'
              }
              ${className}
            `}
            {...props}
          />
          {iconRight && (
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-dark-muted">
              {iconRight}
            </span>
          )}
        </div>
        {error && <p className="text-rose-signal-strong text-xs mt-1">{error}</p>}
        {hint && !error && <p className="text-dark-muted text-xs mt-1">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
