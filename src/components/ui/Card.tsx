// src/components/ui/Card.tsx
// Glassmorphism enterprise card with Cerefy Obsidian aesthetic

import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glow-cyan' | 'glow-indigo';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  default: 'bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/60',
  elevated: 'bg-zinc-900/70 backdrop-blur-xl border border-zinc-800/60 shadow-2xl shadow-black/40',
  outlined: 'bg-transparent border border-zinc-800/80',
  'glow-cyan': 'bg-zinc-900/50 backdrop-blur-xl border border-cyan-500/20 shadow-[0_0_20px_rgba(0,216,246,0.08)]',
  'glow-indigo': 'bg-zinc-900/50 backdrop-blur-xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.08)]',
};

const paddingStyles: Record<string, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  hover = false,
  padding = 'md',
  children,
  header,
  footer,
  className = '',
  ...props
}) => {
  return (
    <motion.div
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={`
        rounded-2xl transition-all duration-250
        ${variantStyles[variant]}
        ${hover ? 'hover:border-zinc-700/80 hover:shadow-lg cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {header && (
        <div className="px-6 py-4 border-b border-zinc-800/60">
          {header}
        </div>
      )}
      <div className={paddingStyles[padding]}>
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 border-t border-zinc-800/60">
          {footer}
        </div>
      )}
    </motion.div>
  );
};
