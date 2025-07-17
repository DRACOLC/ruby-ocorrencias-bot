import { Telegraf } from "telegraf";
import { setupCommands } from "./commands";

export const startBot = (botToken: string) => {
  const bot = new Telegraf(botToken);

  setupCommands(bot);

  bot.launch();
  console.log("🤖 Bot iniciado com sucesso!");
};
