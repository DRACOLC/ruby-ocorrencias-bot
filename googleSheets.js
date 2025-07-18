const { GoogleSpreadsheet } = require('google-spreadsheet');
const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);

const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

async function loadSheet() {
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  return doc;
}

async function buscarTecnicoPorLogin(login) {
  try {
    const doc = await loadSheet();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    console.log("🔍 Logins encontrados na planilha:");
    rows.forEach(row => console.log(row.LOGIN));

    const tecnico = rows.find((row) => String(row.LOGIN).trim() === login);
    return tecnico;

  } catch (error) {
    console.error("❌ Erro ao buscar técnico:", error);
    return null;
  }
}

module.exports = {
  buscarTecnicoPorLogin,
};
