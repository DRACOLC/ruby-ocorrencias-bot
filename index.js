require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Simulação: lista de logins autorizados
const loginsAutorizados = ['Z123456', 'Z481036', 'L1234', 'T78901'];

// Armazena os usuários cadastrados: { login, nome, area, telefone }
const usuariosCadastrados = new Map();

// Armazena estados de cadastro por userId
const estadosCadastro = new Map();

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const texto = ctx.message.text.trim();

  // Se o usuário está cadastrado, pode usar comandos normalmente
  if (usuariosCadastrados.has(userId)) {
    // Pode implementar comandos ou ignorar mensagens de texto livres aqui
    return;
  }

  // Se estiver em cadastro, continua o fluxo
  if (estadosCadastro.has(userId)) {
    const estado = estadosCadastro.get(userId);

    switch (estado.etapa) {
      case 'pedirLogin': {
        const login = texto.toUpperCase();
        if (!/^[A-Z]{1}\d{3,6}$/.test(login)) {
          return ctx.reply('❗ Formato inválido. Digite seu login (ex: Z123456):');
        }
        // Se login está autorizado, mas não cadastrado ainda
        if (!loginsAutorizados.includes(login)) {
          return ctx.reply('🚫 Login não autorizado. Entre em contato com o supervisor.');
        }
        estado.login = login;

        // Aqui diz que login não encontrado = precisa cadastrar
        estado.etapa = 'pedirNome';
        estadosCadastro.set(userId, estado);

        return ctx.reply(
          `🔐 Primeiro Acesso - Cadastro Obrigatório\n\n` +
          `Olá! Seu login ${login} não foi encontrado no sistema.\n` +
          `Para continuar, você p
