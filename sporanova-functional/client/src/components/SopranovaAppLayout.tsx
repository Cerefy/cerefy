import { useAuth } from "@/_core/hooks/useAuth";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { trpc } from "@/lib/trpc";
import { Bell, Bot, ChevronDown, Database, LayoutDashboard, LogOut, Menu, Search, Settings, Sparkles, Workflow, BarChart3, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";

const navigation = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/intelligence", label: "Intelligence", icon: Sparkles },
  { href: "/app/agents", label: "AI Agents", icon: Bot },
  { href: "/app/data", label: "Data", icon: Database },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/automations", label: "Automations", icon: Workflow },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function SopranovaAppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { workspace, workspaceId, workspaces, selectWorkspace, loading } = useWorkspace();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationList = trpc.notifications.list.useQuery({ workspaceId: workspaceId ?? 0, unreadOnly: false, limit: 10 }, { enabled: Boolean(workspaceId) });
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => notificationList.refetch() });
  const unreadCount = notificationList.data?.filter(notification => !notification.readAt).length ?? 0;
  const initials = user?.name?.split(" ").map(value => value[0]).join("").slice(0, 2).toUpperCase() || "SN";

  if (loading || !workspace) {
    return <div className="min-h-screen bg-[#F4F3F0] grid place-items-center text-sm text-[#8C887F]">Preparing your secure workspace…</div>;
  }

  return (
    <div className="min-h-screen bg-[#F4F3F0] text-[#1A1F3C]">
      {mobileOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-[#1A1F3C]/25 md:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[#E8E6E2] bg-[#FAFAF8] transition-transform duration-200 md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-14 items-center justify-between border-b border-[#E8E6E2] px-5">
          <Link to="/app/dashboard" className="font-semibold tracking-[0.18em] text-[#1A1F3C]">SOPRANOVA</Link>
          <button className="rounded-lg p-1.5 text-[#8C887F] md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <nav className="flex-1 space-y-1 p-3" aria-label="Primary navigation">
          {navigation.map(item => {
            const active = location.pathname === item.href;
            const Icon = item.icon;
            return <Link key={item.href} to={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-[#F0EFF8] text-[#5B6FA8]" : "text-[#8C887F] hover:bg-[#F4F3F0] hover:text-[#1A1F3C]"}`}><Icon size={18} />{item.label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#5B6FA8]" />}</Link>;
          })}
        </nav>
        <div className="border-t border-[#E8E6E2] p-3">
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#8C887F] transition hover:bg-[#F4F3F0] hover:text-[#1A1F3C]"><LogOut size={17} />Sign out</button>
        </div>
      </aside>

      <main className="min-h-screen md:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#E8E6E2] bg-[#F4F3F0]/90 px-4 backdrop-blur md:px-6">
          <button className="rounded-lg p-2 text-[#6B6660] md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={19} /></button>
          <div className="hidden md:flex items-center gap-2 rounded-lg bg-[#E8E6E2] px-3 py-1.5 text-xs text-[#8C887F]"><Search size={14} />Search<span className="ml-4 rounded bg-[#D4D1CB] px-1.5 py-0.5 text-[10px]">⌘K</span></div>
          <div className="ml-auto flex items-center gap-3">
            <label className="hidden sm:flex items-center gap-1.5 text-xs text-[#6B6660]" aria-label="Select workspace">
              <select className="max-w-40 appearance-none bg-transparent pr-1 font-medium outline-none" value={workspace.workspace.id} onChange={event => selectWorkspace(Number(event.target.value))}>
                {workspaces.map(item => <option key={item.workspace.id} value={item.workspace.id}>{item.workspace.name}</option>)}
              </select><ChevronDown size={13} />
            </label>
            <div className="relative">
              <button aria-label="Notifications" onClick={() => setNotificationsOpen(open => !open)} className="relative rounded-lg p-2 text-[#8C887F] transition hover:bg-[#E8E6E2] hover:text-[#1A1F3C]"><Bell size={17} />{unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#6B7FBF]" />}</button>
              {notificationsOpen && <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] shadow-xl shadow-[#1A1F3C]/10">
                <div className="border-b border-[#E8E6E2] px-4 py-3 text-xs font-semibold uppercase tracking-[0.13em] text-[#8C887F]">Notifications</div>
                <div className="max-h-80 overflow-auto">{notificationList.data?.length ? notificationList.data.map(notification => <button key={notification.id} onClick={() => !notification.readAt && markRead.mutate({ workspaceId: workspace.workspace.id, notificationId: notification.id })} className={`block w-full border-b border-[#F4F3F0] px-4 py-3 text-left transition hover:bg-[#F4F3F0] ${notification.readAt ? "opacity-65" : ""}`}><p className="text-sm font-medium">{notification.title}</p><p className="mt-1 text-xs leading-relaxed text-[#8C887F]">{notification.content}</p></button>) : <p className="px-4 py-8 text-center text-sm text-[#8C887F]">No notifications yet.</p>}</div>
              </div>}
            </div>
            <Link to="/app/settings" aria-label="Open profile settings" className="grid h-8 w-8 place-items-center rounded-full bg-[#1A1F3C] text-xs font-semibold text-[#F8F6F2]">{initials}</Link>
          </div>
        </header>
        <div className="mx-auto max-w-7xl p-4 pb-24 md:p-6">{children}</div>
      </main>
    </div>
  );
}
