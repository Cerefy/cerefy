// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { TeamPage } from "@/pages/Team";
import { ProtectedRoute } from "@/components/auth/protected-route";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "AI Team | Cerefy" },
      {
        name: "description",
        content: "Manage your AI founding agents — CEO, CTO, Product, CFO, Marketing, and Investor",
      },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <TeamPage />
    </ProtectedRoute>
  ),
});
