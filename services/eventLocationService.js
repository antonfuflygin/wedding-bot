import { pool } from "./db.js";

export async function getEventLocation(action) {
  try {
    const result = await pool.query(
      `
        SELECT action, latitude, longitude, map_url, starts_at, arrival
        FROM event_locations
        WHERE action = $1
      `,
      [action]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error(`[events] Failed to read location for '${action}':`, error);
    return null;
  }
}
