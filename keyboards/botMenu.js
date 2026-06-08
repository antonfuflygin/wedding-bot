export const BOT_COMMANDS = [
  { command: "palace", description: "Информация о ЗАГС" },
  { command: "restaurant", description: "Информация о ресторане" },
  { command: "contact", description: "Связаться с организатором" }
];

export async function setupBotMenu(bot) {
  await bot.api.setMyCommands(BOT_COMMANDS);
  await bot.api.setChatMenuButton({
    menu_button: { type: "commands" }
  });
}
