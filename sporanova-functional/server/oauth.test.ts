import { describe, expect, it, vi } from "vitest";

vi.mock("./_core/env", () => ({ ENV: { appUrl: "http://localhost:3000", sessionSecret: "test-session-secret", oauth: {} } }));
vi.mock("./db", () => ({ requireDb: vi.fn(), bootstrapWorkspace: vi.fn() }));
vi.mock("./auth", () => ({ createSession: vi.fn(), SESSION_COOKIE: "sopranova_session", sessionCookieOptions: vi.fn(() => ({})) }));

import { registerOAuthRoutes } from "./oauth";

type Handler = (req: { query: Record<string, unknown> }, res: { status: (code: number) => any; json: (body: unknown) => any; send: (body: unknown) => any; redirect: (url: string) => any }) => unknown;

function routes() {
  const handlers: Record<string, Handler> = {};
  const app = { get: (path: string, handler: Handler) => { handlers[path] = handler; } };
  registerOAuthRoutes(app as never);
  return handlers;
}

function response() {
  const res = { status: vi.fn(), json: vi.fn(), send: vi.fn(), redirect: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

describe("standalone Google OAuth route readiness", () => {
  it("returns a clear 503 when provider credentials are not configured", async () => {
    const res = response();
    await routes()["/api/auth/google"]({ query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ error: "Google OAuth is not configured." });
  });

  it("rejects malformed callbacks before any token exchange", async () => {
    const res = response();
    await routes()["/api/auth/google/callback"]({ query: { code: "untrusted-code" } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Invalid OAuth callback.");
  });
});
