import "dotenv/config";
import { Bot } from "grammy";
import cron from "node-cron";
import { createMainKeyboard, CALLBACK_ACTIONS } from "./keyboards/mainKeyboard.js";
import { setupBotMenu } from "./keyboards/botMenu.js";
import { broadcastMessage } from "./services/broadcastService.js";
import { handleContactCallback, handleEventLocationCallback } from "./services/callbackService.js";
import { closeDatabase, initializeDatabase } from "./services/db.js";
import { isUserAdmin, saveUser } from "./services/userService.js";
import { buildHelloMessageText, getWeddingConfig } from "./services/weddingConfigService.js";

const { BOT_TOKEN } = process.env;

const DAILY_MESSAGE_CRON = process.env.DAILY_MESSAGE_CRON || "0 10 * * *";
const CRON_TIMEZONE = process.env.CRON_TIMEZONE || "Europe/Moscow";
const DAILY_MESSAGE_TEXT =
  process.env.DAILY_MESSAGE_TEXT ||
  "Доброе утро! Напоминаем, что вся важная информация о свадьбе доступна в меню бота.";

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is required. Add it to your .env file.");
}

if (!cron.validate(DAILY_MESSAGE_CRON)) {
  throw new Error(`Invalid DAILY_MESSAGE_CRON expression: ${DAILY_MESSAGE_CRON}`);
}

const bot = new Bot(BOT_TOKEN);

async function sendMainMenu(ctx, text = "Выберите действие:") {
  await ctx.reply(text, {
    reply_markup: createMainKeyboard()
  });
}

bot.command("start", async (ctx) => {
  const chatId = ctx.chat?.id;

  if (!chatId) {
    await ctx.reply("Не удалось определить chatId.");
    return;
  }

  try {
    const result = await saveUser({
      chatId,
      telegramUserId: ctx.from?.id,
      username: ctx.from?.username,
      firstName: ctx.from?.first_name,
      lastName: ctx.from?.last_name
    });
    console.log(`[bot] /start from ${chatId}. Added: ${result.added}`);

    const weddingConfig = await getWeddingConfig();

    if (!weddingConfig) {
      await ctx.reply("Бот ещё не настроен. Обратитесь к организатору.");
      return;
    }

    await ctx.reply(buildHelloMessageText(ctx.chat.first_name, weddingConfig), {
      reply_markup: createMainKeyboard()
    });
  } catch (error) {
    console.error(`[bot] Failed to handle /start for ${chatId}:`, error);
    await ctx.reply("Произошла ошибка при сохранении пользователя. Попробуйте позже.");
  }
});

bot.command("menu", async (ctx) => {
  console.log(`[bot] /menu from ${ctx.chat?.id}`);
  await sendMainMenu(ctx);
});

bot.command("palace", async (ctx) => {
  console.log(`[bot] /palace from ${ctx.from?.id}`);

  try {
    await handleEventLocationCallback(ctx, CALLBACK_ACTIONS.PALACE, CRON_TIMEZONE);
  } catch (error) {
    console.error("[bot] Failed to handle /palace:", error);
    await ctx.reply("Не удалось получить информацию о ЗАГС. Попробуйте позже.");
  }
});

bot.command("restaurant", async (ctx) => {
  console.log(`[bot] /restaurant from ${ctx.from?.id}`);

  try {
    await handleEventLocationCallback(ctx, CALLBACK_ACTIONS.RESTAURANT, CRON_TIMEZONE);
  } catch (error) {
    console.error("[bot] Failed to handle /restaurant:", error);
    await ctx.reply("Не удалось получить информацию о ресторане. Попробуйте позже.");
  }
});

bot.command("contact", async (ctx) => {
  console.log(`[bot] /contact from ${ctx.from?.id}`);

  try {
    await handleContactCallback(ctx);
  } catch (error) {
    console.error("[bot] Failed to handle /contact:", error);
    await ctx.reply("Не удалось получить контакт организатора. Попробуйте позже.");
  }
});

