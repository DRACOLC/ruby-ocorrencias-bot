require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Lista dos logins autorizados (exemplo)
const loginsAutorizados = ['Z123456', 'Z481036', 'L1234', 'T78901'];

// Armazena dados dos usuários cadastrados: Map<userId, { login, nome, area, telefone }>
const usuariosCadastrados = new Map();

// Armazena estados do cadastro passo a passo: Map<userId, estado>
const estadosCadastro = new Map();

// --- Função para iniciar cadastro (pede login)
function iniciarCadastro(ctx) {
  estadosCadastro.set(ctx.from.id, { etapa: 'pedirLogin' });
  ctx.reply('🤖 Bem-vindo ao Ruby Ocorrências!\n\nDigite seu login para começar: (ex: Z123456)');
}

// --- Middleware para bloquear comandos para usuários não logados/cadastrados (exceto /start e /login)
bot.use((ctx, next) => {
  const userId = ctx.from.id;
  const texto = ctx.message?.text || '';
  const comando = texto.split(' ')[0];

  const comandosLiberados = ['/start', '/login'];

  if (!usuariosCadastrados.has(userId) && !comandosLiberados.includes(comando)) {
    return ctx.reply('❌ Faça login primeiro. Digite seu código de técnico para começar.');
  }
  return next();
});

// --- /start
bot.start((ctx) => {
  iniciarCadastro(ctx);
});

// --- Comando /login para login simples
bot.command('login', (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('❗ Por favor, envie seu login no formato: /login Z123456');
  }
  const login = args[1].toUpperCase();

  if (!loginsAutorizados.includes(login)) {
    return ctx.reply('❌ Acesso negado. Usuário não autorizado.\n\nContate o administrador.');
  }

  // Verifica se já cadastrado
  const jaCadastrado = Array.from(usuariosCadastrados.values()).some(u => u.login === login);

  if (!jaCadastrado) {
    estadosCadastro.set(ctx.from.id, { etapa: 'pedirNome', login });
    return ctx.reply(
      `🔐 Primeiro acesso detectado para ${login}.\n` +
      `Vamos fazer seu cadastro.\n\n` +
      `Por favor, digite seu nome completo:`
    );
  }

  // Login e cadastrado, libera acesso
  usuariosCadastrados.set(ctx.from.id, { login, nome: null, area: null, telefone: null });
  return ctx.reply(`✅ Login realizado com sucesso! Bem-vindo, técnico ${login}!`);
});

