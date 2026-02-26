import "dotenv/config";
import path from "path";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("[Migrate] ERROR: DATABASE_URL is not set. Cannot run migrations.");
  process.exit(1);
}

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
