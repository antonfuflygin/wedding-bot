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

function formatEventTime(dateTime, timeZone) {
  if (!dateTime) {
    return null;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone
  }).format(new Date(dateTime));
}

function formatEventClockTime(dateTime, timeZone) {
  if (!dateTime) {
    return null;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone
  }).format(new Date(dateTime));
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

  const startTime = formatEventTime(location.starts_at, timeZone);
  const arrivalTime = formatEventClockTime(location.arrival, timeZone);

  await ctx.reply(`📍 ${eventInfo.title}\n\n${eventInfo.description}`);

  if (location.latitude != null && location.longitude != null) {
    await ctx.replyWithLocation(location.latitude, location.longitude);
  }

  if (location.map_url) {
    await ctx.reply(`🗺 Карта: ${location.map_url}`);
  }

  if (startTime || arrivalTime) {
    const timeMessageParts = [];

    if (startTime) {
      timeMessageParts.push(`🕐 ${eventInfo.title} — начало: ${startTime}`);
    }

    if (arrivalTime) {
      timeMessageParts.push(`СБОР ГОСТЕЙ В ${arrivalTime}!`);
    }

    await ctx.reply(timeMessageParts.join("\n\n"));
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
