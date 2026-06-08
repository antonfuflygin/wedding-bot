export async function seedWeddingConfig(pool) {
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
