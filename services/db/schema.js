export async function runSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      chat_id BIGINT PRIMARY KEY,
      telegram_user_id BIGINT,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
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
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
