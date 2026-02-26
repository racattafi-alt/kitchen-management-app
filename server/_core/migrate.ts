import "dotenv/config";
import path from "path";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

// Validate all required environment variables before doing anything
const required: Record<string, string | undefined> = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
};
const missing = Object.entries(required)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length > 0) {
  console.error(`[Startup] FATAL: Missing required environment variables: ${missing.join(", ")}`);
  console.error("[Startup] Set these in your Railway service environment settings.");
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL!;

const migrationsFolder = path.resolve(process.cwd(), "drizzle");
console.log(`[Migrate] Running migrations from: ${migrationsFolder}`);
console.log(`[Migrate] Database: ${dbUrl.replace(/:\/\/.*@/, "://<credentials>@")}`);

const db = drizzle(dbUrl);

try {
  await migrate(db, { migrationsFolder });
  console.log("[Migrate] ✓ All migrations applied successfully.");
  process.exit(0);
} catch (err) {
  console.error("[Migrate] ✗ Migration failed:", err);
  process.exit(1);
}
