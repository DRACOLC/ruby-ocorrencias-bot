const { buscarTecnicoPorLogin } = require('./googleSheets');

(async () => {
  const loginTeste = 'Z123456'; // o mesmo da planilha
  const tecnico = await buscarTecnicoPorLogin(loginTeste);

  if (tecnico) {
    console.log("✅ Técnico encontrado:");
    console.log({
      nome: tecnico['NOME COMPLETO'],
      area: tecnico['ÁREA'],
      telefone: tecnico['TELEFONE'],
    });
  } else {
    console.log("❌ Técnico não encontrado");
  }
})();
