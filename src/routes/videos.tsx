// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { VideosPage } from "@/pages/Videos";
import { ProtectedRoute } from "@/components/auth/protected-route";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "Videos | Cerefy" },
      { name: "description", content: "Product demo, team collaboration, and founder journey" },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <VideosPage />
    </ProtectedRoute>
  ),
});
