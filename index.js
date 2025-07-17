require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Comando /start
bot.start((ctx) => {
  ctx.reply(`👋 Olá, ${ctx.from.first_name}!\nUse /login para acessar o sistema.`);
});

// Comando /login
bot.command('login', (ctx) => {
  ctx.reply(`🔐 Login realizado com sucesso!\nBem-vindo, ${ctx.from.first_name}!`);
});

// Comando /ocorrencia (ainda será expandido)
bot.command('ocorrencia', (ctx) => {
  ctx.reply('🛠️ Selecione o tipo de ocorrência:\n\n1️⃣ Rede Externa\n2️⃣ NAP GPON\n3️⃣ Backbone\n4️⃣ Backbone GPON');
});

// Comando /confirmar
bot.command('confirmar', (ctx) => {
  ctx.reply('✅ Formulário confirmado! Os dados serão enviados à equipe responsável.');
});

// Comando /historico (placeholder)
bot.command('historico', (ctx) => {
  ctx.reply('📋 Aqui estarão suas últimas ocorrências (em breve).');
});

// Comando /status
bot.command('status', (ctx) => {
  const msg = ctx.message.text;
  const contrato = msg.split(' ')[1];
  if (!contrato) {
    ctx.reply('❗ Use o comando assim: /status [número do contrato]');
  } else {
    ctx.reply(`🔎 Consultando status do contrato ${contrato}... (em breve com dados reais)`);
  }
});

// Iniciar o bot
bot.launch();
console.log('🤖 Bot Ruby Ocorrências está rodando...');
