/* eslint-disable @typescript-eslint/no-var-requires */
import axios from "axios";
require("dotenv").config({ path: __dirname + "/../.env" });

const setWebhook = async () => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const region = "us-central1"; // Или ваш регион
  const functionName = "telegramWebhook";

  if (!botToken || !projectId) {
    console.error(
      "TELEGRAM_BOT_TOKEN и FIREBASE_PROJECT_ID должны быть установлены в .env файле"
    );
    return;
  }

  const webhookUrl =
    `https://${region}-${projectId}.cloudfunctions.net/${functionName}`;

  const telegramApiUrl =
    `https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`;

  try {
    console.log(`Установка вебхука на URL: ${webhookUrl}`);
    const response = await axios.get(telegramApiUrl);
    if (response.data.ok) {
      console.log("Вебхук успешно установлен!");
      console.log(response.data.description);
    } else {
      console.error("Ошибка при установке вебхука:", response.data);
    }
  } catch (error: any) {
    console.error("Произошла ошибка:", error.message);
  }
};

setWebhook();
