import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type WorkspaceItem = {
  workspace: { id: number; organizationId: number; name: string; slug: string; isDefault: boolean };
  organization: { id: number; name: string; slug: string };
  role: "owner" | "admin" | "member" | "viewer";
};

type WorkspaceContextValue = {
  workspace: WorkspaceItem | null;
  workspaces: WorkspaceItem[];
  workspaceId: number | null;
  loading: boolean;
  selectWorkspace: (workspaceId: number) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const list = trpc.workspaces.list.useQuery(undefined, { enabled: isAuthenticated });
  const bootstrap = trpc.workspaces.bootstrap.useMutation({ onSuccess: () => list.refetch() });
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(() => {
    const value = window.localStorage.getItem("sopranova.workspaceId");
    return value ? Number(value) : null;
  });

  useEffect(() => {
    if (isAuthenticated && !list.isLoading && list.data?.length === 0 && !bootstrap.isPending) bootstrap.mutate();
  }, [bootstrap, isAuthenticated, list.data?.length, list.isLoading]);

  const workspaces = (list.data ?? []) as WorkspaceItem[];
  const workspace = workspaces.find(item => item.workspace.id === selectedWorkspaceId) ?? workspaces[0] ?? null;
  const selectWorkspace = (workspaceId: number) => {
    window.localStorage.setItem("sopranova.workspaceId", String(workspaceId));
    setSelectedWorkspaceId(workspaceId);
  };
  const value = useMemo(() => ({ workspace, workspaces, workspaceId: workspace?.workspace.id ?? null, loading: authLoading || list.isLoading || bootstrap.isPending, selectWorkspace }), [authLoading, bootstrap.isPending, list.isLoading, workspace, workspaces]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return value;
}
