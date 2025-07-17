require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Logins autorizados
const loginsAutorizados = ['Z123456', 'Z481036', 'L1234', 'T78901'];

// Usuários cadastrados na sessão
const usuariosCadastrados = new Map();

// Estados de cadastro por usuário
const estadosCadastro = new Map();

// Middleware para liberar apenas /start e cadastro para não cadastrados
bot.use((ctx, next) => {
  const userId = ctx.from.id;
  const texto = ctx.message?.text || '';
  const comando = texto.split(' ')[0];

  const comandosLiberados = ['/start'];

  if (!usuariosCadastrados.has(userId) && !comandosLiberados.includes(comando)) {
    return ctx.reply('❌ Acesso negado. Você precisa se cadastrar primeiro. Digite seu login para começar.');
  }
  return next();
});

// Handler para texto que não sejam comandos, para fluxo de cadastro
bot.on('text', (ctx, next) => {
  const userId = ctx.from.id;
  const texto = ctx.message.text.trim();

  // Ignora se for comando
  if (texto.startsWith('/')) return next();

  if (usuariosCadastrados.has(userId)) {
    // Usuário já cadastrado: pode ignorar ou tratar outras mensagens aqui
    return;
  }

  if (!estadosCadastro.has(userId)) {
    estadosCadastro.set(userId, { etapa: 'pedirLogin' });
    return ctx.reply('Digite seu login:');
  }

  const estado = estadosCadastro.get(userId);

  switch (estado.etapa) {
    case 'pedirLogin': {
      const login = texto.toUpperCase();
      if (!/^[A-Z]{1}\d{3,6}$/.test(login)) {
        return ctx.reply('❗ Formato inválido. Digite seu login (ex: Z123456):');
      }
      if (!loginsAutorizados.includes(login)) {
        return ctx.reply('🚫 Login não autorizado. Entre em contato com o supervisor.');
      }
      estado.login = login;
      estado.etapa = 'pedirNome';
      estadosCadastro.set(userId, estado);
      return ctx.reply(
        `🔐 Primeiro Acesso - Cadastro Obrigatório\n\n` +
        `Olá! Seu login ${login} não foi encontrado no sistema.\n` +
        `Para continuar, você precisa se cadastrar.\n\n` +
        `👤 Digite seu nome completo:\nExemplo: João Silva Santos`
      );
    }
    case 'pedirNome': {
      if (texto.length < 3) {
        return ctx.reply('❌ Nome muito curto. Digite seu nome completo:');
      }
      estado.nome = texto.toUpperCase();
      estado.etapa = 'pedirArea';
      estadosCadastro.set(userId, estado);
      return ctx.reply(
        `✅ Nome registrado: ${estado.nome}\n\n` +
        `🏢 Agora digite sua área de atuação:\n` +
        `Exemplos:\n• Rede Externa\n• Rede Interna\n• Fibra Óptica\n• Manutenção Preventiva\n• Suporte Técnico\n• Backbone`
      );
    }
    case 'pedirArea': {
      if (texto.length < 3) {
        return ctx.reply('❌ Área de atuação muito curta. Digite pelo menos 3 caracteres:');
      }
      estado.area = texto.toUpperCase();
      estado.etapa = 'pedirTelefone';
      estadosCadastro.set(userId, estado);
      return ctx.reply(
        `✅ Área registrada: ${estado.area}\n\n` +
        `📱 Agora digite seu número de telefone:\n` +
        `Exemplos:\n• 11999887766\n• (11) 99988-7766\n• 11 99988-7766`
      );
    }
    case 'pedirTelefone': {
      const numeros = texto.replace(/\D/g, '');
      if (numeros.length < 10) {
        return ctx.reply('❌ Número de telefone muito curto. Digite um número válido:');
      }
      estado.telefone = texto;
      estado.etapa = 'confirmar';
      estadosCadastro.set(userId, estado);
      return ctx.reply(
        `📋 Confirme seus dados:\n\n` +
        `🔐 Login: ${estado.login}\n` +
        `👤 Nome: ${estado.nome}\n` +
        `🏢 Área: ${estado.area}\n` +
        `📱 Telefone: ${estado.telefone}\n\n` +
        `✅ Digite CONFIRMAR para finalizar o cadastro\n` +
        `❌ Digite CANCELAR para recomeçar`
      );
    }
    case 'confirmar': {
      if (texto.toUpperCase() === 'CONFIRMAR') {
        usuariosCadastrados.set(userId, {
          login: estado.login,
          nome: estado.nome,
          area: estado.area,
          telefone: estado.telefone,
        });
        estadosCadastro.delete(userId);
        return ctx.reply(`✅ Cadastro finalizado com sucesso! Bem-vindo, ${estado.nome}!`);
      }
      if (texto.toUpperCase() === 'CANCELAR') {
        estadosCadastro.delete(userId);
        return ctx.reply('❌ Cadastro cancelado. Para começar novamente, digite seu login:');
      }
      return ctx.reply('❗ Digite CONFIRMAR para finalizar ou CANCELAR para recomeçar.');
    }
    default:
      estadosCadastro.delete(userId);
      return ctx.reply('❗ Ocorreu um erro, tente novamente.');
  }
});

// /start
bot.start((ctx) => {
  ctx.reply(
    `🤖 BOT DE OCORRÊNCIA TÉCNICA – REDE EXTERNA\n\n` +
    `Bem-vindo ao sistema de registro de ocorrências!\n\n` +
    `Para começar, digite seu login para acesso.\n\n` +
    `📋 Comandos disponíveis:\n` +
    `/ocorrencia - Iniciar abertura de ocorrência\n` +
    `/confirmar - Registrar que o formulário foi enviado\n` +
    `/historico - Ver ocorrências anteriores\n` +
    `/status - Ver status da ocorrência\n\n` +
    `ℹ️ Objetivo: Automatizar o processo de registro de ocorrências de rede externa.`
  );
});

// Comandos bloqueados para não cadastrados (além do /start)
bot.command('ocorrencia', (ctx) => {
  if (!usuariosCadastrados.has(ctx.from.id)) {
    return ctx.reply('❌ Você precisa estar cadastrado para usar este comando.');
  }
  ctx.reply('🛠️ Selecione o tipo de ocorrência:\n\n1️⃣ Rede Externa\n2️⃣ NAP GPON\n3️⃣ Backbone\n4️⃣ Backbone GPON');
});

bot.command('confirmar', (ctx) => {
  if (!usuariosCadastrados.has(ctx.from.id)) {
    return ctx.reply('❌ Você precisa estar cadastrado para usar este comando.');
  }
  ctx.reply('✅ Formulário confirmado! Os dados serão enviados à equipe responsável.');
});

bot.command('historico', (ctx) => {
  if (!usuariosCadastrados.has(ctx.from.id)) {
    return ctx.reply('❌ Você precisa estar cadastrado para usar este comando.');
  }
  ctx.reply('📋 Suas últimas ocorrências serão exibidas aqui (em breve).');
});

bot.command('status', (ctx) => {
  if (!usuariosCadastrados.has(ctx.from.id)) {
    return ctx.reply('❌ Você precisa estar cadastrado para usar este comando.');
  }
  const contrato = ctx.message.text.split(' ')[1];
  if (!contrato) {
    return ctx.reply('❗ Use o comando assim: /status 12345678');
  }
  ctx.reply(`🔎 Consultando status do contrato ${contrato}... (em breve com dados reais)`);
});

bot.launch();
console.log('🤖 Bot Ruby Ocorrências rodando...');
