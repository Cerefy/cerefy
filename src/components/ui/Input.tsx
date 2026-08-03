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
          <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-zinc-800/50 border rounded-lg px-4 py-2.5 text-white text-sm
              placeholder-zinc-600
              focus:outline-none focus:ring-1 transition-all duration-200
              ${icon ? 'pl-10' : ''}
              ${iconRight ? 'pr-10' : ''}
              ${error
                ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20'
                : 'border-zinc-700/50 focus:border-cyan-500/50 focus:ring-cyan-500/20'
              }
              ${className}
            `}
            {...props}
          />
          {iconRight && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
              {iconRight}
            </span>
          )}
        </div>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        {hint && !error && <p className="text-zinc-500 text-xs mt-1">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
