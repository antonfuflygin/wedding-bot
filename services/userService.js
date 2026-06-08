import { pool } from "./db.js";

export async function getUsers() {
  try {
    const result = await pool.query("SELECT chat_id FROM users ORDER BY created_at ASC");
    return result.rows.map((row) => row.chat_id);
  } catch (error) {
    console.error("[users] Failed to read users from database:", error);
    return [];
  }
}

export async function saveUser(user) {
  const chatId = typeof user === "object" ? user.chatId : user;
  const normalizedChatId = Number(chatId);

  if (!Number.isFinite(normalizedChatId)) {
    throw new Error(`Invalid chatId: ${chatId}`);
  }

  const telegramUserId = user?.telegramUserId ? Number(user.telegramUserId) : null;
  const values = [
    normalizedChatId,
    Number.isFinite(telegramUserId) ? telegramUserId : null,
    user?.username || null,
    user?.firstName || null,
    user?.lastName || null
  ];

  const insertResult = await pool.query(
    `
      INSERT INTO users (chat_id, telegram_user_id, username, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (chat_id) DO NOTHING
      RETURNING chat_id;
    `,
    values
  );

  if (insertResult.rowCount > 0) {
    const savedUser = insertResult.rows[0];
    console.log(`[users] New user saved: ${savedUser.chat_id}`);
    return {
      added: true,
      chatId: savedUser.chat_id
    };
  }

  await pool.query(
    `
      UPDATE users
      SET
        telegram_user_id = $2,
        username = $3,
        first_name = $4,
        last_name = $5,
        updated_at = NOW()
      WHERE chat_id = $1;
    `,
    values
  );

  return {
    added: false,
    chatId: normalizedChatId
  };
}

export async function isUserAdmin(telegramUserId) {
  const normalizedUserId = Number(telegramUserId);

  if (!Number.isFinite(normalizedUserId)) {
    return false;
  }

  try {
    const result = await pool.query(
      "SELECT is_admin FROM users WHERE telegram_user_id = $1",
      [normalizedUserId]
    );

    return result.rows[0]?.is_admin === true;
  } catch (error) {
    console.error("[users] Failed to check admin status:", error);
    return false;
  }
}

export async function getAdmins() {
  try {
    const result = await pool.query(
      `
        SELECT telegram_user_id, username, first_name, last_name
        FROM users
        WHERE is_admin = true
        ORDER BY created_at ASC
      `
    );

    return result.rows;
  } catch (error) {
    console.error("[users] Failed to read admins:", error);
    return [];
  }
}
