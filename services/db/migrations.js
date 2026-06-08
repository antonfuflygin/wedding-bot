const migrations = [
  {
    id: "001_users_add_is_admin",
    sql: `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
    `
  },
  {
    id: "002_event_locations_drop_address",
    sql: `
      ALTER TABLE event_locations
      DROP COLUMN IF EXISTS address;
    `
  },
  {
    id: "003_event_locations_add_arrival",
    sql: `
      ALTER TABLE event_locations
      ADD COLUMN IF NOT EXISTS arrival TIMESTAMPTZ;

      UPDATE event_locations
      SET arrival = TIMESTAMPTZ '2026-06-25 15:50:00.619+03'
      WHERE action = 'palace';
    `
  },
  {
    id: "004_wedding_config_wedding_date_text",
    sql: `
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
    `
  },
  {
    id: "005_event_locations_seed_palace_arrival",
    sql: `
      UPDATE event_locations
      SET arrival = TIMESTAMPTZ '2026-06-25 15:50:00.619+03'
      WHERE action = 'palace'
        AND arrival IS NULL;
    `
  }
];

export async function runMigrations(pool) {
  for (const migration of migrations) {
    const applied = await pool.query(
      "SELECT 1 FROM schema_migrations WHERE id = $1",
      [migration.id]
    );

    if (applied.rowCount > 0) {
      continue;
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(migration.sql);
      await client.query(
        "INSERT INTO schema_migrations (id) VALUES ($1)",
        [migration.id]
      );
      await client.query("COMMIT");
      console.log(`[db] Applied migration ${migration.id}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
