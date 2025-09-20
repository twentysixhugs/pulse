export type SubscriptionStatus = 'active' | 'inactive';
export type TraderStatus = 'active' | 'inactive';
export type ReportStatus = 'pending' | 'resolved';

export interface Category {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  telegramId: string;
  isBanned: boolean;
  subscriptionStatus: SubscriptionStatus;
}

export interface Reputation {
  positive: number;
  negative: number;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface AlertPost {
  id: string;
  traderId: string;
  text: string;
  screenshotUrl: string;
  screenshotHint: string;
  timestamp: string;
  likes: string[]; // array of userIds
  dislikes: string[]; // array of userIds
  comments: Comment[];
}

export interface Trader {
  id: string;
  name: string;
  telegramId: string;
  specialization: string;
  category: string;
  status: TraderStatus;
  reputation: Reputation;
  profilePicUrl: string;
  profilePicHint: string;
}

export interface Report {
  id: string;
  alertId: string;
  reporterId: string;
  reason: string;
  status: ReportStatus;
}

export const categories: Category[] = [
  { id: 'cat-crypto', name: 'Криптовалюта' },
  { id: 'cat-forex', name: 'Форекс' },
  { id: 'cat-stocks', name: 'Акции' },
  { id: 'cat-options', name: 'Опционы' },
];

export const users: User[] = [
  { id: 'user-1', name: 'Иван Петров', telegramId: 'ivan_petrov_tg', isBanned: false, subscriptionStatus: 'active' },
  { id: 'user-2', name: 'Мария Сидорова', telegramId: 'maria_sidorova_tg', isBanned: false, subscriptionStatus: 'inactive' },
  { id: 'user-3', name: 'Михаил Кузнецов', telegramId: 'mikhail_kuznetsov_tg', isBanned: true, subscriptionStatus: 'active' },
];

export const traders: Trader[] = [
  {
    id: 'trader-1',
    name: "Алекс 'КриптоКороль' Иванов",
    telegramId: 'crypto_king_tg',
    specialization: 'Дневная торговля BTC и основными альткоинами.',
    category: 'cat-crypto',
    status: 'active',
    reputation: { positive: 125, negative: 12 },
    profilePicUrl: 'https://picsum.photos/seed/trader1/200/200',
    profilePicHint: 'мужской портрет',
  },
  {
    id: 'trader-2',
    name: "Сара 'ФорексКоролева' Миллер",
    telegramId: 'forex_queen_tg',
    specialization: 'Свинг-трейдинг основными валютными парами.',
    category: 'cat-forex',
    status: 'active',
    reputation: { positive: 210, negative: 5 },
    profilePicUrl: 'https://picsum.photos/seed/trader2/200/200',
    profilePicHint: 'женский портрет',
  },
  {
    id: 'trader-3',
    name: "Бен 'СэнсэйАкций' Картер",
    telegramId: 'stock_sensei_tg',
    specialization: 'Стоимостное инвестирование в технологические акции.',
    category: 'cat-stocks',
    status: 'inactive',
    reputation: { positive: 88, negative: 20 },
    profilePicUrl: 'https://picsum.photos/seed/trader3/200/200',
    profilePicHint: 'мужской портрет',
  },
  {
    id: 'trader-4',
    name: 'ОракулОпционов',
    telegramId: 'options_oracle_tg',
    specialization: 'Недельные кредитные спреды на SPX.',
    category: 'cat-options',
    status: 'active',
    reputation: { positive: 150, negative: 8 },
    profilePicUrl: 'https://picsum.photos/seed/trader4/200/200',
    profilePicHint: 'думающий человек',
  },
];

export const alerts: AlertPost[] = [
  {
    id: 'alert-1',
    traderId: 'trader-1',
    text: 'BTC готов к прорыву выше $68k. Жду подтверждения на 4-часовом графике. Планирую длинную позицию с коротким стоп-лоссом.',
    screenshotUrl: 'https://picsum.photos/seed/ss1/800/600',
    screenshotHint: 'график акций',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    likes: ['user-1', 'user-2'],
    dislikes: [],
    comments: [
      { id: 'comment-1', userId: 'user-2', userName: 'Мария Сидорова', text: 'Отличный анализ, тоже слежу!', timestamp: new Date(Date.now() - 3000000).toISOString() }
    ],
  },
  {
    id: 'alert-2',
    traderId: 'trader-2',
    text: 'EUR/JPY показывает слабость у сопротивления. Ищу точку входа в шорт по медвежьему поглощению. Цель 157.50.',
    screenshotUrl: 'https://picsum.photos/seed/ss2/800/600',
    screenshotHint: 'график форекс',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    likes: ['user-1'],
    dislikes: [],
    comments: [],
  },
  {
    id: 'alert-3',
    traderId: 'trader-4',
    text: 'Открываю новый Iron Condor по SPY на эту неделю. Высокая вероятность успеха, учитывая текущее сжатие волатильности.',
    screenshotUrl: 'https://picsum.photos/seed/ss4/800/600',
    screenshotHint: 'доска опционов',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    likes: ['user-1', 'user-2', 'user-3'],
    dislikes: ['user-3'],
    comments: [],
  },
  {
    id: 'alert-4',
    traderId: 'trader-1',
    text: 'Соотношение ETH/BTC находится на ключевом уровне поддержки. Ожидаю отскока для альткоинов. Набираю здесь некоторые ключевые альты.',
    screenshotUrl: 'https://picsum.photos/seed/ss5/800/600',
    screenshotHint: 'график криптовалют',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    likes: ['user-1'],
    dislikes: [],
    comments: [],
  },
];

export const reports: Report[] = [
    { id: 'report-1', alertId: 'alert-3', reporterId: 'user-1', reason: 'Это кажется рискованным советом без надлежащих оговорок.', status: 'pending' },
];
