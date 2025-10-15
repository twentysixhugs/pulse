
import * as functions from "firebase-functions";
import { Telegraf } from "telegraf";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Инициализация Firebase Admin SDK
initializeApp();
getFirestore();

// Получаем токен из переменных окружения
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  console.error("Telegram bot token is not set in environment variables.");
}

const bot = new Telegraf(botToken!);

bot.start((ctx) => ctx.reply("Добро пожаловать!"));

// HTTP-функция для вебхука
export const telegramWebhook = functions.https.onRequest(async (req, res) => {
  if (bot) {
    try {
      await bot.handleUpdate(req.body);
      res.sendStatus(200);
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(500);
  }
});
