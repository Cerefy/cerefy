import { useWorkspace } from "@/contexts/WorkspaceContext";
import { trpc } from "@/lib/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { FormEvent, useState } from "react";

type AuditList = inferRouterOutputs<AppRouter>["audit"]["list"];

const sections = ["Profile", "Workspace", "Notifications", "AI Preferences", "Security"] as const;
type Section = typeof sections[number];

export default function Settings() {
  const { workspaceId, workspace } = useWorkspace();
  const [section, setSection] = useState<Section>("Profile");
  const settings = trpc.preferences.get.useQuery({ workspaceId: workspaceId ?? 0 }, { enabled: Boolean(workspaceId) });
  const audit = trpc.audit.list.useQuery(
    { workspaceId: workspaceId ?? 0, page: 1, pageSize: 100 },
    { enabled: Boolean(workspaceId) && section === "Security" },
  );
  const profileUpdate = trpc.preferences.updateProfile.useMutation({ onSuccess: () => settings.refetch() });
  const preferenceUpdate = trpc.preferences.update.useMutation({ onSuccess: () => settings.refetch() });
  const logout = trpc.auth.logout.useMutation({ onSuccess: () => window.location.assign("/login") });
  const preferences = settings.data?.preferences;
  const profile = settings.data?.profile;
  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    profileUpdate.mutate({ name: String(data.get("name")), jobTitle: String(data.get("jobTitle") || "") || null });
  };
  type PreferenceChanges = Omit<Parameters<typeof preferenceUpdate.mutate>[0], "workspaceId">;
  const update = (changes: PreferenceChanges) => workspaceId && preferenceUpdate.mutate({ workspaceId, ...changes });
  const downloadAudit = () => {
    if (!audit.data?.items.length) return;
    const blob = new Blob([JSON.stringify(audit.data.items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${workspace?.workspace.name || "workspace"}-audit-log.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return <div className="animate-in fade-in duration-300">
    <div className="mb-6"><p className="sn-label mb-1">Account Settings</p><h1 className="text-xl font-medium">Settings</h1></div>
    <div className="grid gap-6 md:grid-cols-[11rem_minmax(0,1fr)]">
      <nav className="flex gap-1 overflow-auto md:flex-col">
        {sections.map(item => <button key={item} onClick={() => setSection(item)} className={`shrink-0 rounded-xl px-3 py-2.5 text-left text-sm transition ${section === item ? "bg-[#F0EFF8] font-medium text-[#5B6FA8]" : "text-[#8C887F] hover:bg-[#F4F3F0]"}`}>{item}</button>)}
      </nav>
      <section className="min-w-0">
        {section === "Profile" && <form onSubmit={saveProfile} className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-6"><p className="sn-label">Personal Information</p><div className="mt-5 flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#1A1F3C] text-xl font-semibold text-[#F8F6F2]">{profile?.name?.[0]?.toUpperCase() || "S"}</div><div><p className="text-sm font-medium">{profile?.email || ""}</p><p className="mt-1 text-xs text-[#8C887F]">Identity is managed securely by the sign-in provider.</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Full name" name="name" defaultValue={profile?.name || ""} required /><Field label="Title" name="jobTitle" defaultValue={profile?.jobTitle || ""} /></div><button disabled={profileUpdate.isPending} className="mt-5 rounded-xl bg-[#1A1F3C] px-4 py-2.5 text-sm font-medium text-[#F8F6F2]">{profileUpdate.isPending ? "Saving…" : "Save Changes"}</button>{profileUpdate.error && <p className="mt-2 text-sm text-[#B8675A]">{profileUpdate.error.message}</p>}</form>}
        {section === "Workspace" && <div className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-6"><p className="sn-label">Workspace</p><h2 className="mt-2 text-lg font-medium">{workspace?.workspace.name}</h2><p className="mt-2 text-sm text-[#8C887F]">Your membership role is <strong className="text-[#1A1F3C] capitalize">{workspace?.role}</strong>. Workspace, team and security administration are authorized server-side and can be extended from this settings area.</p></div>}
        {section === "Notifications" && <div className="space-y-4"><SettingGroup title="Notification Channels" items={[{ key: "emailNotifications", label: "Email notifications", description: "Receive workspace updates by email", value: preferences?.emailNotifications ?? true }, { key: "weeklyDigest", label: "Weekly digest", description: "Receive the weekly workspace summary", value: preferences?.weeklyDigest ?? true }]} onChange={(key, value) => update({ [key]: value })} /><SettingGroup title="Alert Types" items={[{ key: "agentNotifications", label: "AI Agent completions", description: "Receive agent run updates", value: preferences?.agentNotifications ?? true }, { key: "anomalyNotifications", label: "Anomaly detections", description: "Receive intelligence signal alerts", value: preferences?.anomalyNotifications ?? true }, { key: "reportNotifications", label: "Report delivery", description: "Receive generated report updates", value: preferences?.reportNotifications ?? false }]} onChange={(key, value) => update({ [key]: value })} /></div>}
        {section === "AI Preferences" && <div className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-6"><p className="sn-label">Intelligence Configuration</p><div className="mt-5 space-y-4"><ToggleRow label="Extended context window" description="Include more persisted conversation history" value={preferences?.extendedContextWindow ?? true} onChange={value => update({ extendedContextWindow: value })} /><ToggleRow label="Always cite sources" description="Show the source inventory for responses" value={preferences?.citeSources ?? true} onChange={value => update({ citeSources: value })} /><ToggleRow label="Proactive insights" description="Store a preference for future proactive workflows" value={preferences?.proactiveInsights ?? false} onChange={value => update({ proactiveInsights: value })} /></div><div className="mt-6"><p className="text-sm font-medium">Response tone</p><div className="mt-3 flex flex-wrap gap-2">{(["concise", "professional", "detailed"] as const).map(tone => <button key={tone} onClick={() => update({ responseTone: tone })} className={`rounded-xl px-4 py-2 text-sm capitalize ${preferences?.responseTone === tone ? "bg-[#1A1F3C] text-[#F8F6F2]" : "bg-[#F4F3F0] text-[#6B6660]"}`}>{tone}</button>)}</div></div></div>}
        {section === "Security" && <SecurityPanel audit={audit} logout={logout} onDownload={downloadAudit} />}
      </section>
    </div>
  </div>;
}

function Field({ label, ...props }: { label: string; name: string; defaultValue?: string; required?: boolean }) { return <label className="sn-label">{label}<input {...props} className="mt-2 w-full rounded-xl bg-[#F4F3F0] px-3 py-2.5 text-sm font-normal outline-none ring-1 ring-transparent focus:ring-[#6B7FBF]" /></label>; }
function ToggleRow({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (value: boolean) => void }) { return <div className="flex items-center justify-between border-b border-[#F4F3F0] py-3 last:border-0"><div><p className="text-sm font-medium">{label}</p><p className="mt-1 text-xs text-[#8C887F]">{description}</p></div><button type="button" onClick={() => onChange(!value)} aria-label={label} aria-pressed={value} className={`relative h-5 w-9 rounded-full transition ${value ? "bg-[#5B6FA8]" : "bg-[#D4D1CB]"}`}><span className={`absolute top-[3px] h-3.5 w-3.5 rounded-full bg-white shadow transition ${value ? "left-[19px]" : "left-[3px]"}`} /></button></div>; }
function SettingGroup({ title, items, onChange }: { title: string; items: Array<{ key: string; label: string; description: string; value: boolean }>; onChange: (key: string, value: boolean) => void }) { return <div className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-6"><p className="sn-label mb-2">{title}</p>{items.map(item => <ToggleRow key={item.key} label={item.label} description={item.description} value={item.value} onChange={value => onChange(item.key, value)} />)}</div>; }

function SecurityPanel({ audit, logout, onDownload }: { audit: { data?: AuditList; isLoading: boolean; error: { message: string } | null }; logout: { mutate: () => void; isPending: boolean }; onDownload: () => void }) {
  return <div className="space-y-4">
    <section className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-6"><p className="sn-label">Authentication</p><div className="mt-5 space-y-4"><SecurityStatus label="Password authentication" detail="Enabled for this account" /><SecurityStatus label="HttpOnly session cookie" detail="Active for the current sign-in" /><SecurityStatus label="Workspace authorization" detail="Membership and role checks run on the server" /></div><div className="mt-5 border-t border-[#E8E6E2] pt-4"><button type="button" onClick={() => logout.mutate()} disabled={logout.isPending} className="rounded-xl border border-[#E8E6E2] px-4 py-2 text-sm text-[#1A1F3C]">{logout.isPending ? "Signing out…" : "Sign out current session"}</button></div></section>
    <section className="rounded-2xl border border-[#E8E6E2] bg-[#FAFAF8] p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="sn-label">Audit Log</p><h2 className="mt-2 text-lg font-medium" style={{ fontFamily: "'Instrument Serif', serif", color: "#1A1F3C" }}>Workspace activity history</h2></div><button type="button" onClick={onDownload} disabled={!audit.data?.items.length || audit.isLoading} className="rounded-xl border border-[#E8E6E2] px-4 py-2 text-sm text-[#1A1F3C] disabled:cursor-not-allowed disabled:text-[#B8B4AC]">Download Audit Log</button></div><p className="mt-2 text-sm leading-relaxed text-[#6B6660]">Sensitive workspace actions are retained in the server-side audit log.</p>{audit.isLoading && <p className="mt-5 text-sm text-[#8C887F]">Loading audit events…</p>}{audit.error && <p className="mt-5 text-sm text-[#B8675A]">{audit.error.message}</p>}{audit.data?.items.length ? <div className="mt-5 space-y-2">{audit.data.items.slice(0, 6).map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F4F3F0] px-3 py-2.5"><div><p className="text-sm font-medium text-[#1A1F3C]">{item.action}</p><p className="mt-0.5 text-xs text-[#8C887F]">{item.resourceType}{item.resourceId ? ` · ${item.resourceId}` : ""}</p></div><time className="text-xs text-[#8C887F]">{new Date(item.createdAt).toLocaleString()}</time></div>)}</div> : !audit.isLoading && !audit.error && <p className="mt-5 text-sm text-[#8C887F]">No audit events are available for this workspace.</p>}</section>
  </div>;
}

function SecurityStatus({ label, detail }: { label: string; detail: string }) { return <div className="flex items-start justify-between gap-4 border-b border-[#F4F3F0] py-3 last:border-0"><div><p className="text-sm font-medium text-[#1A1F3C]">{label}</p><p className="mt-1 text-xs text-[#8C887F]">{detail}</p></div><span className="rounded-full bg-[#EEF6F6] px-2 py-0.5 text-[11px] font-medium text-[#4A8B8C]">Active</span></div>; }
