// index.js
require('dotenv').config();
const { Telegraf } = require('telegraf');
const { carregarTecnicos, buscarTecnicoPorLogin } = require('./googleSheets');

const bot = new Telegraf(process.env.BOT_TOKEN);

const usuariosLogados = new Map();

(async () => {
  // Carrega técnicos antes de iniciar o bot
  await carregarTecnicos();

  bot.start((ctx) => {
    ctx.reply('🤖 Bem-vindo ao Ruby Ocorrências!\n\nDigite seu login para começar.\nExemplo: Z123456');
  });

  // Middleware para tratar mensagens que não sejam comandos
  bot.on('text', (ctx, next) => {
    const texto = ctx.message.text.trim();

    // Se usuário já está logado, deixa passar para próximos handlers
    if (usuariosLogados.has(ctx.from.id)) return next();

    // Se mensagem parece um login válido, tenta autenticar
    if (/^[A-Za-z]\d{3,6}$/.test(texto)) {
      const tecnico = buscarTecnicoPorLogin(texto);
      if (!tecnico) {
        return ctx.reply('❌ Login não encontrado ou usuário não autorizado.');
      }
      usuariosLogados.set(ctx.from.id, tecnico);
      return ctx.reply(`✅ Login confirmado! Bem-vindo, ${tecnico.nome}.\nÁrea: ${tecnico.area}`);
    }

    // Se não estiver logado e não enviou login, pede para digitar
    if (!usuariosLogados.has(ctx.from.id)) {
      return ctx.reply('🔐 Digite seu login para acessar o sistema.\nExemplo: Z123456');
    }
  });

  // Comandos que só usuários logados podem usar
  bot.use((ctx, next) => {
    if (!usuariosLogados.has(ctx.from.id)) {
      return ctx.reply('❌ Faça login primeiro digitando seu código (ex: Z123456).');
    }
    return next();
  });

  bot.command('ocorrencia', (ctx) => {
    ctx.reply('🛠️ Selecione o tipo de ocorrência:\n1️⃣ Rede Externa\n2️⃣ NAP GPON\n3️⃣ Backbone\n4️⃣ Backbone GPON');
  });

  bot.command('confirmar', (ctx) => {
    ctx.reply('✅ Formulário confirmado e enviado.');
  });

  bot.command('historico', (ctx) => {
    ctx.reply('📋 Histórico de ocorrências (em breve).');
  });

  bot.command('status', (ctx) => {
    const parts = ctx.message.text.split(' ');
    if (parts.length < 2) return ctx.reply('❗ Use: /status NUMERO_CONTRATO');
    ctx.reply(`🔎 Consultando status do contrato ${parts[1]}... (em breve)`);
  });

  bot.launch();
  console.log('🤖 Bot Ruby Ocorrências rodando...');
})();
