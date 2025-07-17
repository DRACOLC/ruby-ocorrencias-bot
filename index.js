require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Simulação de banco de dados (cadastros)
const usuariosCadastrados = new Map();

// Middleware para verificar se o usuário está cadastrado
bot.use((ctx, next) => {
  const userId = ctx.from.id;
  const permitido = usuariosCadastrados.has(userId);

  const comandosPermitidos = ['/start', '/cadastrar'];

  if (!permitido && !comandosPermitidos.includes(ctx.message?.text?.split(' ')[0])) {
    ctx.reply('❌ Você não está cadastrado. Use /cadastrar para se registrar.');
  } else {
    return next();
  }
});

// Comando /start
bot.start((ctx) => {
  ctx.reply(`👋 Olá, ${ctx.from.first_name}!\nUse /cadastrar para se registrar.`);
});

// Comando /cadastrar
bot.command('cadastrar', (ctx) => {
  const parts = ctx.message.text.split(' ');
  if (parts.length < 3) {
    return ctx.reply('ℹ️ Use o comando assim:\n/cadastrar Nome_Completo CPF');
  }

  const nome = parts.slice(1, parts.length - 1).join(' ');
  const cpf = parts[parts.length - 1];

  usuariosCadastrados.set(ctx.from.id, { nome, cpf });
  ctx.reply(`✅ Cadastro realizado com sucesso, ${nome}!`);
});

// Comando /login
bot.command('login', (ctx) => {
  const user =
