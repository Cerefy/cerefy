import { describe, expect, it } from "vitest";
import { systemRouter } from "./_core/systemRouter";
import type { TrpcContext } from "./_core/context";

describe("system.health", () => {
  it("returns an affirmative health response through the public tRPC surface", async () => {
    const caller = systemRouter.createCaller({
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });
    await expect(caller.health({ timestamp: Date.now() })).resolves.toMatchObject({ ok: true, service: "sopranova-api" });
  });
});
