import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/pages/Contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Cerefy" },
      {
        name: "description",
        content:
          "Get in touch with Cerefy. Reach out for partnerships, support, or general inquiries.",
      },
      { property: "og:title", content: "Contact Cerefy" },
      {
        property: "og:description",
        content:
          "Get in touch with Cerefy. Reach out for partnerships, support, or general inquiries.",
      },
    ],
  }),
  component: ContactPage,
});
