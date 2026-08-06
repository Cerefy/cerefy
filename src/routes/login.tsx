import { createFileRoute } from "@tanstack/react-router";
import LoginPage from "@/pages/Login";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — Cerefy" },
      { name: "description", content: "Sign in to your Cerefy account." },
    ],
  }),
  component: LoginPage,
});
