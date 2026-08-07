import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/pages/About";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Cerefy — Origin" },
      {
        name: "description",
        content: "The people, principles and origin story behind Cerefy.",
      },
      { property: "og:title", content: "About Cerefy — Origin" },
      {
        property: "og:description",
        content: "The people, principles and origin story behind Cerefy.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AboutPage,
});
