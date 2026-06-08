import { InlineKeyboard } from "grammy";

export const CALLBACK_ACTIONS = {
  PALACE: "palace",
  RESTAURANT: "restaurant",
  CONTACT: "contact",
};

export function createMainKeyboard() {
  return new InlineKeyboard()
    .text("ЗАГС", CALLBACK_ACTIONS.PALACE)
    .row()
    .text("Ресторан", CALLBACK_ACTIONS.RESTAURANT)
    .row()
    .text("Связаться с организатором", CALLBACK_ACTIONS.CONTACT)
    .row()
}
