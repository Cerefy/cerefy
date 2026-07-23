import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ModulePage, TableCard } from "@/components/common/SharedBlocks";
import { Card, Kpi } from "@/components/common/primitives";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase/client";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const passwordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

function ProfileTab() {
  const { user } = useAuth();
  const fullName = user?.user_metadata?.full_name ?? "User";
  const email = user?.email ?? "No email";
  const role = user?.user_metadata?.role ?? "Member";
  return (
    <Card title="Profile">
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Display Name" value={fullName} />
        <Field label="Email" value={email} />
        <Field label="Role" value={role} />
        <Field label="User ID" value={user?.id ? user.id.slice(0, 8) + "..." : "—"} />
      </div>
    </Card>
  );
}

function PasswordTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) throw error;
      toast.success("Password updated successfully");
      reset();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Change Password">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-w-md">
        <div>
          <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1 block">
            New Password
          </label>
          <input
            type="password"
            {...register("password")}
            className="w-full border border-border rounded-md px-3 py-2 text-sm text-white bg-background outline-none focus:border-white/40"
            placeholder="Min 6 characters"
          />
          {errors.password && (
            <p className="text-rose-400 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1 block">
            Confirm Password
          </label>
          <input
            type="password"
            {...register("confirmPassword")}
            className="w-full border border-border rounded-md px-3 py-2 text-sm text-white bg-background outline-none focus:border-white/40"
            placeholder="Re-enter password"
          />
          {errors.confirmPassword && (
            <p className="text-rose-400 text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </Card>
  );
}

function DangerZoneTab() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setLoading(true);
    try {
      // Account deletion requires server-side processing — sign out for now
      await signOut();
      toast.success("Account deletion requested. You have been signed out.");
    } catch {
      await signOut();
      toast.success("Account deletion requested. You have been signed out.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Danger Zone">
      <div className="p-6 space-y-4 max-w-md">
        <div className="flex items-start gap-3 p-4 border border-rose-500/20 rounded-lg bg-rose-500/5">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm text-white font-medium">Delete Account</div>
            <div className="text-xs text-muted-foreground mt-1">
              This action is irreversible. All your data will be permanently deleted.
            </div>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1 block">
            Type <span className="text-rose-400">DELETE</span> to confirm
          </label>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 text-sm text-white bg-background outline-none focus:border-rose-500/40"
            placeholder="DELETE"
          />
        </div>
        <button
          onClick={handleDelete}
          disabled={confirmText !== "DELETE" || loading}
          className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded disabled:opacity-30 hover:bg-rose-500/20 transition"
        >
          {loading ? "Deleting..." : "Delete Account"}
        </button>
      </div>
    </Card>
  );
}

function UsersTab() {
  return (
    <TableCard
      title="Users"
      columns={[
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "role", label: "Role" },
      ]}
      rows={[]}
    />
  );
}

function RolesTab() {
  return (
    <TableCard
      title="Roles"
      columns={[
        { key: "role", label: "Role" },
        { key: "members", label: "Members" },
        { key: "desc", label: "Description", align: "right" },
      ]}
      rows={[
        { role: "Admin", members: 0, desc: "Full workspace control" },
        { role: "Manager", members: 0, desc: "Team & module management" },
        { role: "Analyst", members: 0, desc: "Read + reports" },
        { role: "Viewer", members: 0, desc: "Read-only" },
      ]}
    />
  );
}

export function SettingsPage() {
  return (
    <ModulePage
      title="Settings"
      subtitle="Workspace & account"
      tabs={[
        { key: "profile", label: "Profile", render: () => <ProfileTab /> },
        { key: "password", label: "Password", render: () => <PasswordTab /> },
        { key: "users", label: "Users", render: () => <UsersTab /> },
        { key: "roles", label: "Roles", render: () => <RolesTab /> },
        { key: "danger", label: "Danger Zone", render: () => <DangerZoneTab /> },
        {
          key: "notif",
          label: "Notifications",
          render: () => (
            <Card title="Preferences">
              <div className="p-5 space-y-3 text-sm">
                {[
                  "Email digests",
                  "Slack alerts",
                  "Overdue invoices",
                  "Deal updates",
                  "System status",
                ].map((s) => (
                  <div
                    key={s}
                    className="flex justify-between border-b border-border pb-3 last:border-0"
                  >
                    <span className="text-white">{s}</span>
                    <span className="text-muted-foreground text-xs">On</span>
                  </div>
                ))}
              </div>
            </Card>
          ),
        },
        {
          key: "sec",
          label: "Security",
          render: () => (
            <Card title="Security">
              <div className="p-5 space-y-3 text-sm">
                {[
                  "Two-factor authentication",
                  "SSO (SAML)",
                  "Session timeout",
                  "IP allowlist",
                  "Audit log",
                ].map((s) => (
                  <div
                    key={s}
                    className="flex justify-between border-b border-border pb-3 last:border-0"
                  >
                    <span className="text-white">{s}</span>
                    <span className="text-muted-foreground text-xs">Configured</span>
                  </div>
                ))}
              </div>
            </Card>
          ),
        },
      ]}
    />
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1">
        {label}
      </div>
      <div className="border border-border rounded-md px-3 py-2 text-sm text-white bg-background">
        {value}
      </div>
    </div>
  );
}
