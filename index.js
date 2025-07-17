require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Lista de logins autorizados
const loginsAutorizados = ['Z123456', 'Z481036', 'L1234', 'T78901'];

// Armazena usuários que fizeram login com sucesso
const usuariosLogados = new Map();

// Comando /start
bot.start((ctx) => {
  ctx.reply(
    '🤖 Bem-vindo ao Ruby Ocorrências!\n\n' +
    'Para acessar, use o comando:\n/login SEUCÓDIGO\n\n' +
    'Exemplo:\n/login Z123456\n\n' +
    'Após login, você poderá usar os comandos:\n/ocorrencia\n/confirmar\n/historico\n/status'
  );
});

// Comando /login
bot.command('login', (ctx) => {
  const args = ctx.message.text.split(' ');

  if (args.length < 2) {
    return ctx.reply('❗ Por favor, envie seu login no formato: /login Z123456');
  }

  const login = args[1].toUpperCase();

  if (!loginsAutorizados.includes(login)) {
    return ctx.reply(
      '❌ Acesso negado. Usuário não autorizado como técnico.\n\n' +
      'Entre em contato com o administrador para solicitar acesso.'
    );
  }

  usuariosLogados.set(ctx.from.id, { login });
  return ctx.reply(`✅ Login realizado com sucesso! Bem-vindo, técnico ${login}!`);
});

// Middleware para bloquear comandos de usuários não logados (exceto /start e /login)
bot.use((ctx, next) => {
  const userId = ctx.from.id;
  const texto = ctx.message?.text || '';
  const comando = texto.split(' ')[0];

  const comandosLiberados = ['/start', '/login'];

  if (!usuariosLogados.has(userId) && !comandosLiberados.includes(comando)) {
    return ctx.reply('❌ Faça login primeiro com /login para continuar.');
  }
  return next();
});

// Comando /ocorrencia - só para logados
bot.command('ocorrencia', (ctx) => {
  ctx.reply(
    '🛠️ Selecione o tipo de ocorrência:\n\n' +
    '1️⃣ Rede Externa\n2️⃣ NAP GPON\n3️⃣ Backbone\n4️⃣ Backbone GPON'
  );
});

// Comando /confirmar
bot.command('confirmar', (ctx) => {
  ctx.reply('✅ Formulário confirmado! Os dados serão enviados à equipe responsável.');
});

// Comando /historico
bot.command('historico', (ctx) => {
  ctx.reply('📋 Suas últimas ocorrências serão exibidas aqui (funcionalidade futura).');
});

// Comando /status [contrato]
bot.command('status', (ctx) => {
  const parts = ctx.message.text.split(' ');
  if (parts.length < 2) {
    return ctx.reply('❗ Use o comando assim: /status 12345678');
  }
  const contrato = parts[1];
  ctx.reply(`🔎 Consultando status do contrato ${contrato}... (em breve)`);
});

bot.launch();
console.log('🤖 Bot Ruby Ocorrências rodando...');
