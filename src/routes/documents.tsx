import { createFileRoute } from "@tanstack/react-router";
import { DocumentsAppPage } from "@/pages/DocumentsApp";
import { ProtectedRoute } from "@/components/auth/protected-route";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Cerefy" },
      {
        name: "description",
        content: "Manage contracts, invoices, reports, and policies across your organization.",
      },
      { property: "og:title", content: "Documents — Cerefy" },
      { property: "og:description", content: "Manage contracts, invoices, reports, and policies." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <DocumentsAppPage />
    </ProtectedRoute>
  ),
});
