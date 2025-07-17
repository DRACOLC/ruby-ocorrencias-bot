const { google } = require('googleapis');
const fs = require('fs');

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const spreadsheetId = '1o6UwDTMZGyehaTAvdtyF7mD3vd1ZvgiEc2OEtiSG450';

async function getColaboradores() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Colaboradores!A2:E',
  });

  const rows = response.data.values;
  if (rows.length === 0) return [];

  return rows.map((row) => ({
    nome: row[0],
    login: row[1],
    empresa: row[2],
    area: row[3],
    telefone: row[4],
  }));
}

module.exports = { getColaboradores };
