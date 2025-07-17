# 🤖 Ruby Ocorrências Bot – Telegram

Bot de Telegram para registro e acompanhamento de **ocorrências técnicas em campo**, com integração ao **Google Forms** e envio automático de e-mails.

## ✅ Objetivo

Automatizar o processo de abertura de ocorrências por técnicos de campo, garantindo:

- Preenchimento rápido e via Telegram
- Organização por número de contrato
- Notificação automática da equipe supervisora
- Envio de formulários e mídias por e-mail

---

## 🚀 Funcionalidades

| Comando         | Função                                           |
|------------------|--------------------------------------------------|
| `/start`         | Iniciar a conversa com o bot                     |
| `/login`         | Autenticar o técnico                             |
| `/ocorrencia`    | Iniciar processo de abertura de ocorrência       |
| `/confirmar`     | Confirmar envio de formulário preenchido         |
| `/historico`     | Ver ocorrências recentes registradas             |
| `/status [nº]`   | Consultar status de um chamado por contrato      |

---

## 📦 Tecnologias

- [Node.js](https://nodejs.org/)
- [Telegraf](https://telegraf.js.org/)
- [Google Forms](https://forms.google.com)
- [Google Apps Script](https://script.google.com) (para envio automático)
- [Render](https://render.com) (hospedagem gratuita)

---

## 🛠️ Como Rodar Localmente

```bash
git clone https://github.com/seu-usuario/ruby-ocorrencias-bot.git
cd ruby-ocorrencias-bot
npm install
