// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/pages/Workspace";
import { ProtectedRoute } from "@/components/auth/protected-route";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace | Cerefy" },
      { name: "description", content: "Startup workspace — track progress, agents, and documents" },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <WorkspacePage />
    </ProtectedRoute>
  ),
});
