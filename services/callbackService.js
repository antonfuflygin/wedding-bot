import { CALLBACK_ACTIONS } from "../keyboards/mainKeyboard.js";
import { getEventLocation } from "./eventLocationService.js";
import { getAdmins } from "./userService.js";

const EVENT_INFO = {
  [CALLBACK_ACTIONS.PALACE]: {
    title: "ЗАГС",
    description: "Место проведения церемонии бракосочетания."
  },
  [CALLBACK_ACTIONS.RESTAURANT]: {
    title: "Ресторан",
    description: "Место проведения банкета."
  }
};

function formatStartTime(startsAt, timeZone) {
  if (!startsAt) {
    return null;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone
  }).format(new Date(startsAt));
}

function formatAdminContact(admin) {
  const name = [admin.first_name, admin.last_name].filter(Boolean).join(" ");

  if (admin.username) {
    return name ? `${name} — @${admin.username}` : `@${admin.username}`;
  }

  return name || "Организатор";
}

export async function handleEventLocationCallback(ctx, action, timeZone) {
  const eventInfo = EVENT_INFO[action];
  const location = await getEventLocation(action);

  if (!location) {
    await ctx.reply(`${eventInfo?.title || action}: информация пока не добавлена.`);
    return;
  }

  const startTime = formatStartTime(location.starts_at, timeZone);

  await ctx.reply(`📍 ${eventInfo.title}\n\n${eventInfo.description}`);

  if (location.latitude != null && location.longitude != null) {
    await ctx.replyWithLocation(location.latitude, location.longitude);
  }

  if (location.map_url) {
    await ctx.reply(`🗺 Карта: ${location.map_url}`);
  }

  if (startTime) {
    await ctx.reply(`🕐 ${eventInfo.title} — начало: ${startTime}`);
  }
}

export async function handleContactCallback(ctx) {
  const admins = await getAdmins();

  if (admins.length === 0) {
    await ctx.reply("Контакт организатора пока не настроен.");
    return;
  }

  const contacts = admins.map((admin) => `• ${formatAdminContact(admin)}`).join("\n");
  await ctx.reply(`Связаться с организатором:\n\n${contacts}`);
}
