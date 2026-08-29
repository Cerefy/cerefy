import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const mocks = vi.hoisted(() => ({ getActiveMembership: vi.fn() }));
vi.mock("./db", () => ({ getActiveMembership: mocks.getActiveMembership }));

import { workspaceManagerProcedure, workspaceProcedure } from "./authz";
import { router } from "./_core/trpc";
import type { TrpcContext } from "./_core/context";

const testRouter = router({
  readWorkspace: workspaceProcedure.input(z.object({ workspaceId: z.number().int().positive() })).query(({ ctx }) => ({ workspaceId: ctx.workspaceId, role: ctx.workspaceRole })),
  manageWorkspace: workspaceManagerProcedure.input(z.object({ workspaceId: z.number().int().positive() })).mutation(({ ctx }) => ({ workspaceId: ctx.workspaceId, role: ctx.workspaceRole })),
});

function context(userId = 41): TrpcContext {
  return {
    user: { id: userId, openId: `user-${userId}`, name: "Test User", email: "test@example.com", loginMethod: "credentials", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("workspace authorization", () => {
  beforeEach(() => mocks.getActiveMembership.mockReset());

  it("rejects a cross-workspace read when the requesting user has no membership", async () => {
    mocks.getActiveMembership.mockResolvedValue(undefined);
    const caller = testRouter.createCaller(context(41));
    await expect(caller.readWorkspace({ workspaceId: 912 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    expect(mocks.getActiveMembership).toHaveBeenCalledWith(912, 41);
  });

  it("allows a member to read only the workspace whose membership was verified", async () => {
    mocks.getActiveMembership.mockResolvedValue({ workspaceId: 19, userId: 41, role: "member", isActive: true });
    const caller = testRouter.createCaller(context(41));
    await expect(caller.readWorkspace({ workspaceId: 19 })).resolves.toEqual({ workspaceId: 19, role: "member" });
  });

  it("blocks a member from a manager-only mutation", async () => {
    mocks.getActiveMembership.mockResolvedValue({ workspaceId: 19, userId: 41, role: "member", isActive: true });
    const caller = testRouter.createCaller(context(41));
    await expect(caller.manageWorkspace({ workspaceId: 19 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });

  it("allows an owner to perform a manager mutation", async () => {
    mocks.getActiveMembership.mockResolvedValue({ workspaceId: 19, userId: 41, role: "owner", isActive: true });
    const caller = testRouter.createCaller(context(41));
    await expect(caller.manageWorkspace({ workspaceId: 19 })).resolves.toEqual({ workspaceId: 19, role: "owner" });
  });
});