bot.command("broadcast", async (ctx) => {
  if (!(await isUserAdmin(ctx.from?.id))) {
    console.warn(`[admin] Unauthorized /broadcast attempt from ${ctx.from?.id}`);
    await ctx.reply("Команда недоступна.");
    return;
  }

  const message = ctx.message?.text?.replace(/^\/broadcast(@\w+)?\s*/i, "").trim();

  if (!message) {
    await ctx.reply("Использование: /broadcast Текст сообщения");
    return;
  }

  try {
    const result = await broadcastMessage(bot, message);
    await ctx.reply(
      `Рассылка завершена.\nВсего пользователей: ${result.total}\nОтправлено: ${result.sent}\nОшибок: ${result.failed}`
    );
  } catch (error) {
    console.error("[admin] Broadcast failed:", error);
    await ctx.reply("Не удалось выполнить рассылку.");
  }
});

bot.callbackQuery(CALLBACK_ACTIONS.PALACE, async (ctx) => {
  console.log(`[callback] Palace requested by ${ctx.from?.id}`);
  await ctx.answerCallbackQuery();

  try {
    await handleEventLocationCallback(ctx, CALLBACK_ACTIONS.PALACE, CRON_TIMEZONE);
  } catch (error) {
    console.error("[callback] Failed to handle palace action:", error);
    await ctx.reply("Не удалось получить информацию о ЗАГС. Попробуйте позже.");
  }
});

bot.callbackQuery(CALLBACK_ACTIONS.RESTAURANT, async (ctx) => {
  console.log(`[callback] Restaurant requested by ${ctx.from?.id}`);
  await ctx.answerCallbackQuery();

  try {
    await handleEventLocationCallback(ctx, CALLBACK_ACTIONS.RESTAURANT, CRON_TIMEZONE);
  } catch (error) {
    console.error("[callback] Failed to handle restaurant action:", error);
    await ctx.reply("Не удалось получить информацию о ресторане. Попробуйте позже.");
  }
});

bot.callbackQuery(CALLBACK_ACTIONS.CONTACT, async (ctx) => {
  console.log(`[callback] Contact requested by ${ctx.from?.id}`);
  await ctx.answerCallbackQuery();

  try {
    await handleContactCallback(ctx);
  } catch (error) {
    console.error("[callback] Failed to handle contact action:", error);
    await ctx.reply("Не удалось получить контакт организатора. Попробуйте позже.");
  }
});

bot.on("callback_query:data", async (ctx) => {
  console.log(`[callback] Unknown callback '${ctx.callbackQuery.data}' from ${ctx.from?.id}`);
  await ctx.answerCallbackQuery("Неизвестное действие.");
});

bot.on("message", async (ctx) => {
  const text = ctx.message?.text;

  if (text?.startsWith("/")) {
    return;
  }

  await sendMainMenu(ctx, "Спасибо за сообщение! Выберите действие:");
});

cron.schedule(DAILY_MESSAGE_CRON, async () => {
  console.log(`[cron] Scheduled broadcast started: ${DAILY_MESSAGE_CRON}`);
  await broadcastMessage(bot, DAILY_MESSAGE_TEXT);
}, {
  timezone: CRON_TIMEZONE
});

bot.catch((error) => {
  console.error("[bot] Unhandled bot error:", error);
});

async function shutdown(signal) {
  console.log(`[bot] Received ${signal}. Stopping bot...`);
  bot.stop();
  await closeDatabase();
}

process.once("SIGINT", () => {
  shutdown("SIGINT").catch((error) => {
    console.error("[bot] Failed to shutdown cleanly:", error);
    process.exit(1);
  });
});

process.once("SIGTERM", () => {
  shutdown("SIGTERM").catch((error) => {
    console.error("[bot] Failed to shutdown cleanly:", error);
    process.exit(1);
  });
});

console.log("[bot] Starting bot...");
console.log(`[cron] Daily message schedule: ${DAILY_MESSAGE_CRON} (${CRON_TIMEZONE})`);

await initializeDatabase();
await setupBotMenu(bot);
bot.start();
