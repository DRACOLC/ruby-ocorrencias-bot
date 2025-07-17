import { bot } from "./bot";
import { config } from "dotenv";
import express from "express";
import cors from "cors";
import routes from "./routes";
import { setupSheets } from "./google-sheets";

config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("🤖 Ruby Ocorrências Bot está rodando!");
});

setupSheets().then(() => {
  bot.launch();
  app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  });
});

// Habilita parada limpa do bot (Ctrl+C)
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
