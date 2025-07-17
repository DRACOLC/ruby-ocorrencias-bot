import TelegramBot from 'node-telegram-bot-api';
import { storage } from '../storage';
import { log } from '../vite';
import { 
  initializeGoogleSheets, 
  buscarUsuario, 
  buscarAdmin, 
  validarFormatoLogin, 
  adicionarUsuario,
  FORMULARIOS_OCORRENCIA,
  UserData,
  AdminData
} from '../google-sheets';

// Estado de sessão para usuários
const userSessions = new Map<string, {
  awaitingLogin?: boolean;
  awaitingRegistration?: boolean;
  awaitingOcorrencia?: boolean;
  currentOcorrencia?: any;
  step?: string;
  registrationData?: Partial<UserData>;
}>();

export async function setupCommands(bot: TelegramBot): Promise<void> {
  // Inicializar Google Sheets
  initializeGoogleSheets();

  // Set bot commands for better UX
  await bot.setMyCommands([
    { command: 'start', description: 'Iniciar o uso do bot' },
    { command: 'help', description: 'Mostrar mensagem de ajuda' },
    { command: 'login', description: 'Autenticar como técnico' },
    { command: 'ocorrencia', description: 'Abrir nova ocorrência' },
    { command: 'historico', description: 'Ver ocorrências recentes' },
    { command: 'status', description: 'Consultar status por contrato' },
  ]);

  // Command handlers
  bot.onText(/\/start/, (msg) => handleStart(msg, bot));
  bot.onText(/\/help/, (msg) => handleHelp(msg, bot));
  bot.onText(/\/login/, (msg) => handleLogin(msg, bot));
  bot.onText(/\/ocorrencia/, (msg) => handleOcorrencia(msg, bot));
  bot.onText(/\/historico/, (msg) => handleHistorico(msg, bot));
  bot.onText(/\/status (.+)/, (msg, match) => handleStatusContrato(msg, match, bot));

  // Handle text messages based on user session
  bot.on('message', async (msg) => {
    const telegramId = msg.from?.id.toString();
    if (!telegramId || !msg.text) return;

    const session = userSessions.get(telegramId);
    
    if (msg.text.startsWith('/')) {
      if (!isKnownCommand(msg.text)) {
        await bot.sendMessage(msg.chat.id, 
          'Comando desconhecido. Use /help para ver os comandos disponíveis.');
      }
      return;
    }

    // Handle session-based conversations
    if (session?.awaitingLogin) {
      await handleLoginFlow(bot, msg, session);
    } else if (session?.awaitingRegistration) {
      await handleRegistrationFlow(bot, msg, session);
    } else if (session?.awaitingOcorrencia) {
      await handleOcorrenciaFlow(bot, msg, session);
    }
  });

  log('Comandos do bot configurados');
}

// Handle callback queries (inline keyboard buttons)
export function handleCallbackQuery(bot: TelegramBot): void {
  bot.on('callback_query', async (query) => {
    const chatId = query.message?.chat.id;
    const telegramId = query.from?.id.toString();
    const data = query.data;
    
    if (!chatId || !telegramId || !data) return;

    if (data.startsWith('occ_')) {
      const opcao = data.replace('occ_', '');
      const formulario = FORMULARIOS_OCORRENCIA[opcao as keyof typeof FORMULARIOS_OCORRENCIA];
      
      if (formulario) {
        // Limpar sessão
        userSessions.delete(telegramId);

        // Registrar tentativa de ocorrência
        const user = await storage.getUserByTelegramId(telegramId);
        if (user) {
          await storage.createOcorrencia({
            userId: user.id,
            numeroContrato: 'PENDENTE',
            tipoOcorrencia: formulario.nome,
            descricao: `Formulário ${formulario.nome} enviado via Telegram`,
            status: 'em_andamento'
          });
        }

        await bot.editMessageText(
          `✅ *Ocorrência selecionada:* ${formulario.nome}

📝 Clique no link abaixo para preencher o formulário da ocorrência:
👉 [${formulario.nome}](${formulario.url})

Após preencher, você receberá uma confirmação aqui mesmo!

✅ *Ocorrência gerada com sucesso!*`, 
          {
            chat_id: chatId,
            message_id: query.message?.message_id,
            parse_mode: 'Markdown'
          }
        );
      }
    }

    // Answer callback query to remove loading state
    await bot.answerCallbackQuery(query.id);
  });
}

async function handleStart(msg: TelegramBot.Message, bot: TelegramBot): Promise<void> {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  
  if (!telegramId) {
    await bot.sendMessage(chatId, 'Erro: Não foi possível identificar o usuário.');
    return;
  }

  try {
    // Verificar se o usuário já existe
    let user = await storage.getUserByTelegramId(telegramId);
    
    if (!user) {
      // Criar novo usuário
      user = await storage.createUser({
        telegramId,
        username: msg.from?.username,
        firstName: msg.from?.first_name,
        lastName: msg.from?.last_name,
      });
    }

    const welcomeMessage = `🤖 *Bem-vindo ao Ruby Ocorrências Bot!*

Olá ${msg.from?.first_name}! 👋

Este bot foi desenvolvido para facilitar o registro de ocorrências técnicas em campo.

📋 *Comandos disponíveis:*
• /login - Autenticar como técnico
• /ocorrencia - Registrar nova ocorrência
• /historico - Ver suas ocorrências
• /status <número> - Consultar por contrato
• /help - Mostrar esta ajuda

🔐 Para começar a usar, faça seu login com o comando /login

*Ruby Telecom - Sistema de Ocorrências*`;

    await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    log('Erro no comando /start:', error);
    await bot.sendMessage(chatId, 'Ocorreu um erro ao inicializar. Tente novamente.');
  }
}

