// googleSheets.js
const { google } = require('googleapis');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const SPREADSHEET_ID = '1o6UwDTMZGyehaTAvdtyF7mD3vd1ZvgiEc2OEtiSG450';
const RANGE = 'Colaboradores!A2:E';

let tecnicos = [];

async function autenticarGoogleSheets() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

async function carregarTecnicos() {
  const sheets = await autenticarGoogleSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });

  const rows = res.data.values || [];

  tecnicos = rows.map(row => ({
    nome: row[0] || '',
    login: (row[1] || '').toUpperCase(),
    empresa: row[2] || '',
    area: row[3] || '',
    telefone: row[4] || '',
  }));

  console.log('Técnicos carregados:', tecnicos);
}

function buscarTecnicoPorLogin(login) {
  return tecnicos.find(t => t.login === login.toUpperCase());
}

module.exports = { carregarTecnicos, buscarTecnicoPorLogin };
