import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;

const requestLogging = t.middleware(async opts => {
  const startedAt = Date.now();
  try {
    const result = await opts.next();
    console.info(JSON.stringify({
      event: "trpc.request",
      path: opts.path,
      type: opts.type,
      userId: opts.ctx.user?.id ?? null,
      durationMs: Date.now() - startedAt,
      outcome: result.ok ? "success" : "error",
    }));
    return result;
  } catch (error) {
    const trpcError = error instanceof TRPCError ? error : null;
    console.error(JSON.stringify({
      event: "trpc.request",
      path: opts.path,
      type: opts.type,
      userId: opts.ctx.user?.id ?? null,
      durationMs: Date.now() - startedAt,
      outcome: "error",
      code: trpcError?.code ?? "INTERNAL_SERVER_ERROR",
    }));
    throw error;
  }
});

export const publicProcedure = t.procedure.use(requestLogging);

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireUser);

export const adminProcedure = protectedProcedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
