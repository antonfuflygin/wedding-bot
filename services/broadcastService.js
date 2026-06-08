import { getUsers } from "./userService.js";

export async function broadcastMessage(bot, message) {
  const users = await getUsers();
  let sent = 0;
  let failed = 0;

  console.log(`[broadcast] Starting broadcast to ${users.length} users`);

  for (const chatId of users) {
    try {
      await bot.api.sendMessage(chatId, message);
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error(`[broadcast] Failed to send message to ${chatId}:`, error);
    }
  }

  console.log(`[broadcast] Finished. Sent: ${sent}. Failed: ${failed}.`);
  return { total: users.length, sent, failed };
}