async function handleLogin(msg: TelegramBot.Message, bot: TelegramBot): Promise<void> {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  
  if (!telegramId) {
    await bot.sendMessage(chatId, 'Erro: Não foi possível identificar o usuário.');
    return;
  }

  try {
    // Verificar se o usuário já está autenticado
    const user = await storage.getUserByTelegramId(telegramId);
    if (user?.isAuthenticated) {
      await bot.sendMessage(chatId, 
        `✅ Você já está autenticado como: *${user.nomeCompleto || user.login}*\n\nUse /ocorrencia para registrar uma nova ocorrência.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Iniciar processo de login
    userSessions.set(telegramId, { awaitingLogin: true });
    
    await bot.sendMessage(chatId, 
      `🔐 *Autenticação de Técnico*

Por favor, digite seu login no formato:
*Uma letra seguida de 3 a 6 números*

Exemplo: Z481036

Digite seu login:`, 
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    log('Erro no comando /login:', error);
    await bot.sendMessage(chatId, 'Ocorreu um erro durante a autenticação. Tente novamente.');
  }
}

async function handleLoginFlow(bot: TelegramBot, msg: TelegramBot.Message, session: any): Promise<void> {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  const login = msg.text?.trim().toUpperCase();
  
  if (!telegramId || !login) return;

  try {
    // Validar formato do login
    if (!validarFormatoLogin(login)) {
      await bot.sendMessage(chatId, 
        `❌ *Formato inválido!*

O login deve ter:
• Uma letra seguida de 3 a 6 números
• Exemplo: Z481036

Digite novamente:`, 
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Buscar usuário na planilha
    const userData = await buscarUsuario(login);
    if (!userData) {
      // Buscar se é admin
      const adminData = await buscarAdmin(login);
      if (!adminData) {
        await bot.sendMessage(chatId, 
          `❌ *Login não encontrado!*

O login "${login}" não está cadastrado no sistema.

Entre em contato com a administração para obter acesso.`, 
          { parse_mode: 'Markdown' }
        );
        userSessions.delete(telegramId);
        return;
      }
      
      // É admin, mas precisa estar na planilha de usuários também
      await bot.sendMessage(chatId, 
        `⚠️ *Administrador encontrado*

Seu login foi encontrado como administrador, mas você precisa estar cadastrado também na planilha de usuários.

Entre em contato com a administração.`, 
        { parse_mode: 'Markdown' }
      );
      userSessions.delete(telegramId);
      return;
    }

    // Verificar se usuário está ativo
    if (!userData.ativo) {
      await bot.sendMessage(chatId, 
        `❌ *Usuário inativo*

Seu login está desativado no sistema.

Entre em contato com a administração.`, 
        { parse_mode: 'Markdown' }
      );
      userSessions.delete(telegramId);
      return;
    }

    // Verificar se é admin também
    const adminData = await buscarAdmin(login);
    const isAdmin = adminData?.ativo || false;

    // Atualizar usuário no banco local
    await storage.updateUserByTelegramId(telegramId, {
      login: userData.login,
      nomeCompleto: userData.nomeCompleto,
      telefone: userData.telefone,
      areaAtuacao: userData.areaAtuacao,
      isAuthenticated: true,
      isAdmin: isAdmin
    });

    // Limpar sessão
    userSessions.delete(telegramId);

    // Enviar confirmação
    await bot.sendMessage(chatId, 
      `✅ *Login realizado com sucesso!*

Bem-vindo, *${userData.nomeCompleto}*

📋 *Seus dados:*
• Login: ${userData.login}
• Área: ${userData.areaAtuacao}
• Telefone: ${userData.telefone}
${isAdmin ? '• 👑 Administrador' : ''}

Agora você pode usar /ocorrencia para registrar ocorrências.`, 
      { parse_mode: 'Markdown' }
    );

  } catch (error) {
    log('Erro no fluxo de login:', error);
    await bot.sendMessage(chatId, 
      'Erro ao processar login. Verifique sua conexão e tente novamente.');
    userSessions.delete(telegramId);
  }
}

// Função para verificar comandos conhecidos
function isKnownCommand(text: string): boolean {
  const knownCommands = ['/start', '/help', '/login', '/ocorrencia', '/historico', '/status'];
  return knownCommands.some(cmd => text.startsWith(cmd));
}

// Placeholder para outras funções - implementar conforme necessário
async function handleHelp(msg: TelegramBot.Message, bot: TelegramBot): Promise<void> {
  // Implementar função de ajuda
}

async function handleOcorrencia(msg: TelegramBot.Message, bot: TelegramBot): Promise<void> {
  // Implementar função de ocorrência
}

async function handleOcorrenciaFlow(bot: TelegramBot, msg: TelegramBot.Message, session: any): Promise<void> {
  // Implementar fluxo de ocorrência
}

async function handleHistorico(msg: TelegramBot.Message, bot: TelegramBot): Promise<void> {
  // Implementar histórico
}

async function handleStatusContrato(msg: TelegramBot.Message, match: RegExpExecArray | null, bot: TelegramBot): Promise<void> {
  // Implementar consulta por contrato
}

async function handleRegistrationFlow(bot: TelegramBot, msg: TelegramBot.Message, session: any): Promise<void> {
  // Implementar fluxo de registro se necessário
}
