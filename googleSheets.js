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

    // Busca a aba pelo nome "Colaboradores"
    const sheet = doc.sheetsByTitle['Colaboradores'] || doc.sheetsByIndex[0];

    const rows = await sheet.getRows();

    console.log("🔍 Logins encontrados na planilha:");
    rows.forEach(row => console.log(row.LOGIN));

    // Normaliza login para maiúsculas e tira espaços
    const tecnico = rows.find(row => {
      if (!row.LOGIN) return false;
      return String(row.LOGIN).trim().toUpperCase() === login.trim().toUpperCase();
    });

    if (!tecnico) {
      console.log(`❌ Técnico com login ${login} não encontrado`);
      return null;
    }

    // Retorna um objeto com os dados principais
    return {
      nomeCompleto: tecnico['NOME COMPLETO'] || '',
      login: tecnico.LOGIN,
      areaAtuacao: tecnico['ÁREA'] || '',
      telefone: tecnico['TELEFONE'] || '',
      ativo: true // se quiser controlar ativo, crie coluna e ajuste aqui
    };

  } catch (error) {
    console.error("❌ Erro ao buscar técnico:", error);
    return null;
  }
}

module.exports = {
  buscarTecnicoPorLogin,
};
