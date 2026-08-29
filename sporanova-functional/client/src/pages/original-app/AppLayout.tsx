import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import Logo from "../../components/Logo";
import { useAuth } from "@/_core/hooks/useAuth";

const navItems = [
  { href: "/app/dashboard", label: "Command Center", icon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>
  )},
  { href: "/app/intelligence", label: "Intelligence", icon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.22 4.22l1.42 1.42M12.36 12.36l1.42 1.42M4.22 13.78l1.42-1.42M12.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
  )},
  { href: "/app/decisions", label: "Decisions", icon: <span aria-hidden="true" style={{ fontSize: "1rem" }}>◐</span> },
  { href: "/app/agents", label: "AI Agents", icon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="5" y="7" width="8" height="7" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 7V5.5a2 2 0 014 0V7" stroke="currentColor" strokeWidth="1.3"/><circle cx="7.5" cy="10.5" r="1" fill="currentColor"/><circle cx="10.5" cy="10.5" r="1" fill="currentColor"/></svg>
  )},
  { href: "/app/data", label: "Data", icon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><ellipse cx="9" cy="5" rx="6" ry="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 5v4c0 1.38 2.69 2.5 6 2.5S15 10.38 15 9V5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 9v4c0 1.38 2.69 2.5 6 2.5S15 14.38 15 13V9" stroke="currentColor" strokeWidth="1.3"/></svg>
  )},
  { href: "/app/memory", label: "Memory", icon: <span aria-hidden="true" style={{ fontSize: "1rem" }}>◻</span> },
  { href: "/app/analytics", label: "Analytics", icon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 14l4-5 4 3 4-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="9" r="1.5" fill="currentColor"/><circle cx="10" cy="12" r="1.5" fill="currentColor"/></svg>
  )},
  { href: "/app/analytics-ai", label: "AI Insights", icon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2l1.5 3.5L14 7l-3.5 1.5L9 12 7.5 8.5 4 7l3.5-1.5L9 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M14 12l.75 1.75L16.5 14.5l-1.75.75L14 17l-.75-1.75L11.5 14.5l1.75-.75L14 12z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
  )},
  { href: "/app/playground", label: "Playground", icon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="3" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 8l2 2 2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )},
  { href: "/app/traces", label: "Traces", icon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="13" cy="9" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="7" cy="14" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M6.8 6l3.5 2M6.8 12.5l3.5-2.5" stroke="currentColor" strokeWidth="1.3"/></svg>
  )},
  { href: "/app/automations", label: "Automations", icon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10 3l-1 4h4l-5 8 1-5H5l5-7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
  )},
  { href: "/app/integrations", label: "Integrations", icon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7 3h4v4H7zM7 11h4v4H7zM3 7h4v4H3zM11 7h4v4h-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
  )},
  { href: "/app/developer", label: "Developer", icon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6 5L2 9l4 4M12 5l4 4-4 4M10 3l-2 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )},
  { href: "/app/activity", label: "Activity", icon: <span aria-hidden="true" style={{ fontSize: "1rem" }}>◷</span> },
  { href: "/app/workspace", label: "Workspace", icon: <span aria-hidden="true" style={{ fontSize: "1rem" }}>◈</span> },
  { href: "/app/settings", label: "Settings", icon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M9 2v1.5M9 14.5V16M2 9h1.5M14.5 9H16M3.93 3.93l1.06 1.06M13 13l1.07 1.07M14.07 3.93L13 5M5 13l-1.07 1.07" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
  )},
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const initials = (user?.name || "SN").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="flex h-screen" style={{ background: "#F4F3F0" }}>
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col transition-all duration-300 relative z-20"
        style={{
          width: collapsed ? 64 : 220,
          background: "#FAFAF8",
          borderRight: "1px solid #E8E6E2",
        }}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-sn-100">
          {collapsed ? (
            <Logo size={22} showWordmark={false} />
          ) : (
            <Logo size={22} showWordmark />
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.filter((item) => !["Workspace", "Settings"].includes(item.label)).map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                title={collapsed ? item.label : undefined}
                className="flex items-center gap-3 mx-2 mb-0.5 px-3 py-2.5 rounded-xl transition-all duration-200 group"
                style={{
                  background: active ? "#F0EFF8" : "transparent",
                  color: active ? "#5B6FA8" : "#8C887F",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.background = "#F4F3F0";
                    (e.currentTarget as HTMLAnchorElement).style.color = "#1A1F3C";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    (e.currentTarget as HTMLAnchorElement).style.color = "#8C887F";
                  }
                }}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && (
                  <span className="text-sm font-medium whitespace-nowrap overflow-hidden" style={{ opacity: collapsed ? 0 : 1, transition: "opacity 0.2s" }}>
                    {item.label}
                  </span>
                )}
                {active && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#5B6FA8" }} />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sn-100 p-2">
          {navItems.filter((item) => ["Workspace", "Settings"].includes(item.label)).map((item) => {
            const active = isActive(item.href);
            return <Link key={item.href} to={item.href} title={collapsed ? item.label : undefined} className="mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all" style={{ background: active ? "#F0EFF8" : "transparent", color: active ? "#5B6FA8" : "#8C887F" }}><span style={{ flexShrink: 0 }}>{item.icon}</span>{!collapsed && <span className="whitespace-nowrap">{item.label}</span>}</Link>;
          })}
          <button type="button" onClick={() => { void logout().then(() => window.location.assign("/login")); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all" style={{ color: "#8C887F" }}><span aria-hidden="true" style={{ fontFamily: "monospace", fontSize: "1rem" }}>⊗</span>{!collapsed && "Sign out"}</button>
        </div>
        {!collapsed && <div className="border-t border-sn-100 p-3"><Link to="/app/settings" className="flex items-center gap-2.5 rounded-xl px-2 py-2"><div className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold" style={{ background: "#1A1F3C", color: "#F8F6F2" }}>{initials}</div><div className="min-w-0"><div className="truncate text-xs font-medium">{user?.name || "Enterprise User"}</div><div className="truncate text-[10px]" style={{ color: "#8C887F" }}>{user?.email || ""}</div></div></Link></div>}

        {/* Collapse toggle */}
        <div className="border-t border-sn-100 p-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-xl transition-all duration-200"
            style={{ color: "#B8B4AC" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#F4F3F0"; e.currentTarget.style.color = "#6B6660"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "#B8B4AC"; }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
              style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>
              <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-sn-100 flex"
        style={{ background: "rgba(250,250,248,0.95)", backdropFilter: "blur(20px)" }}>
        {navItems.slice(0, 5).map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
              style={{ color: active ? "#5B6FA8" : "#B8B4AC" }}
            >
              {item.icon}
              <span style={{ fontSize: "0.625rem", fontWeight: 500 }}>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 0 }}>
        {/* Top bar */}
        <div
          className="sticky top-0 z-10 h-14 flex items-center justify-between px-6 border-b border-sn-100"
          style={{ background: "rgba(244,243,240,0.9)", backdropFilter: "blur(12px)" }}
        >
          <div className="md:hidden">
            <Logo size={20} showWordmark />
          </div>
          <div className="hidden md:block" />

          <div className="flex items-center gap-3">
            {/* Search */}
            <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-200"
              style={{ background: "#E8E6E2", color: "#8C887F" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#D4D1CB"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#E8E6E2"; }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2" />
                <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Search
              <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#D4D1CB", color: "#8C887F" }}>⌘K</span>
            </button>

            {/* Notifications */}
            <button className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
              style={{ color: "#8C887F" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#E8E6E2"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2a4.5 4.5 0 014.5 4.5V9l1.5 1.5H2L3.5 9V6.5A4.5 4.5 0 018 2z" stroke="currentColor" strokeWidth="1.2" />
                <path d="M6.5 12a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "#6B7FBF" }} />
            </button>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer"
              style={{ background: "#1A1F3C", color: "#F8F6F2" }}>
              {initials}
            </div>
          </div>
        </div>

        <div className="p-6 pb-24 md:pb-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
