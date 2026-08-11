import React from 'react';
import { NavLink } from 'react-router-dom';

/* ============================================================
   MATERIAL SYMBOLS ICON
   ============================================================ */

export const MsIcon: React.FC<{
  name: string;
  className?: string;
  fill?: boolean;
  size?: number;
}> = ({ name, className = '', fill = false, size }) => (
  <span
    className={`material-symbols-outlined ${fill ? 'ms-fill' : ''} ${className}`}
    style={size ? { fontSize: size } : undefined}
    aria-hidden="true"
  >
    {name}
  </span>
);

/* ============================================================
   SURFACE PRIMITIVES
   ============================================================ */

export const GlassPanel: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <div className={`glass-panel ${className}`} {...rest}>
    {children}
  </div>
);

export const BentoCard: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <div className={`bento-card ${className}`} {...rest}>
    {children}
  </div>
);

/* ============================================================
   BUTTONS
   ============================================================ */

interface KinButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline';
  icon?: string;
  iconRight?: string;
}

export const KinButton: React.FC<KinButtonProps> = ({
  variant = 'ghost',
  icon,
  iconRight,
  className = '',
  children,
  ...rest
}) => {
  const base = 'inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98] font-medium';
  const variants = {
    primary: 'bg-on-surface text-surface hover:bg-inverse-surface rounded-lg shadow-sm px-4 py-2 text-sm',
    ghost: 'border border-outline-variant/50 text-on-surface hover:bg-surface-container-low rounded-lg px-4 py-2 text-sm',
    outline: 'border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container rounded-lg px-4 py-2 text-sm',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {icon && <MsIcon name={icon} fill={variant === 'primary'} size={18} />}
      {children}
      {iconRight && <MsIcon name={iconRight} fill={variant === 'primary'} size={16} />}
    </button>
  );
};

/* ============================================================
   STATUS / BADGES
   ============================================================ */

export const StatusDot: React.FC<{ color?: string; pulse?: boolean; className?: string }> = ({
  color = 'bg-tertiary',
  pulse = false,
  className = '',
}) => (
  <span className={`relative inline-flex h-2.5 w-2.5 ${className}`}>
    {pulse && (
      <span
        className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-40 animate-ping`}
      />
    )}
    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
  </span>
);

export const StatusPill: React.FC<{
  label: string;
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'dark';
  className?: string;
}> = ({ label, variant = 'neutral', className = '' }) => {
  const styles = {
    neutral: 'bg-surface-container-high text-on-surface',
    success: 'bg-tertiary-container text-on-tertiary-container',
    warning: 'bg-secondary-container/50 text-on-secondary-container',
    error: 'bg-error-container text-on-error-container',
    dark: 'bg-on-surface text-surface-container-lowest',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 font-label text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${styles[variant]} ${className}`}
    >
      {label}
    </span>
  );
};

