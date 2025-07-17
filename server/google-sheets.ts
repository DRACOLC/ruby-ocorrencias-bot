import { google } from "googleapis";
import path from "path";
import fs from "fs";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "..", "credentials.json"),
  scopes: SCOPES,
});

export const getSheetClient = async () => {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: authClient });
  return sheets;
};

export const getUserFromSheet = async (sheetId: string, login: string) => {
  const sheets = await getSheetClient();
  const range = "Página1!A:B"; // Ajuste conforme sua planilha
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });

  const rows = response.data.values;
  if (!rows) return null;

  for (const row of rows) {
    if (row[1] === login) {
      return {
        nome: row[0],
        matricula: row[1],
      };
    }
  }

  return null;
};
