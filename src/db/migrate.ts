import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function runMigrations() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  console.log("Connecting to Neon Postgres...");
  const sql = neon(dbUrl);
  const db = drizzle(sql);

  console.log("Running Drizzle migrations from src/db/migrations...");
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  console.log("✓ Migrations completed successfully!");
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