export const Tag: React.FC<{ label: string; className?: string }> = ({ label, className = '' }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded bg-surface-container border border-outline-variant/20 font-label text-[10px] uppercase tracking-wider text-on-surface-variant ${className}`}
  >
    {label}
  </span>
);

/* ============================================================
   SIDE NAV â€” EXECUTIVE SHELL
   ============================================================ */

export interface NavItem {
  path: string;
  label: string;
  icon: string;
  end?: boolean;
}

interface SideNavProps {
  brand: string;
  tagline?: string;
  items: NavItem[];
  footerItems?: NavItem[];
  ctaLabel?: string;
  onCta?: () => void;
  logo?: React.ReactNode;
}

export const SideNav: React.FC<SideNavProps> = ({
  brand,
  tagline = 'Enterprise Node 01',
  items,
  footerItems = [],
  ctaLabel = 'New Agent',
  onCta,
  logo,
}) => {
  return (
    <nav className="h-screen w-64 fixed start-0 top-0 bg-surface-container-lowest border-e border-outline-variant/50 flex flex-col p-4 gap-2 z-50 hidden md:flex">
      {/* Header */}
      <div className="mb-8 px-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-surface-container-high">
          {logo || <span className="font-headline font-bold text-on-surface">C</span>}
        </div>
        <div>
          <h1 className="text-lg font-bold text-on-surface font-headline leading-tight">{brand}</h1>
          <p className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest">
            {tagline}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 flex flex-col gap-1">
        {items.map((item) => (
          <LinkItem key={item.path} item={item} />
        ))}
      </div>

      {/* CTA */}
      {ctaLabel && (
        <button
          onClick={onCta}
          className="w-full bg-on-surface text-surface py-3 rounded-lg font-label text-[14px] uppercase tracking-widest mb-4 hover:bg-inverse-surface transition-colors flex items-center justify-center gap-2"
        >
          <MsIcon name="add" size={18} fill />
          {ctaLabel}
        </button>
      )}

      {/* Footer Links */}
      {footerItems.length > 0 && (
        <div className="flex flex-col gap-1 mt-auto pt-4 border-t border-outline-variant/20">
          {footerItems.map((item) => (
            <LinkItem key={item.path} item={item} />
          ))}
        </div>
      )}
    </nav>
  );
};

const LinkItem: React.FC<{ item: NavItem }> = ({ item }) => (
  <NavLink
    to={item.path}
    end={item.end}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-lg font-label text-[14px] uppercase tracking-widest transition-all ${
        isActive
          ? 'bg-secondary-container text-on-secondary-container shadow-sm'
          : 'text-on-surface-variant hover:bg-surface-container-high'
      }`
    }
  >
    <MsIcon name={item.icon} />
    <span>{item.label}</span>
  </NavLink>
);

/* ============================================================
   TOP BAR
   ============================================================ */

interface TopBarProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({ left, right }) => (
  <header className="fixed top-0 end-0 start-64 z-40 hidden md:flex bg-surface-container-lowest/70 backdrop-blur-md border-b border-outline-variant/30 justify-between items-center px-6 h-14">
    <div className="flex items-center gap-4 text-on-surface-variant flex-1">{left}</div>
    <div className="flex items-center gap-4">{right}</div>
  </header>
);

/* ============================================================
   PAGE HEADER
   ============================================================ */

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
  <div className="flex justify-between items-end mb-4 flex-wrap gap-4">
    <div>
      <h2 className="font-headline text-[28px] md:text-[32px] font-semibold tracking-tight text-on-surface leading-[1.3] mb-1">
        {title}
      </h2>
      {subtitle && <p className="text-on-surface-variant text-[16px] font-body">{subtitle}</p>}
    </div>
    {actions && <div className="flex gap-3 flex-wrap">{actions}</div>}
  </div>
);

/* ============================================================
   METRIC CARD
   ============================================================ */

interface MetricCardProps {
  label: string;
  value: string;
  delta?: { text: string; tone?: 'positive' | 'neutral' };
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, delta, className = '' }) => (
  <div className={`bento-card rounded-xl p-6 flex flex-col relative overflow-hidden ${className}`}>
    <div className="absolute -end-12 -top-12 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
    <span className="text-on-surface-variant font-label text-[12px] uppercase tracking-widest mb-4">
      {label}
    </span>
    <div className="flex items-baseline gap-2 mt-auto flex-wrap">
      <span className="font-display text-[36px] md:text-[40px] font-bold tracking-tight text-on-surface leading-none">
        {value}
      </span>
      {delta && (
        <span
          className={`text-[12px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
            delta.tone === 'positive'
              ? 'text-tertiary bg-tertiary-container'
              : 'text-on-surface-variant bg-surface-container-high'
          }`}
        >
          <MsIcon name="trending_up" size={14} />
          {delta.text}
        </span>
      )}
    </div>
  </div>
);

/* ============================================================
   PROGRESS BAR
   ============================================================ */

export const ProgressBar: React.FC<{
  value: number;
  className?: string;
  fillClassName?: string;
}> = ({ value, className = '', fillClassName = '' }) => (
  <div className={`h-2 w-full bg-surface-container-high rounded-full overflow-hidden ${className}`}>
    <div
      className={`h-full bg-on-surface rounded-full transition-all duration-1000 ${fillClassName}`}
      style={{ width: `${value}%` }}
    />
  </div>
);
