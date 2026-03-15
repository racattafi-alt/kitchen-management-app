import "dotenv/config";
import path from "path";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { registerOAuthRoutes } from "./oauth";
import { registerLocalAuthRoutes } from "./localAuthRoutes";
import { registerGoogleAuthRoutes } from "./googleAuthRoutes";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { ENV } from "./env";

async function runMigrations() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("[Migrate] DATABASE_URL not set — skipping migrations");
    return;
  }
  const migrationsFolder = path.resolve(process.cwd(), "drizzle");
  console.log(`[Migrate] Running migrations from: ${migrationsFolder}`);
  console.log(`[Migrate] Database: ${dbUrl.replace(/:\/\/.*@/, "://<credentials>@")}`);
  const db = drizzle(dbUrl);
  try {
    await migrate(db, { migrationsFolder });
    console.log("[Migrate] ✓ All migrations applied successfully.");
  } catch (err) {
    console.error("[Migrate] ✗ Migration failed:", err);
    console.error("[Migrate] The server will continue running — fix the migration and redeploy.");
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Health check — must be first so Railway healthcheck passes even if migrations fail
  app.get("/healthz", (_req, res) => res.json({ status: "ok" }));

  const port = parseInt(process.env.PORT || "3000");

  // Start listening IMMEDIATELY so the healthcheck can pass
  await new Promise<void>((resolve) => {
    server.listen(port, "0.0.0.0", () => {
      console.log(`Server listening on port ${port}`);
      resolve();
    });
  });

  // Run migrations AFTER the server is listening (non-fatal)
  await runMigrations();

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Auth routes — register based on auth provider
  if (ENV.authProvider === "local") {
    registerLocalAuthRoutes(app);
  } else {
    registerOAuthRoutes(app);
  }
  // Google OAuth — always registered if GOOGLE_CLIENT_ID/SECRET are set
  registerGoogleAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  console.log(`Server fully initialized on port ${port}`);
}

startServer().catch(console.error);
