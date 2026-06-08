import { pool } from "./db.js";

export function formatModelCode(weddingDate) {
  return weddingDate.replace(/\D/g, "");
}

export function formatShortName(groomName, brideName, modelCode) {
  const groomInitial = groomName.charAt(0).toUpperCase();
  const brideInitial = brideName.charAt(0).toUpperCase();
  return `${groomInitial}${brideInitial}С-${modelCode}`;
}

export function buildHelloMessageText(username, config) {
  const modelCode = formatModelCode(config.wedding_date);
  const shortName = formatShortName(config.groom_name, config.bride_name, modelCode);

  return `Приветствую, ${username}! Я автоматический координатор свадьбы, модель ${modelCode}, сокращенно ${shortName}. 🤖

${config.bride_name} и ${config.groom_name} рады пригласить вас на свою свадьбу, которая состоится ${config.wedding_date} в ${config.city}! 💍✨

Я расскажу о всех подробностях предстоящего события, напомню о начале церемонии и подскажу, где пройдет банкет. 🥂

🔒 Мы бережно храним ваши конфиденциальные данные и не распространяем их.`;
}

export async function getWeddingConfig() {
  try {
    const result = await pool.query(`
      SELECT bride_name, groom_name, wedding_date, city
      FROM wedding_config
      LIMIT 1
    `);

    return result.rows[0] || null;
  } catch (error) {
    console.error("[wedding] Failed to read wedding config:", error);
    return null;
  }
}
