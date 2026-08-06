// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { WorkflowPage } from "@/pages/WorkflowPage";
import { ProtectedRoute } from "@/components/auth/protected-route";

export const Route = createFileRoute("/workflow")({
  head: () => ({
    meta: [
      { title: "AI Workflow | Cerefy" },
      { name: "description", content: "Animated startup building workflow — Idea to Launch" },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <WorkflowPage />
    </ProtectedRoute>
  ),
});
