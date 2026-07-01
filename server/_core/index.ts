import "dotenv/config";
import path from "path";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { registerOAuthRoutes } from "./oauth";
import { registerLocalAuthRoutes } from "./localAuthRoutes";
import { registerGoogleAuthRoutes } from "./googleAuthRoutes";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { ENV } from "./env";

/**
 * Applies critical schema fixes directly via mysql2, bypassing Drizzle's migration system.
 * Handles incomplete migrations 0045 (storeId removal) and 0047 (piecesPerBox).
 * Every check is idempotent — safe to run on every startup.
 */
async function runSafetyMigrations() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return;
  let conn: mysql.Connection | null = null;

  const colExists = async (table: string, col: string): Promise<boolean> => {
    const [r] = await conn!.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, col]
    );
    return r[0].cnt > 0;
  };

  const tableExists = async (table: string): Promise<boolean> => {
    const [r] = await conn!.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
      [table]
    );
    return r[0].cnt > 0;
  };

  try {
    conn = await mysql.createConnection(dbUrl);

    // ── FIX 1: Ensure ingredient_stores table exists (migration 0045 may have failed) ──
    if (!(await tableExists("ingredient_stores"))) {
      await conn.execute(`
        CREATE TABLE \`ingredient_stores\` (
          \`ingredientId\` varchar(36) NOT NULL,
          \`storeId\` varchar(36) NOT NULL,
          \`isActive\` boolean NOT NULL DEFAULT true,
          \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`ingredientId\`, \`storeId\`)
        )
      `);
      console.log("[SafetyMigration] ✓ Created ingredient_stores table.");
    }

    // ── FIX 2: Remove storeId from ingredients if still present ──
    // (migration 0045 created ingredient_stores but never dropped the old column)
    if (await colExists("ingredients", "storeId")) {
      // Copy existing storeId values into ingredient_stores before dropping
      await conn.execute(`
        INSERT IGNORE INTO \`ingredient_stores\` (\`ingredientId\`, \`storeId\`, \`isActive\`, \`createdAt\`, \`updatedAt\`)
        SELECT \`id\`, \`storeId\`, \`isActive\`, \`createdAt\`, NOW()
        FROM \`ingredients\`
        WHERE \`storeId\` IS NOT NULL AND \`storeId\` != ''
      `);
      await conn.execute("ALTER TABLE `ingredients` DROP COLUMN `storeId`");
      console.log("[SafetyMigration] ✓ Removed storeId column from ingredients (migrated to ingredient_stores).");
    }

    // ── FIX 3: Remove storeId from suppliers if still present ──
    if (await colExists("suppliers", "storeId")) {
      await conn.execute("ALTER TABLE `suppliers` DROP COLUMN `storeId`");
      console.log("[SafetyMigration] ✓ Removed storeId column from suppliers.");
    }

    // ── FIX 4: Add piecesPerBox if missing (migration 0047) ──
    if (!(await colExists("ingredients", "piecesPerBox"))) {
      await conn.execute("ALTER TABLE `ingredients` ADD COLUMN `piecesPerBox` int DEFAULT NULL");
      console.log("[SafetyMigration] ✓ Added piecesPerBox column to ingredients.");
    }

    // ── FIX 5: Ensure 'Fusto' is in packageType enum (migration 0048) ──
    await conn.execute(
      "ALTER TABLE `ingredients` MODIFY COLUMN `packageType` enum('Sacco','Busta','Brick','Cartone','Scatola','Bottiglia','Barattolo','Lattina','Sfuso','Fusto')"
    );
    console.log("[SafetyMigration] ✓ packageType enum verified (Fusto included).");

    // ── FIX 6: Ensure recipe_components table exists (migration 0046 may have failed) ──
    if (!(await tableExists("recipe_components"))) {
      await conn.execute(`
        CREATE TABLE \`recipe_components\` (
          \`id\` varchar(36) NOT NULL,
          \`recipeId\` varchar(36) NOT NULL,
          \`ingredientId\` varchar(36) NULL,
          \`semiFinishedId\` varchar(36) NULL,
          \`operationId\` varchar(36) NULL,
          \`componentName\` varchar(255) NOT NULL DEFAULT '',
          \`quantity\` decimal(10,3) NOT NULL,
          \`unitSnapshot\` varchar(20) NULL,
          \`priceSnapshot\` decimal(10,4) NULL,
          \`sortOrder\` int NOT NULL DEFAULT 0,
          PRIMARY KEY (\`id\`),
          KEY \`rc_recipeId_idx\` (\`recipeId\`),
          KEY \`rc_ingredientId_idx\` (\`ingredientId\`),
          KEY \`rc_semiFinishedId_idx\` (\`semiFinishedId\`)
        )
      `);
      console.log("[SafetyMigration] ✓ Created recipe_components table.");
    }

    // ── FIX 7: Ensure semi_finished_components table exists (migration 0046 may have failed) ──
    if (!(await tableExists("semi_finished_components"))) {
      await conn.execute(`
        CREATE TABLE \`semi_finished_components\` (
          \`id\` varchar(36) NOT NULL,
          \`semiFinishedRecipeId\` varchar(36) NOT NULL,
          \`ingredientId\` varchar(36) NULL,
          \`childSemiFinishedId\` varchar(36) NULL,
          \`operationId\` varchar(36) NULL,
          \`componentName\` varchar(255) NOT NULL DEFAULT '',
          \`quantity\` decimal(10,3) NOT NULL,
          \`unitSnapshot\` varchar(20) NULL,
          \`priceSnapshot\` decimal(10,4) NULL,
          \`sortOrder\` int NOT NULL DEFAULT 0,
          PRIMARY KEY (\`id\`),
          KEY \`sfc_semiFinishedRecipeId_idx\` (\`semiFinishedRecipeId\`),
          KEY \`sfc_ingredientId_idx\` (\`ingredientId\`),
          KEY \`sfc_childSemiFinishedId_idx\` (\`childSemiFinishedId\`)
        )
      `);
      console.log("[SafetyMigration] ✓ Created semi_finished_components table.");
    }

  } catch (err) {
    console.error("[SafetyMigration] Error (non-fatal, server continues):", err);
  } finally {
    if (conn) await conn.end();
  }
}

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

  // Apply critical column fixes first (idempotent, bypasses Drizzle migration state)
  await runSafetyMigrations();
  // Run Drizzle migrations (non-fatal)
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
