import pg from "pg";

const { Pool } = pg;

function createPoolConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      chat_id BIGINT PRIMARY KEY,
      telegram_user_id BIGINT,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      is_admin BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_locations (
      action TEXT PRIMARY KEY,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      map_url TEXT,
      starts_at TIMESTAMPTZ
    );
  `);

  await pool.query(`
    ALTER TABLE event_locations
    DROP COLUMN IF EXISTS address;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wedding_config (
      id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      bride_name TEXT NOT NULL,
      groom_name TEXT NOT NULL,
      wedding_date TEXT NOT NULL,
      city TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'wedding_config'
          AND column_name = 'wedding_date'
          AND data_type = 'date'
      ) THEN
        ALTER TABLE wedding_config
        ALTER COLUMN wedding_date TYPE TEXT
        USING to_char(wedding_date, 'DD.MM.YY');
      END IF;
    END $$;
  `);

  await seedWeddingConfig();

  console.log("[db] Database is ready");
}

async function seedWeddingConfig() {
  const existing = await pool.query("SELECT 1 FROM wedding_config LIMIT 1");

  if (existing.rowCount > 0) {
    return;
  }

  const brideName = process.env.WEDDING_BRIDE_NAME;
  const groomName = process.env.WEDDING_GROOM_NAME;
  const weddingDate = process.env.WEDDING_DATE;
  const city = process.env.WEDDING_CITY;

  if (!brideName || !groomName || !weddingDate || !city) {
    console.warn("[db] wedding_config is empty. Set WEDDING_* env vars or insert a row manually.");
    return;
  }

  await pool.query(
    `
      INSERT INTO wedding_config (bride_name, groom_name, wedding_date, city)
      VALUES ($1, $2, $3, $4)
    `,
    [brideName, groomName, weddingDate, city]
  );

  console.log("[db] wedding_config seeded from environment variables");
}

export async function closeDatabase() {
  await pool.end();
  console.log("[db] Database connection closed");
}
