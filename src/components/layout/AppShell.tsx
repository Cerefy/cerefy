import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BarChart3,
  Database,
  Sparkles,
  FileText,
  Users,
  ShoppingBag,
  Megaphone,
  Wallet,
  Package,
  Briefcase,
  Folder,
  Puzzle,
  Bell,
  Settings,
  Menu,
  RefreshCw,
  Plus,
  Rocket,
  Brain,
  Target,
  Workflow,
  Activity,
  Video,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  analytics: BarChart3,
  database: Database,
  auto_awesome: Sparkles,
  description: FileText,
  groups: Users,
  shopping_bag: ShoppingBag,
  campaign: Megaphone,
  account_balance: Wallet,
  inventory_2: Package,
  badge: Briefcase,
  assignment: Briefcase,
  folder: Folder,
  extension: Puzzle,
  notifications: Bell,
  settings: Settings,
  memory: Database,
  history: BarChart3,
  credit_card: Wallet,
  rocket: Rocket,
  brain: Brain,
  target: Target,
  workflow: Workflow,
  activity: Activity,
  video: Video,
  zap: Zap,
};

type NavItem = { to: string; label: string; icon: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
      { to: "/analytics", label: "Analytics", icon: "analytics" },
      { to: "/data-sources", label: "Data Sources", icon: "database" },
      { to: "/ai-copilot", label: "AI Copilot", icon: "auto_awesome" },
      { to: "/reports", label: "Reports", icon: "description" },
    ],
  },
  {
    label: "Business",
    items: [
      { to: "/crm", label: "CRM", icon: "groups" },
      { to: "/sales", label: "Sales", icon: "shopping_bag" },
      { to: "/marketing", label: "Marketing", icon: "campaign" },
      { to: "/finance", label: "Finance", icon: "account_balance" },
      { to: "/inventory", label: "Inventory", icon: "inventory_2" },
      { to: "/hr", label: "HR", icon: "badge" },
      { to: "/projects", label: "Projects", icon: "assignment" },
      { to: "/documents", label: "Documents", icon: "folder" },
    ],
  },
  {
    label: "Platform",
    items: [
      { to: "/integrations", label: "Integrations", icon: "extension" },
      { to: "/notifications", label: "Notifications", icon: "notifications" },
      { to: "/billing", label: "Billing", icon: "credit_card" },
      { to: "/settings", label: "Settings", icon: "settings" },
    ],
  },
];

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="fixed inset-0 top-0 bg-background flex overflow-hidden">
      <nav
        className={`${
          mobileOpen ? "flex" : "hidden"
        } md:flex w-[240px] flex-shrink-0 border-r border-border bg-background flex-col h-full py-6 absolute md:relative z-40 inset-y-0 left-0`}
      >
        <div className="px-6 mb-8 mt-2 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#38BDF8] rounded-sm flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[#003549] text-xl font-bold"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              rocket_launch
            </span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-bold tracking-tight text-white leading-none">Cerefy</h1>
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] leading-none mt-1">
              AI Startup Builder
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="px-3 mb-2 text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(item.to + "/");
                  const Icon = ICONS[item.icon] || FileText;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 py-2.5 px-4 text-sm transition-colors font-medium border-l-2 ${
                        active
                          ? "text-primary border-primary bg-primary/5"
                          : "text-muted-foreground hover:text-white hover:bg-white/[0.03] border-transparent"
                      }`}
                    >
                      <Icon
                        size={18}
                        className={active ? "text-primary" : "text-muted-foreground"}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="px-3 mt-4">
          <div className="flex items-center gap-3 p-3 border-t border-border">
            <div className="w-8 h-8 rounded-sm bg-secondary flex items-center justify-center border border-border">
              <span className="text-[10px] font-mono font-bold text-white">AU</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-xs text-white">Admin User</span>
              <span className="text-muted-foreground text-[10px] font-mono">ID: EX-8921</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        <header className="flex-shrink-0 border-b border-border px-6 md:px-8 py-4 md:py-5 flex items-center justify-between bg-background z-10">
          <div className="flex items-center gap-3">
            <button
              aria-label="Toggle sidebar"
              className="md:hidden w-9 h-9 border border-border rounded-md flex items-center justify-center text-muted-foreground"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <Menu size={16} />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-semibold tracking-tight text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="text-muted-foreground mt-0.5 font-mono text-[10px] uppercase tracking-wider">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {actions ?? (
              <>
                <button
                  aria-label="Refresh"
                  className="bento-card w-9 h-9 hidden sm:flex items-center justify-center rounded-md text-muted-foreground hover:text-white"
                >
                  <RefreshCw size={16} />
                </button>
                <button className="bg-white hover:bg-white/90 text-black px-4 h-9 rounded-md font-semibold text-xs flex items-center gap-2 transition-colors">
                  <Plus size={16} />
                  New
                </button>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-[1400px] mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
