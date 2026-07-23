import { useState, type ReactNode } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  Rocket,
  LineChart,
  Sparkles,
  Clock,
  Zap,
  Pin,
  FileText,
  MessageSquare,
  Folder,
  Tag,
  Search,
  Table,
  Eye,
  User,
  TrendingDown,
  Activity,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Package,
  Calendar,
  ShoppingBag,
  Receipt,
  Award,
  UserPlus,
  MousePointerClick,
  GitBranch,
  Briefcase,
  Smile,
  Gem,
  Ban,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  payments: DollarSign,
  trending_up: TrendingUp,
  groups: Users,
  rocket_launch: Rocket,
  show_chart: LineChart,
  auto_awesome: Sparkles,
  history: Clock,
  bolt: Zap,
  push_pin: Pin,
  description: FileText,
  chat: MessageSquare,
  folder: Folder,
  sell: Tag,
  search: Search,
  table_rows: Table,
  visibility: Eye,
  person: User,
  schedule: Clock,
  call_missed: TrendingDown,
  activity: Activity,
  bar_chart: BarChart3,
  warning: AlertTriangle,
  check_circle: CheckCircle,
  package: Package,
  inventory_2: Package,
  event: Calendar,
  shopping_bag: ShoppingBag,
  receipt: Receipt,
  emoji_events: Award,
  person_add: UserPlus,
  ads_click: MousePointerClick,
  conversion_path: GitBranch,
  workspace_premium: Award,
  work: Briefcase,
  sentiment_satisfied: Smile,
  diamond: Gem,
  block: Ban,
  savings: DollarSign,
};

export function Kpi({
  label,
  value,
  delta,
  icon,
  hint,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: string;
  hint?: string;
}) {
  const positive = delta?.startsWith("+");
  const Icon = ICONS[icon] || FileText;
  return (
    <div className="bento-card rounded-lg p-5 flex flex-col justify-between h-[120px]">
      <div className="flex justify-between items-start">
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <Icon size={18} className="text-muted-foreground" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-white">{value}</span>
        {delta && (
          <span
            className={`text-[10px] font-mono ${
              positive ? "text-emerald-400" : "text-rose-400"
            } opacity-80`}
          >
            {delta}
          </span>
        )}
        {hint && <span className="text-muted-foreground text-[10px] font-mono">{hint}</span>}
      </div>
    </div>
  );
}

export function Card({
  title,
  icon,
  action,
  children,
  className = "",
}: {
  title: string;
  icon?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const Icon = icon ? ICONS[icon] || null : null;
  return (
    <div className={`bento-card rounded-lg flex flex-col overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-secondary/40">
        <h2 className="font-medium text-sm text-white flex items-center gap-2">
          {Icon && <Icon size={16} className="text-muted-foreground" />}
          {title}
        </h2>
        {action}
      </div>
      <div className="flex-1 bg-background">{children}</div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T = any>({
  columns,
  rows,
  onRowClick,
}: {
  columns: {
    key: string;
    label: string;
    align?: "left" | "right";
    render?: (row: T) => ReactNode;
  }[];
  rows: T[];
  onRowClick?: (row: T) => void;
}) {
  return (
    <div className="w-full">
      <div
        className="grid gap-4 px-5 py-3 border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-wider bg-background"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((c) => (
          <div key={String(c.key)} className={c.align === "right" ? "text-right" : ""}>
            {c.label}
          </div>
        ))}
      </div>
      <div>
        {rows.map((row, i) => (
          <div
            key={i}
            onClick={() => onRowClick?.(row)}
            className={`grid gap-4 px-5 py-3 border-b border-border items-center transition-colors text-xs ${
              onRowClick ? "cursor-pointer hover:bg-secondary/40" : ""
            }`}
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
          >
            {columns.map((c) => (
              <div
                key={String(c.key)}
                className={`${c.align === "right" ? "text-right font-mono text-muted-foreground" : "text-white truncate"}`}
              >
                {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="border-b border-border mb-6 flex gap-1 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
            active === t.key
              ? "text-white border-white"
              : "text-muted-foreground border-transparent hover:text-white"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warn" | "danger" | "info";
}) {
  const map: Record<string, string> = {
    neutral: "bg-white/5 text-white border-border",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warn: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    info: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  };
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-mono border ${map[tone]}`}
    >
      {children}
    </span>
  );
}

export function useTabs(initial: string) {
  return useState(initial);
}

export function Sparkline({ points, positive = true }: { points: number[]; positive?: boolean }) {
  const w = 120;
  const h = 32;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${i * step},${h - ((p - min) / range) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={d} fill="none" stroke={positive ? "#34d399" : "#fb7185"} strokeWidth={1.5} />
    </svg>
  );
}

export function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2 h-40 px-5 py-5">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full flex items-end h-full">
            <div
              className="w-full bg-white/80 hover:bg-white transition-colors rounded-sm"
              style={{ height: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="text-[9px] font-mono text-muted-foreground uppercase">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
