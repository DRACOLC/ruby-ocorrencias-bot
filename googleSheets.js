import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const USERS_SHEET_ID = '1o6UwDTMZGyehaTAvdtyF7mD3vd1ZvgiEc2OEtiSG450';
const ADMINS_SHEET_ID = '1SCsmn4tcQWA42q5tVYALtrcJ775MRb6ynbD3f97JmFs';

// Initialize Google Sheets client
let auth: JWT;
let sheets: any;

export function initializeGoogleSheets() {
  try {
    if (!process.env.GOOGLE_CREDENTIALS_JSON) {
      console.log('Google Sheets credentials not found, using mock mode');
      return false;
    }

    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    
    if (!credentials.client_email || !credentials.private_key) {
      console.log('Invalid Google credentials format, using mock mode');
      return false;
    }

    // Fix private key format
    const privateKey = credentials.private_key.replace(/\\n/g, '\n');
    
    auth = new JWT({
      email: credentials.client_email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    sheets = google.sheets({ version: 'v4', auth });
    console.log('Google Sheets API inicializada com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao inicializar Google Sheets API:', error);
    console.log('Using mock mode for development');
    return false;
  }
}

// Interface para dados do usuário
export interface UserData {
  login: string;
  nomeCompleto: string;
  telefone: string;
  areaAtuacao: string;
  ativo: boolean;
}

// Interface para dados do admin
export interface AdminData {
  login: string;
  nome: string;
  ativo: boolean;
}

// Buscar usuário na planilha de usuários
export async function buscarUsuario(login: string): Promise<UserData | null> {
  try {
    // Modo desenvolvimento - simular usuário válido para teste
    if (!sheets) {
      console.log('Google Sheets not initialized, using development mode');
      // Simular dados para desenvolvimento - REMOVER EM PRODUÇÃO
      if (login.match(/^[A-Za-z]\d{3,6}$/)) {
        return {
          login: login.toUpperCase(),
          nomeCompleto: `Técnico ${login}`,
          telefone: '(11) 99999-9999',
          areaAtuacao: 'Desenvolvimento',
          ativo: true
        };
      }
      return null;
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: USERS_SHEET_ID,
      range: 'A:E', // Colunas: Login, Nome Completo, Telefone, Área Atuação, Ativo
    });

    const rows = response.data.values || [];
    
    // Pular cabeçalho (primeira linha)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[0] && row[0].toLowerCase() === login.toLowerCase()) {
        return {
          login: row[0],
          nomeCompleto: row[1] || '',
          telefone: row[2] || '',
          areaAtuacao: row[3] || '',
          ativo: row[4] === 'TRUE' || row[4] === 'VERDADEIRO' || row[4] === '1'
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    throw error;
  }
}

// Buscar admin na planilha de admins
export async function buscarAdmin(login: string): Promise<AdminData | null> {
  try {
    // Modo desenvolvimento
    if (!sheets) {
      console.log('Google Sheets not initialized, using development mode for admin check');
      return null;
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: ADMINS_SHEET_ID,
      range: 'A:C', // Colunas: Login, Nome, Ativo
    });

    const rows = response.data.values || [];
    
    // Pular cabeçalho (primeira linha)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[0] && row[0].toLowerCase() === login.toLowerCase()) {
        return {
          login: row[0],
          nome: row[1] || '',
          ativo: row[2] === 'TRUE' || row[2] === 'VERDADEIRO' || row[2] === '1'
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar admin:', error);
    throw error;
  }
}

// Validar formato do login (uma letra + 3-6 números)
export function validarFormatoLogin(login: string): boolean {
  const regex = /^[A-Za-z]\d{3,6}$/;
  return regex.test(login);
}

// Adicionar novo usuário à planilha (primeiro acesso)
export async function adicionarUsuario(userData: Omit<UserData, 'ativo'>): Promise<boolean> {
  try {
    const values = [
      [userData.login, userData.nomeCompleto, userData.telefone, userData.areaAtuacao, 'TRUE']
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: USERS_SHEET_ID,
      range: 'A:E',
      valueInputOption: 'RAW',
      resource: { values }
    });

    console.log(`Usuário ${userData.login} adicionado à planilha`);
    return true;
  } catch (error) {
    console.error('Erro ao adicionar usuário:', error);
    return false;
  }
}

// URLs dos formulários por tipo de ocorrência
// IMPORTANTE: Substitua pelos links reais dos Google Forms
export const FORMULARIOS_OCORRENCIA = {
  '1': {
    nome: 'Rede Externa',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSdRede_Externa_Form/viewform'
  },
  '2': {
    nome: 'Rede Externa NAP GPON',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSdRede_Externa_NAP_GPON_Form/viewform'
  },
  '3': {
    nome: 'Backbone',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSdBackbone_Form/viewform'
  },
  '4': {
    nome: 'Backbone GPON',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSdBackbone_GPON_Form/viewform'
  }
};
