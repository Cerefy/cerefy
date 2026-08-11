// src/components/ui/Button.tsx
// Enterprise-grade button with Cerefy Obsidian/Cyan identity

import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'cyan-outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-cyan-signal-deep to-cyan-signal hover:from-cyan-signal hover:to-cyan-signal-strong text-dark-text-bright shadow-lg shadow-cyan-signal/20 border border-cyan-signal/30',
  secondary:
    'bg-dark-panel-raised/80 hover:bg-dark-panel-soft/80 text-dark-text-muted border border-dark-border/60 hover:border-dark-border',
  ghost:
    'bg-transparent hover:bg-dark-panel-soft/60 text-dark-muted hover:text-dark-text-muted border border-transparent',
  danger:
    'bg-rose-signal/10 hover:bg-rose-signal/20 text-rose-signal-strong hover:text-rose-signal-soft border border-rose-signal/20 hover:border-rose-signal/30',
  'cyan-outline':
    'bg-transparent hover:bg-cyan-signal/10 text-cyan-signal-strong hover:text-cyan-signal-soft border border-cyan-signal/30 hover:border-cyan-signal/50',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-[10px] gap-1 rounded-md',
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-4 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'px-6 py-3 text-base gap-2.5 rounded-xl',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  children,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed select-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === 'xs' ? 12 : size === 'sm' ? 14 : 16} />
      ) : (
        icon
      )}
      {children}
      {iconRight && !loading && iconRight}
    </motion.button>
  );
};
