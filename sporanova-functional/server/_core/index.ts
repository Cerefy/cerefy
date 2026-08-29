import "dotenv/config";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import { createServer } from "http";
import { appRouter } from "../routers";
import { registerOAuthRoutes } from "../oauth";
import { createContext } from "./context";
import { ENV } from "./env";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  if (ENV.isProduction && !ENV.sessionSecret) throw new Error("SESSION_SECRET must be configured in production");
  const app = express();
  const server = createServer(app);
  app.disable("x-powered-by");
  app.use(express.json({ limit: "12mb" }));
  app.use(express.urlencoded({ limit: "12mb", extended: false }));
  registerOAuthRoutes(app);
  app.use((req, res, next) => {
    const origin = req.headers.origin || (req.headers.host ? `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}` : process.env.APP_ORIGIN || "http://localhost:3000");
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    if (req.method === "OPTIONS") return res.status(204).end();
    next();
  });
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  if (process.env.NODE_ENV === "development") await setupVite(app, server);
  else serveStatic(app);

  const port = Number(process.env.PORT ?? 3000);
  server.listen(port, process.env.HOST ?? "0.0.0.0", () => {
    console.info(`SOPRANOVA API listening on http://localhost:${port}`);
  });
}

startServer().catch(error => {
  console.error("SOPRANOVA server failed to start", error);
  process.exit(1);
});
