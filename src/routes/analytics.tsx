import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsPage } from "@/pages/Analytics";
import { ProtectedRoute } from "@/components/auth/protected-route";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Cerefy" },
      {
        name: "description",
        content:
          "Cross-module intelligence and business analytics. Track KPIs, traffic, and performance across your entire operation.",
      },
      { property: "og:title", content: "Analytics — Cerefy" },
      { property: "og:description", content: "Cross-module intelligence and business analytics." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <AnalyticsPage />
    </ProtectedRoute>
  ),
});
