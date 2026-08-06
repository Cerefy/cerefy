import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/pages/Home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cerefy — AI Startup Builder Platform" },
      {
        name: "description",
        content:
          "Build startups with AI founding agents. Cerefy is the AI Startup Builder Platform where founders deploy CEO, CTO, Product, CFO, Marketing, and Investor agents to accelerate company creation.",
      },
      { property: "og:title", content: "Cerefy — AI Startup Builder Platform" },
      {
        property: "og:description",
        content: "Build startups with AI founding agents. Deploy your AI team and build faster.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: HomePage,
});
