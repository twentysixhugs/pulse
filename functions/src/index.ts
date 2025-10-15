
import * as functions from "firebase-functions";
import { Telegraf } from "telegraf";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import "dotenv/config";

// Инициализация Firebase Admin SDK
initializeApp();
getFirestore();

// Получаем токен из переменных окружения
const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (!botToken) {
  console.error("Telegram bot token is not set in environment variables.");
  throw new Error("Telegram bot token is not set");
}

const bot = new Telegraf(botToken);

bot.start((ctx) => ctx.reply("Привет"));

// HTTP-функция для вебхука
export const telegramWebhook = functions.https.onRequest(async (req, res) => {
    try {
      await bot.handleUpdate(req.body, res);
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
});
