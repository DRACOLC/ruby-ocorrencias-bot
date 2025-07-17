import { Telegraf, Context } from "telegraf";
import { getUserFromSheet } from "../google-sheets";

const SHEET_ID = process.env.SHEET_ID!;

export const setupCommands = (bot: Telegraf<Context>) => {
  bot.start((ctx) => {
    ctx.reply(
      "🤖 BOT DE OCORRÊNCIA TÉCNICA – REDE EXTERNA\n\n" +
      "Bem-vindo ao sistema de registro de ocorrências!\n\n" +
      "Para começar, faça login usando o comando:\n/login\n\n" +
      "📋 Comandos disponíveis:\n" +
      "/login - Autenticação do técnico\n" +
      "/ocorrencia - Iniciar abertura de ocorrência\n" +
      "/confirmar - Registrar que o formulário foi enviado\n" +
      "/historico - Ver ocorrências anteriores\n" +
      "/status - Ver status da ocorrência"
    );
  });

  const sessions = new Map();

  bot.command("login", (ctx) => {
    ctx.reply("🔐 Digite sua matrícula:");
    sessions.set(ctx.chat.id, { step: "WAITING_FOR_MATRICULA" });
  });

  bot.on("text", async (ctx) => {
    const session = sessions.get(ctx.chat.id);
    if (!session) return;

    if (session.step === "WAITING_FOR_MATRICULA") {
      const login = ctx.message.text.trim();
      const user = await getUserFromSheet(SHEET_ID, login);

      if (user) {
        sessions.set(ctx.chat.id, null);
        ctx.reply(`✅ *Login realizado com sucesso!*\n\nBem-vindo, *${user.nome}*!`, {
          parse_mode: "Markdown",
        });
      } else {
        ctx.reply("❌ Matrícula não encontrada. Tente novamente.");
      }
    }
  });
};
