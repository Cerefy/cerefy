import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "../components/layout/SiteHeader";
import { SiteFooter } from "../components/layout/SiteFooter";
import { AuthProvider } from "../components/providers/auth-provider";
import { NotFoundPage } from "../pages/NotFound";

function NotFoundComponent() {
  return (
    <div className="bg-eye-bg min-h-screen">
      <NotFoundPage />
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-eye-bg px-4 pt-16">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-display font-medium text-eye-white tracking-tight">
          Something failed to load
        </h1>
        <p className="mt-2 text-sm text-eye-text font-light">
          A rare fault. Try refreshing, or return to the platform overview.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="luminous-btn-primary px-6 py-3 text-[10px] font-bold uppercase tracking-widest"
          >
            Try again
          </button>
          <a
            href="/"
            className="luminous-btn-secondary px-6 py-3 text-[10px] font-bold uppercase tracking-widest"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const APP_ROUTES = [
  "/dashboard",
  "/analytics",
  "/data-sources",
  "/ai-copilot",
  "/reports",
  "/crm",
  "/sales",
  "/marketing",
  "/finance",
  "/inventory",
  "/hr",
  "/projects",
  "/documents",
  "/integrations",
  "/notifications",
  "/settings",
  "/ai-chat",
  "/api",
];

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterLocation();
  const isApp = APP_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-eye-bg text-eye-text">
          {!isApp && <SiteHeader />}
          <main className={isApp ? "" : "pt-16"}>
            <Outlet />
          </main>
          {!isApp && <SiteFooter />}
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function useRouterLocation() {
  const router = useRouter();
  return router.state.location.pathname;
}
