// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { ActivityFeedPage } from "@/pages/ActivityFeed";
import { ProtectedRoute } from "@/components/auth/protected-route";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Activity Feed | Cerefy" },
      { name: "description", content: "Real-time AI agent activity and updates" },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <ActivityFeedPage />
    </ProtectedRoute>
  ),
});