// --- Handler para mensagens de texto (fluxo de cadastro e login natural)
bot.on('text', (ctx, next) => {
  const userId = ctx.from.id;
  const texto = ctx.message.text.trim();

  // Ignora mensagens que começam com /
  if (texto.startsWith('/')) return next();

  // Se usuário já cadastrado, ignora (ou aqui pode colocar outras lógicas)
  if (usuariosCadastrados.has(userId)) {
    return; // Usuário já cadastrado pode usar comandos
  }

  // Se não está no fluxo de cadastro, inicia
  if (!estadosCadastro.has(userId)) {
    estadosCadastro.set(userId, { etapa: 'pedirLogin' });
    return ctx.reply('Digite seu login (ex: Z123456):');
  }

  const estado = estadosCadastro.get(userId);

  switch (estado.etapa) {
    case 'pedirLogin': {
      const login = texto.toUpperCase();

      if (!/^[A-Z]{1}\d{3,6}$/.test(login)) {
        return ctx.reply('❗ Formato inválido. Digite seu login (ex: Z123456):');
      }
      if (!loginsAutorizados.includes(login)) {
        return ctx.reply('🚫 Login não autorizado. Contate o administrador.');
      }

      // Verifica se já cadastrado
      const jaCadastrado = Array.from(usuariosCadastrados.values()).some(u => u.login === login);

      if (jaCadastrado) {
        usuariosCadastrados.set(userId, { login, nome: null, area: null, telefone: null });
        estadosCadastro.delete(userId);
        return ctx.reply(`✅ Login realizado com sucesso! Bem-vindo, técnico ${login}!`);
      }

      estado.login = login;
      estado.etapa = 'pedirNome';
      estadosCadastro.set(userId, estado);
      return ctx.reply(
        `🔐 Primeiro acesso detectado para ${login}.\n` +
        `Vamos fazer seu cadastro.\n\n` +
        `Digite seu nome completo:`
      );
    }

    case 'pedirNome': {
      if (texto.length < 3) return ctx.reply('❌ Nome muito curto. Digite seu nome completo:');
      estado.nome = texto.toUpperCase();
      estado.etapa = 'pedirArea';
      estadosCadastro.set(userId, estado);
      return ctx.reply('Agora digite sua área de atuação (mínimo 3 caracteres):');
    }

    case 'pedirArea': {
      if (texto.length < 3) return ctx.reply('❌ Área muito curta. Digite sua área de atuação:');
      estado.area = texto.toUpperCase();
      estado.etapa = 'pedirTelefone';
      estadosCadastro.set(userId, estado);
      return ctx.reply('Digite seu telefone (ex: 11999887766):');
    }

    case 'pedirTelefone': {
      const numeros = texto.replace(/\D/g, '');
      if (numeros.length < 10) return ctx.reply('❌ Telefone inválido. Digite um número válido:');
      estado.telefone = texto;
      estado.etapa = 'confirmar';
      estadosCadastro.set(userId, estado);
      return ctx.reply(
        `📋 Confirme seus dados:\n` +
        `Login: ${estado.login}\n` +
        `Nome: ${estado.nome}\n` +
        `Área: ${estado.area}\n` +
        `Telefone: ${estado.telefone}\n\n` +
        `Digite CONFIRMAR para finalizar ou CANCELAR para reiniciar cadastro.`
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
        return ctx.reply(`✅ Cadastro concluído com sucesso! Bem-vindo, ${estado.nome}!`);
      }
      if (texto.toUpperCase() === 'CANCELAR') {
        estadosCadastro.delete(userId);
        return ctx.reply('❌ Cadastro cancelado. Digite seu login para começar novamente.');
      }
      return ctx.reply('❗ Digite CONFIRMAR para finalizar ou CANCELAR para reiniciar cadastro.');
    }

    default: {
      estadosCadastro.delete(userId);
      return ctx.reply('❗ Erro inesperado. Digite seu login para começar.');
    }
  }
});

// --- Comandos liberados somente para usuários cadastrados ---

bot.command('ocorrencia', (ctx) => {
  if (!usuariosCadastrados.has(ctx.from.id)) return ctx.reply('❌ Faça login primeiro.');
  ctx.reply('🛠️ Selecione o tipo de ocorrência:\n1️⃣ Rede Externa\n2️⃣ NAP GPON\n3️⃣ Backbone\n4️⃣ Backbone GPON');
});

bot.command('confirmar', (ctx) => {
  if (!usuariosCadastrados.has(ctx.from.id)) return ctx.reply('❌ Faça login primeiro.');
  ctx.reply('✅ Formulário confirmado e enviado.');
});

bot.command('historico', (ctx) => {
  if (!usuariosCadastrados.has(ctx.from.id)) return ctx.reply('❌ Faça login primeiro.');
  ctx.reply('📋 Exibindo histórico (em breve).');
});

bot.command('status', (ctx) => {
  if (!usuariosCadastrados.has(ctx.from.id)) return ctx.reply('❌ Faça login primeiro.');
  const parts = ctx.message.text.split(' ');
  if (parts.length < 2) return ctx.reply('❗ Use: /status NUMERO_CONTRATO');
  ctx.reply(`🔎 Consultando status do contrato ${parts[1]}... (em breve)`);
});

bot.launch();
console.log('🤖 Bot Ruby Ocorrências rodando...');
