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
  { id: 'cat-crypto', name: 'Cryptocurrency' },
  { id: 'cat-forex', name: 'Forex' },
  { id: 'cat-stocks', name: 'Stocks' },
  { id: 'cat-options', name: 'Options' },
];

export const users: User[] = [
  { id: 'user-1', name: 'John Doe', telegramId: 'john_doe_tg', isBanned: false, subscriptionStatus: 'active' },
  { id: 'user-2', name: 'Jane Smith', telegramId: 'jane_smith_tg', isBanned: false, subscriptionStatus: 'inactive' },
  { id: 'user-3', name: 'Mike Ross', telegramId: 'mike_ross_tg', isBanned: true, subscriptionStatus: 'active' },
];

export const traders: Trader[] = [
  {
    id: 'trader-1',
    name: "Alex 'CryptoKing' Johnson",
    telegramId: 'crypto_king_tg',
    specialization: 'Day trading BTC and major altcoins.',
    category: 'cat-crypto',
    status: 'active',
    reputation: { positive: 125, negative: 12 },
    profilePicUrl: 'https://picsum.photos/seed/trader1/200/200',
    profilePicHint: 'male portrait',
  },
  {
    id: 'trader-2',
    name: "Sarah 'ForexQueen' Miller",
    telegramId: 'forex_queen_tg',
    specialization: 'Swing trading major FX pairs.',
    category: 'cat-forex',
    status: 'active',
    reputation: { positive: 210, negative: 5 },
    profilePicUrl: 'https://picsum.photos/seed/trader2/200/200',
    profilePicHint: 'female portrait',
  },
  {
    id: 'trader-3',
    name: "Ben 'StockSensei' Carter",
    telegramId: 'stock_sensei_tg',
    specialization: 'Value investing in tech stocks.',
    category: 'cat-stocks',
    status: 'inactive',
    reputation: { positive: 88, negative: 20 },
    profilePicUrl: 'https://picsum.photos/seed/trader3/200/200',
    profilePicHint: 'male portrait',
  },
  {
    id: 'trader-4',
    name: 'OptionsOracle',
    telegramId: 'options_oracle_tg',
    specialization: 'Weekly credit spreads on SPX.',
    category: 'cat-options',
    status: 'active',
    reputation: { positive: 150, negative: 8 },
    profilePicUrl: 'https://picsum.photos/seed/trader4/200/200',
    profilePicHint: 'person thinking',
  },
];

export const alerts: AlertPost[] = [
  {
    id: 'alert-1',
    traderId: 'trader-1',
    text: 'BTC looks prime for a breakout above $68k. Watching for confirmation on the 4H chart. Long entry planned with tight stop-loss.',
    screenshotUrl: 'https://picsum.photos/seed/ss1/800/600',
    screenshotHint: 'stock chart',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    likes: ['user-1', 'user-2'],
    dislikes: [],
    comments: [
      { id: 'comment-1', userId: 'user-2', userName: 'Jane Smith', text: 'Good call, watching this too!', timestamp: new Date(Date.now() - 3000000).toISOString() }
    ],
  },
  {
    id: 'alert-2',
    traderId: 'trader-2',
    text: 'EUR/JPY showing weakness at resistance. Looking for a short entry on a bearish engulfing candle. Target 157.50.',
    screenshotUrl: 'https://picsum.photos/seed/ss2/800/600',
    screenshotHint: 'forex chart',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    likes: ['user-1'],
    dislikes: [],
    comments: [],
  },
  {
    id: 'alert-3',
    traderId: 'trader-4',
    text: 'Opening a new SPY Iron Condor for this week. High probability trade given the current IV crush.',
    screenshotUrl: 'https://picsum.photos/seed/ss4/800/600',
    screenshotHint: 'options chain',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    likes: ['user-1', 'user-2', 'user-3'],
    dislikes: ['user-3'],
    comments: [],
  },
  {
    id: 'alert-4',
    traderId: 'trader-1',
    text: 'ETH/BTC ratio is at a key support level. Expecting a bounce for altcoins. Accumulating some key alts here.',
    screenshotUrl: 'https://picsum.photos/seed/ss5/800/600',
    screenshotHint: 'crypto chart',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    likes: ['user-1'],
    dislikes: [],
    comments: [],
  },
];

export const reports: Report[] = [
    { id: 'report-1', alertId: 'alert-3', reporterId: 'user-1', reason: 'This seems like risky advice without proper disclaimers.', status: 'pending' },
];
