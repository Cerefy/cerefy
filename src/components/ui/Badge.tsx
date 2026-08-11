// src/components/ui/Badge.tsx
// Status badge component with Cerefy color palette

import React from 'react';

export type BadgeVariant = 'info' | 'success' | 'warning' | 'error' | 'cyan' | 'indigo' | 'neutral';
export type BadgeSize = 'xs' | 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  info: 'bg-blue-signal/10 text-blue-signal-strong border-blue-signal/20',
  success: 'bg-emerald-signal/10 text-emerald-signal-strong border-emerald-signal/20',
  warning: 'bg-amber-signal/10 text-amber-signal-strong border-amber-signal/20',
  error: 'bg-rose-signal/10 text-rose-signal-strong border-rose-signal/20',
  cyan: 'bg-cyan-signal/10 text-cyan-signal-strong border-cyan-signal/20',
  indigo: 'bg-indigo-signal/10 text-indigo-signal-strong border-indigo-signal/20',
  neutral: 'bg-dark-panel-raised text-dark-muted border-dark-border',
};

const dotColors: Record<BadgeVariant, string> = {
  info: 'bg-blue-signal-strong',
  success: 'bg-emerald-signal-strong',
  warning: 'bg-amber-signal-strong',
  error: 'bg-rose-signal-strong',
  cyan: 'bg-cyan-signal-strong',
  indigo: 'bg-indigo-signal-strong',
  neutral: 'bg-dark-muted',
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'px-1.5 py-0.5 text-[9px]',
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  pulse = false,
  children,
  className = '',
}) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium font-mono rounded-full border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]} ${pulse ? 'animate-pulse' : ''}`} />
      )}
      {children}
    </span>
  );
};
