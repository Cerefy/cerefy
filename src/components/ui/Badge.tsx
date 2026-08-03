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
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  neutral: 'bg-zinc-800 text-zinc-400 border-zinc-700',
};

const dotColors: Record<BadgeVariant, string> = {
  info: 'bg-blue-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  error: 'bg-red-400',
  cyan: 'bg-cyan-400',
  indigo: 'bg-indigo-400',
  neutral: 'bg-zinc-500',
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
