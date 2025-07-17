require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Lista simulada de logins autorizados
const loginsAutorizados = ['Z481036', 'L1234', 'T78901'];

// Mapa para armazenar usuários cadastrados (em memória)
const usuariosCadastrados = new Map();

// Middleware para validar cadastro antes dos comandos
bot.use((ctx, next) => {
  const userId = ctx.from.id;
  const permitido = usuariosCadastrados.has(userId);
  const comando = ctx.message?.text?.split(' ')[0];

  const comandosLiberados = ['/start', '/cadastrar'];

  if (!permitido && !comandosLiberados.includes(comando)) {
    return ctx.reply('❌ Você ainda não está cadastrado. Use /cadastrar SEU_LOGIN_TÉCNICO para se autenticar.');
  }

  return next();
});

// /start
bot.start((ctx) => {
  ctx.reply(`👋 Olá, ${ctx.from.first_name}!\nUse o comando /cadastrar SEU_LOGIN_TÉCNICO para iniciar.`);
});

// /cadastrar Z481036
bot.command('cadastrar', (ctx) => {
  const partes = ctx.message.text.split(' ');
  const login = partes[1]?.toUpperCase();

  if (!login || !/^[A-Z]{1}\d{3,6}$/.test(login)) {
    return ctx.reply('❗ Formato inválido. Use assim: /cadastrar Z481036');
  }

  if (!loginsAutorizados.includes(login)) {
    return ctx.reply('🚫 Login não autorizado. Entre em contato com o supervisor.');
  }

  usuariosCadastrados.set(ctx.from.id, { login });
  ctx.reply(`✅ Cadastro realizado com sucesso!\nBem-vindo, técnico ${login}!`);
});

// /login
bot.command('login', (ctx) => {
  const user = usuariosCadastrados.get(ctx.from.id);
  ctx.reply(`🔐 Login realizado com sucesso!\nIdentificação: ${user.login}`);
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
  const msg = ctx.message.text;
  const contrato = msg.split(' ')[1];
  if (!contrato) {
    ctx.reply('❗ Use o comando assim: /status 12345678');
  } else {
    ctx.reply(`🔎 Consultando status do contrato ${contrato}... (em breve com dados reais)`);
  }
});

// Inicia o bot
bot.launch();
console.log('🤖 Bot Ruby Ocorrências está rodando...');
