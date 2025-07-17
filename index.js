require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Lista de logins autorizados (pode vir do banco depois)
const loginsAutorizados = ['Z123456', 'Z481036', 'L1234', 'T78901'];

// Armazena usuários cadastrados
const usuariosCadastrados = new Map();

// Estados possíveis para cadastro por usuário
const estadosCadastro = new Map();

bot.use(async (ctx, next) => {
  const userId = ctx.from.id;
  const texto = ctx.message?.text?.trim();

  const comandosLiberados = ['/start'];

  if (!usuariosCadastrados.has(userId) && !comandosLiberados.includes(texto?.split(' ')[0])) {
    // Está em processo de cadastro?
    const estado = estadosCadastro.get(userId);

    if (!estado) {
      // Se não está, pergunta o login
      estadosCadastro.set(userId, { etapa: 'pedirLogin' });
      return ctx.reply('🔐 Sistema de Manutenção de Rede Externa\n\nDigite seu login:');
    }

    // Está no processo, segue fluxo
    switch (estado.etapa) {
      case 'pedirLogin': {
        const login = texto.toUpperCase();
        if (!/^[A-Z]{1}\d{3,6}$/.test(login)) {
          return ctx.reply('❗ Login inválido. Digite novamente seu login (ex: Z123456):');
        }
        if (!loginsAutorizados.includes(login)) {
          return ctx.reply('🚫 Login não autorizado. Entre em contato com o supervisor.');
        }
        estado.login = login;
        estado.etapa = 'pedirNome';
        estadosCadastro.set(userId, estado);
        return ctx.reply(`🔐 Primeiro Acesso - Cadastro Obrigatório\n\nOlá! Seu login ${login} não foi encontrado no sistema.\nPara continuar, você precisa se cadastrar.\n\n👤 Digite seu nome completo:\nExemplo: João Silva Santos`);
      }
      case 'pedirNome': {
        if (texto.length < 3) {
          return ctx.reply('❌ Nome muito curto. Digite seu nome completo:');
        }
        estado.nome = texto.toUpperCase();
        estado.etapa = 'pedirArea';
        estadosCadastro.set(userId, estado);
        return ctx.reply(`✅ Nome registrado: ${estado.nome}\n\n🏢 Agora digite sua área de atuação:\nExemplos:\n• Rede Externa\n• Rede Interna\n• Fibra Óptica\n• Manutenção Preventiva\n• Suporte Técnico\n• Backbone`);
      }
      case 'pedirArea': {
        if (texto.length < 3) {
          return ctx.reply('❌ Área de atuação muito curta. Digite pelo menos 3 caracteres:');
        }
        estado.area = texto.toUpperCase();
        estado.etapa = 'pedirTelefone';
        estadosCadastro.set(userId, estado);
        return ctx.reply(`✅ Área registrada: ${estado.area}\n\n📱 Agora digite seu número de telefone:\nExemplos:\n• 11999887766\n• (11) 99988-7766\n• 11 99988-7766`);
      }
      case 'pedirTelefone': {
        // Simples validação: número com pelo menos 10 dígitos
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
            telefone: estado.telefone
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
  }

  return next();
});

// Comandos liberados somente para usuários cadastrados

bot.command('start', (ctx) => {
  ctx.reply(`👋 Olá, ${ctx.from.first_name}!\nUse /ocorrencia para iniciar uma nova ocorrência.`);
});

bot.command('ocorrencia', (ctx) => {
  ctx.reply('🛠️ Selecione o tipo de ocorrência:\n\n1️⃣ Rede Externa\n2️⃣ NAP GPON\n3️⃣ Backbone\n4️⃣ Backbone GPON');
});

bot.command('confirmar', (ctx) => {
  ctx.reply('✅ Formulário confirmado! Os dados serão enviados à equipe responsável.');
});

bot.command('historico', (ctx) => {
  ctx.reply('📋 Suas últimas ocorrências serão exibidas aqui (em breve).');
});

bot.command('status', (ctx) => {
  const msg = ctx.message.text;
  const contrato = msg.split(' ')[1];
  if (!contrato) {
    ctx.reply('❗ Use o comando assim: /status 12345678');
  } else {
    ctx.reply(`🔎 Consultando status do contrato ${contrato}... (em breve com dados reais)`);
  }
});

bot.launch();
console.log('🤖 Bot Ruby Ocorrências está rodando...');
