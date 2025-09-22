
import {
  collection,
  writeBatch,
  getDocs,
  Timestamp,
  doc,
  query,
  limit,
  Firestore,
} from 'firebase/firestore';
import { db } from './firebase';

export async function isDbSeeded() {
  const q = query(collection(db, 'users'), limit(1));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function seedDatabase(db: Firestore) {
  const batch = writeBatch(db);

  // --- CATEGORIES ---
  const categories = [
    { id: 'cat-crypto', name: 'Криптовалюты' },
    { id: 'cat-forex', name: 'Форекс' },
    { id: 'cat-stocks', name: 'Акции' },
    { id: 'cat-options', name: 'Опционы' },
  ];
  categories.forEach((category) => {
    const categoriesCollection = collection(db, 'categories');
    batch.set(doc(categoriesCollection, category.id), { name: category.name });
  });

  // --- USERS ---
  const users = [
    {
      id: 'user-1',
      name: 'Иван Петров',
      telegramId: 'ivan_p',
      isBanned: false,
      subscriptionStatus: 'active',
      role: 'user',
    },
    {
      id: 'user-2',
      name: 'Елена Сидорова',
      telegramId: 'elena_s',
      isBanned: false,
      subscriptionStatus: 'inactive',
      role: 'user',
    },
    {
      id: 'user-3',
      name: 'Сергей Кузнецов',
      telegramId: 'sergey_k',
      isBanned: true,
      subscriptionStatus: 'active',
      role: 'user',
    },
    {
      id: 'admin-1',
      name: 'Admin User',
      telegramId: 'admin_user',
      isBanned: false,
      subscriptionStatus: 'active',
      role: 'admin',
    },
    {
      id: 'trader-1',
      name: 'Алекс \'КриптоКороль\' Иванов',
      telegramId: 'crypto_king_alex',
      isBanned: false,
      subscriptionStatus: 'active',
      role: 'trader',
    },
     {
      id: 'trader-2',
      name: 'Сара \'ФорексКоролева\' Миллер',
      telegramId: 'forex_queen_sarah',
      isBanned: false,
      subscriptionStatus: 'active',
      role: 'trader',
    },
    {
      id: 'trader-3',
      name: 'Бен \'СэнсэйАкций\' Картер',
      telegramId: 'stock_sensei_ben',
      isBanned: false,
      subscriptionStatus: 'active',
      role: 'trader',
    }
  ];
  users.forEach((user) => {
    const usersCollection = collection(db, 'users');
    batch.set(doc(usersCollection, user.id), {
      name: user.name,
      telegramId: user.telegramId,
      isBanned: user.isBanned,
      subscriptionStatus: user.subscriptionStatus,
      role: user.role
    });
  });

  // --- TRADERS ---
  const traders = [
    {
      id: 'trader-1',
      name: 'Алекс \'КриптоКороль\' Иванов',
      telegramId: 'crypto_king_alex',
      specialization: 'Специалист по BTC и ETH',
      category: 'cat-crypto',
      status: 'active',
      reputation: { positive: 125, negative: 12 },
      profilePicUrl: 'https://picsum.photos/seed/trader1/200/200',
      profilePicHint: 'male portrait',
    },
    {
      id: 'trader-2',
      name: 'Сара \'ФорексКоролева\' Миллер',
      telegramId: 'forex_queen_sarah',
      specialization: 'Мастер по основным валютным парам',
      category: 'cat-forex',
      status: 'active',
      reputation: { positive: 210, negative: 5 },
      profilePicUrl: 'https://picsum.photos/seed/trader2/200/200',
      profilePicHint: 'female portrait',
    },
    {
      id: 'trader-3',
      name: 'Бен \'СэнсэйАкций\' Картер',
      telegramId: 'stock_sensei_ben',
      specialization: 'Гуру акций технологических компаний',
      category: 'cat-stocks',
      status: 'inactive',
      reputation: { positive: 88, negative: 20 },
      profilePicUrl: 'https://picsum.photos/seed/trader3/200/200',
      profilePicHint: 'male portrait',
    },
  ];
  traders.forEach((trader) => {
    const tradersCollection = collection(db, 'traders');
    batch.set(doc(tradersCollection, trader.id), {
      name: trader.name,
      telegramId: trader.telegramId,
      specialization: trader.specialization,
      category: trader.category,
      status: trader.status,
      reputation: trader.reputation,
      profilePicUrl: trader.profilePicUrl,
      profilePicHint: trader.profilePicHint,
    });
  });

  // --- ALERTS ---
  // Denormalizing trader data into alerts for faster feed loading
  const traderMap = new Map(traders.map(t => [t.id, t]));

  const alerts = [
    {
      id: 'alert-1',
      traderId: 'trader-1',
      text: 'BTC готовится к прорыву! Ожидаю движения к $70k в ближайшие 24 часа. Стоп-лосс на $65k.',
      screenshotUrl: 'https://picsum.photos/seed/ss1/800/600',
      screenshotHint: 'stock chart',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1 * 60 * 60 * 1000)),
      likes: ['user-1', 'user-2'],
      dislikes: [],
      comments: [
        {
          id: 'comment-1-1',
          userId: 'user-2',
          userName: 'Елена Сидорова',
          text: 'Отличный анализ, Алекс! Тоже слежу за этим уровнем.',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
      ],
    },
    {
      id: 'alert-2',
      traderId: 'trader-2',
      text: 'Обратите внимание на пару EUR/JPY. Формируется разворотный паттерн "голова и плечи". Возможен короткий вход.',
      screenshotUrl: 'https://picsum.photos/seed/ss2/800/600',
      screenshotHint: 'forex chart',
      timestamp: Timestamp.fromDate(
        new Date(Date.now() - 5 * 60 * 60 * 1000)
      ),
      likes: ['user-1'],
      dislikes: ['user-3'],
      comments: [],
    },
    {
      id: 'alert-3',
      traderId: 'trader-1',
      text: 'ETH показывает силу против BTC. Рассматриваю лонг по ETH/BTC с целью 0.055.',
      screenshotUrl: 'https://picsum.photos/seed/ss5/800/600',
      screenshotHint: 'crypto chart',
      timestamp: Timestamp.fromDate(
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      ),
      likes: [],
      dislikes: [],
      comments: [],
    },
  ];

  alerts.forEach((alert) => {
    const alertsCollection = collection(db, 'alerts');
    const trader = traderMap.get(alert.traderId);
    batch.set(doc(alertsCollection, alert.id), {
      traderId: alert.traderId,
      traderName: trader?.name || 'Unknown Trader',
      traderProfilePicUrl: trader?.profilePicUrl || '',
      traderProfilePicHint: trader?.profilePicHint || '',
      text: alert.text,
      screenshotUrl: alert.screenshotUrl,
      screenshotHint: alert.screenshotHint,
      timestamp: alert.timestamp,
      likes: alert.likes,
      dislikes: alert.dislikes,
      comments: alert.comments,
    });
  });

  // --- REPORTS ---
  const reports = [
    {
      id: 'report-1',
      alertId: 'alert-2',
      reporterId: 'user-1',
      reason: 'Этот трейдер постоянно дает неверные сигналы. Это похоже на манипуляцию рынком.',
      status: 'pending',
    },
  ];
  reports.forEach((report) => {
    const reportsCollection = collection(db, 'reports');
    batch.set(doc(reportsCollection, report.id), {
      alertId: report.alertId,
      reporterId: report.reporterId,
      reason: report.reason,
      status: report.status,
    });
  });

  await batch.commit();
}
