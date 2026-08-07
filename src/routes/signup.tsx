import { createFileRoute } from "@tanstack/react-router";
import SignupPage from "@/pages/Signup";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign Up — Cerefy" },
      { name: "description", content: "Create your Cerefy account." },
    ],
  }),
  component: SignupPage,
});
