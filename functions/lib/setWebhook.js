"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-var-requires */
const axios_1 = __importDefault(require("axios"));
require("dotenv").config({ path: __dirname + "/../.env" });
const setWebhook = async () => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const region = "europe-central2";
    const functionName = "telegramWebhook";
    if (!botToken || !projectId) {
        console.error("TELEGRAM_BOT_TOKEN и FIREBASE_PROJECT_ID должны быть установлены в .env файле");
        return;
    }
    const webhookUrl = `https://${region}-${projectId}.cloudfunctions.net/${functionName}`;
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`;
    try {
        console.log(`Установка вебхука на URL: ${webhookUrl}`);
        const response = await axios_1.default.get(telegramApiUrl);
        if (response.data.ok) {
            console.log("Вебхук успешно установлен!");
            console.log(response.data.description);
        }
        else {
            console.error("Ошибка при установке вебхука:", response.data);
        }
    }
    catch (error) {
        console.error("Произошла ошибка:", error.message);
    }
};
setWebhook();
//# sourceMappingURL=setWebhook.js.map