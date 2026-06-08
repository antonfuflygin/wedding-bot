import pg from "pg";
import { runMigrations } from "./db/migrations.js";
import { runSchema } from "./db/schema.js";
import { seedWeddingConfig } from "./db/seed.js";

const { Pool } = pg;

function buildDatabaseUrl() {
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const database = process.env.POSTGRES_DB;
  const host = process.env.POSTGRES_HOST || "localhost";
  const port = process.env.POSTGRES_PORT || "5432";

  if (!user || !database) {
    return null;
  }

  const credentials =
    password !== undefined && password !== ""
      ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}`
      : encodeURIComponent(user);

  return `postgres://${credentials}@${host}:${port}/${database}`;
}

function createPoolConfig() {
  const connectionString = process.env.DATABASE_URL || buildDatabaseUrl();

  if (connectionString) {
    return {
      connectionString,
      ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined
    };
  }

  return {
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined
  };
}

export const pool = new Pool(createPoolConfig());

export async function initializeDatabase() {
  await runSchema(pool);
  await runMigrations(pool);
  await seedWeddingConfig(pool);

  console.log("[db] Database is ready");
}

export async function closeDatabase() {
  await pool.end();
  console.log("[db] Database connection closed");
}
