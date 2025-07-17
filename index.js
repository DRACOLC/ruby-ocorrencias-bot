require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { getColaboradores } = require('./googleSheets');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

let usuariosAutenticados = {};

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '👋 Olá! Digite seu login para começar:');
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const texto = msg.text.trim();

  // Ignorar comandos
  if (texto.startsWith('/')) return;

  const colaboradores = await getColaboradores();
  const colaborador = colaboradores.find(col => col.login === texto);

  if (colaborador) {
    usuariosAutenticados[chatId] = colaborador;
    bot.sendMessage(chatId, `✅ Login autorizado, ${colaborador.nome}!\n\nComandos disponíveis:\n/ocorrencia - Iniciar abertura de ocorrência\n/confirmar - Confirmar envio\n/historico - Ver ocorrências\n/status - Status atual`);
  } else {
    bot.sendMessage(chatId, '❌ Acesso negado. Usuário não autorizado como técnico.\n\nEntre em contato com o administrador para solicitar acesso.');
  }
});
