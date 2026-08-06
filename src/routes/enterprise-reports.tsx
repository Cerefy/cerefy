import { createFileRoute } from "@tanstack/react-router";
import { EnterpriseReportsPage } from "@/pages/EnterpriseReports";
import { ProtectedRoute } from "@/components/auth/protected-route";

export const Route = createFileRoute("/enterprise-reports")({
  head: () => ({
    meta: [
      { title: "Business Intelligence Reports | Cerefy" },
      { name: "description", content: "Executive reports and business intelligence" },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <EnterpriseReportsPage />
    </ProtectedRoute>
  ),
});
