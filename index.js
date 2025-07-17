require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Logins autorizados (simulação)
const loginsAutorizados = ['Z123456', 'Z481036', 'L1234', 'T78901'];

// Usuários cadastrados na sessão
const usuariosCadastrados = new Map();

// Middleware para bloquear comandos para não cadastrados
bot.use((ctx, next) => {
  const userId = ctx.from.id;
  const comando = ctx.message?.text?.split(' ')[0];
  const comandosLiberados = ['/start', '/login'];

  if (!usuariosCadastrados.has(userId) && !comandosLiberados.includes(comando)) {
    return ctx.reply('❌ Acesso negado. Usuário não autorizado como técnico.\n\nEntre em contato com o administrador para solicitar acesso.');
  }
  return next();
});

// /start
bot.start((ctx) => {
  ctx.reply(
    `🤖 BOT DE OCORRÊNCIA TÉCNICA – REDE EXTERNA\n\n` +
    `Bem-vindo ao sistema de registro de ocorrências!\n\n` +
    `Para começar, faça login usando o comando:\n/login SEU_CÓDIGO\n\n` +
    `📋 Comandos disponíveis:\n` +
    `/login - Autenticação do técnico\n` +
    `/ocorrencia - Iniciar abertura de ocorrência\n` +
    `/confirmar - Registrar que o formulário foi enviado\n` +
    `/historico - Ver ocorrências anteriores\n` +
    `/status - Ver status da ocorrência\n\n` +
    `ℹ️ Objetivo: Automatizar o processo de registro de ocorrências de rede externa, agilizando o atendimento e padronizando formulários.`
  );
});

// /login Z123456
bot.command('login', (ctx) => {
  const partes = ctx.message.text.split(' ');
  const login = partes[1]?.toUpperCase();

  if (!login || !/^[A-Z]{1}\d{3,6}$/.test(login)) {
    return ctx.reply('❗ Formato inválido. Use assim: /login Z123456');
  }

  if (!loginsAutorizados.includes(login)) {
    return ctx.reply('❌ Acesso negado. Usuário não autorizado como técnico.\n\nEntre em contato com o administrador para solicitar acesso.');
  }

  usuariosCadastrados.set(ctx.from.id, { login });
  return ctx.reply(`🔐 Login realizado com sucesso!\nBem-vindo, técnico ${login}!`);
});

// /ocorrencia
bot.command('ocorrencia', (ctx) => {
  ctx.reply('🛠️ Selecione o tipo de ocorrência:\n\n1️⃣ Rede Externa\n2️⃣ NAP GPON\n3️⃣ Backbone\n4️⃣ Backbone GPON');
});

// /confirmar
bot.command('confirmar', (ctx) => {
  ctx.reply('✅ Formulário confirmado! Os dados serão enviados à equipe responsável.');
});

// /historico
bot.command('historico', (ctx) => {
  ctx.reply('📋 Suas últimas ocorrências serão exibidas aqui (em breve).');
});

// /status [contrato]
bot.command('status', (ctx) => {
  const contrato = ctx.message.text.split(' ')[1];
  if (!contrato) {
    return ctx.reply('❗ Use o comando assim: /status 12345678');
  }
  ctx.reply(`🔎 Consultando status do contrato ${contrato}... (em breve com dados reais)`);
});

// Inicia o bot
bot.launch();
console.log('🤖 Bot Ruby Ocorrências está rodando...');
