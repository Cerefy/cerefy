import { createFileRoute } from "@tanstack/react-router";
import { EnterpriseDemoPage } from "@/pages/EnterpriseDemo";
import { ProtectedRoute } from "@/components/auth/protected-route";

export const Route = createFileRoute("/enterprise-demo")({
  head: () => ({
    meta: [
      { title: "Enterprise Demo | Cerefy" },
      {
        name: "description",
        content: "Experience the Cerefy platform with a realistic company scenario",
      },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <EnterpriseDemoPage />
    </ProtectedRoute>
  ),
});
