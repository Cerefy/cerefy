import { createFileRoute } from "@tanstack/react-router";
import { HrPage } from "@/pages/Hr";
import { ProtectedRoute } from "@/components/auth/protected-route";

export const Route = createFileRoute("/hr")({
  head: () => ({
    meta: [
      { title: "Human Resources | Cerefy" },
      {
        name: "description",
        content: "Employee and HR management with intelligent workforce insights.",
      },
      { property: "og:title", content: "Human Resources | Cerefy" },
      {
        property: "og:description",
        content: "Employee and HR management with intelligent workforce insights.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <HrPage />
    </ProtectedRoute>
  ),
});
