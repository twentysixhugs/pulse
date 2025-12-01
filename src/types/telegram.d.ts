declare global {
  interface TelegramUserUnsafe {
    id?: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    is_premium?: boolean;
    language_code?: string;
    allows_write_to_pm?: boolean;
  }

  interface TelegramWebAppInitDataUnsafe {
    user?: TelegramUserUnsafe;
    chat_type?: string;
    chat_instance?: string;
    [key: string]: unknown;
  }

  interface TelegramWebApp {
    initData?: string;
    initDataUnsafe?: TelegramWebAppInitDataUnsafe;
    disableVerticalSwipes?: () => void;
    [key: string]: unknown;
  }

  interface TelegramWindow {
    WebApp?: TelegramWebApp;
  }

  interface Window {
    Telegram?: TelegramWindow;
  }
}

export {};

