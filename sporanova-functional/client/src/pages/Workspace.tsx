import { useWorkspace } from "@/contexts/WorkspaceContext";
import { trpc } from "@/lib/trpc";
import { Users, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

type Tab = "members" | "teams" | "roles";

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

const roleColor: Record<string, { bg: string; color: string }> = {
  owner: { bg: "#1A1F3C", color: "#F8F6F2" },
  admin: { bg: "#F0EFF8", color: "#5B6FA8" },
  member: { bg: "#EEF6F6", color: "#4A8B8C" },
  viewer: { bg: "#F4F3F0", color: "#8C887F" },
};

function initials(name: string | null, email: string | null) {
  const value = name?.trim() || email?.split("@")[0] || "User";
  return value.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
}

export default function Workspace() {
  const { workspaceId, workspace } = useWorkspace();
  const [tab, setTab] = useState<Tab>("members");
  const members = trpc.workspaces.members.useQuery({ workspaceId: workspaceId ?? 0 }, { enabled: Boolean(workspaceId) });
  const rows = members.data ?? [];
  const roleSummary = useMemo(() => Object.entries(rows.reduce<Record<string, number>>((summary, member) => {
    summary[member.role] = (summary[member.role] ?? 0) + 1;
    return summary;
  }, {})), [rows]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="sn-label mb-1">Workspace</div>
          <h1 className="text-xl font-medium" style={{ fontFamily: "'Instrument Serif', serif", color: "#1A1F3C" }}>Workspace Management</h1>
          <p className="mt-1 text-sm" style={{ color: "#8C887F" }}>{workspace?.workspace.name || "Current workspace"}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium" style={{ background: "#F0EFF8", color: "#5B6FA8" }}>
          <ShieldCheck size={15} /> {roleLabels[workspace?.role || "member"] || "Member"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Members", value: members.isLoading ? "—" : String(rows.length) },
          { label: "Active Members", value: members.isLoading ? "—" : String(rows.filter(member => member.isActive).length) },
          { label: "Roles in Use", value: members.isLoading ? "—" : String(roleSummary.length) },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl border p-5 text-center" style={{ background: "#FAFAF8", borderColor: "#E8E6E2" }}>
            <div className="mb-1 text-2xl font-medium" style={{ color: "#1A1F3C" }}>{stat.value}</div>
            <div className="sn-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="inline-flex rounded-xl p-1" style={{ background: "#E8E6E2" }}>
        {(["members", "teams", "roles"] as const).map(value => (
          <button key={value} onClick={() => setTab(value)} className="rounded-lg px-4 py-1.5 text-xs font-medium capitalize transition-colors" style={{ background: tab === value ? "#FAFAF8" : "transparent", color: tab === value ? "#1A1F3C" : "#8C887F", boxShadow: tab === value ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
            {value}
          </button>
        ))}
      </div>

      {tab === "members" && (
        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "#E8E6E2" }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F4F3F0", borderBottom: "1px solid #E8E6E2" }}>
                {["Member", "Role", "Joined", "Status"].map(label => <th key={label} className="px-5 py-3 text-left sn-label" style={{ fontWeight: 500 }}>{label}</th>)}
              </tr>
            </thead>
            <tbody style={{ background: "#FAFAF8" }}>
              {members.isLoading ? <tr><td colSpan={4} className="px-5 py-12 text-center text-sm" style={{ color: "#8C887F" }}>Loading workspace members…</td></tr> : members.error ? <tr><td colSpan={4} className="px-5 py-12 text-center text-sm" style={{ color: "#B8675A" }}>{members.error.message}</td></tr> : rows.length === 0 ? <tr><td colSpan={4} className="px-5 py-12 text-center text-sm" style={{ color: "#8C887F" }}>No active members found in this workspace.</td></tr> : rows.map((member, index) => {
                const colors = roleColor[member.role] ?? roleColor.member;
                return <tr key={member.userId} className="transition-colors" style={{ borderTop: index > 0 ? "1px solid #F4F3F0" : undefined }} onMouseEnter={event => { event.currentTarget.style.background = "#F4F3F0"; }} onMouseLeave={event => { event.currentTarget.style.background = "transparent"; }}>
                  <td className="px-5 py-3.5"><div className="flex items-center gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold" style={{ background: "#E8E6E2", color: "#6B6660" }}>{initials(member.name, member.email)}</div><div><p className="text-sm font-medium" style={{ color: "#1A1F3C" }}>{member.name || member.email || "Workspace member"}</p><p className="text-xs" style={{ color: "#B8B4AC" }}>{member.email || ""}</p></div></div></td>
                  <td className="px-5 py-3.5"><span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: colors.bg, color: colors.color }}>{roleLabels[member.role] || member.role}</span></td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "#6B6660" }}>{new Date(member.joinedAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5"><div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full" style={{ background: member.isActive ? "#4A8B8C" : "#B8B4AC" }} /><span className="text-xs" style={{ color: "#8C887F" }}>{member.isActive ? "Active" : "Inactive"}</span></div></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "teams" && <div className="rounded-2xl border border-dashed p-12 text-center" style={{ background: "#FAFAF8", borderColor: "#D4D1CB" }}><Users className="mx-auto mb-3" style={{ color: "#B8B4AC" }} /><p className="text-sm font-medium" style={{ color: "#1A1F3C" }}>Teams are not configured</p><p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed" style={{ color: "#8C887F" }}>The current workspace model supports members and roles. Team assignments will appear here when enabled for this workspace.</p></div>}

      {tab === "roles" && <div className="space-y-3">{roleSummary.length ? roleSummary.map(([role, count]) => { const colors = roleColor[role] ?? roleColor.member; return <div key={role} className="flex items-center gap-4 rounded-2xl border p-5" style={{ background: "#FAFAF8", borderColor: "#E8E6E2" }}><span className="w-24 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-medium" style={{ background: colors.bg, color: colors.color }}>{roleLabels[role] || role}</span><p className="flex-1 text-sm" style={{ color: "#6B6660" }}>Workspace access granted through the {roleLabels[role] || role} role.</p><span className="shrink-0 text-xs" style={{ color: "#B8B4AC" }}>{count} member{count === 1 ? "" : "s"}</span></div>; }) : <div className="rounded-2xl border border-dashed p-12 text-center text-sm" style={{ color: "#8C887F" }}>Role information will appear when workspace members are available.</div>}</div>}
    </div>
  );
}
