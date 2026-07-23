import { createFileRoute } from "@tanstack/react-router";

// Note: Server-side sitemap generation is not supported in this client-side router config.
// The sitemap is served as a static file from /public/sitemap.xml instead.
export const Route = createFileRoute("/sitemap.xml")({
  component: () => null,
});
