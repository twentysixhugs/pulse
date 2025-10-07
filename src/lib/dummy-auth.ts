
// NOTE: This file is for temporary, dummy authentication.
// In a real application, this would be replaced by a proper auth system
// and user data would be stored securely in a database.

export const DUMMY_USERS = [
  { email: 'user@example.com', password: 'password', role: 'user', uid: 'user-1', name: 'Иван Петров' },
  { email: 'user2@example.com', password: 'password', role: 'user', uid: 'user-2', name: 'Елена Сидорова' },
  { email: 'user3@example.com', password: 'password', role: 'user', uid: 'user-3', name: 'Сергей Кузнецов' },
  { email: 'user4@example.com', password: 'password', role: 'user', uid: 'user-4', name: 'Дмитрий Волков' },
  { email: 'user5@example.com', password: 'password', role: 'user', uid: 'user-5', name: 'Анна Попова' },
  { email: 'user6@example.com', password: 'password', role: 'user', uid: 'user-6', name: 'Михаил Лебедев' },
  { email: 'user7@example.com', password: 'password', role: 'user', uid: 'user-7', name: 'Ольга Морозова' },
  { email: 'user8@example.com', password: 'password', role: 'user', uid: 'user-8', name: 'Павел Новиков' },
  { email: 'user9@example.com', password: 'password', role: 'user', uid: 'user-9', name: 'Виктория Козлова' },
  { email: 'user10@example.com', password: 'password', role: 'user', uid: 'user-10', name: 'Артем Соловьев' },
];

export const DUMMY_TRADERS = [
  { email: 'trader@example.com', password: 'password', role: 'trader', uid: 'trader-1', name: 'Алекс \'КриптоКороль\' Иванов' },
  { email: 'trader2@example.com', password: 'password', role: 'trader', uid: 'trader-2', name: 'Сара \'ФорексКоролева\' Миллер' },
  { email: 'trader3@example.com', password: 'password', role: 'trader', uid: 'trader-3', name: 'Бен \'СэнсэйАкций\' Картер' },
];

export const DUMMY_ADMINS = [
  { email: 'admin@example.com', password: 'password', role: 'admin', uid: 'admin-1', name: 'Admin User' },
];

export const ALL_DUMMY_USERS = [...DUMMY_USERS, ...DUMMY_TRADERS, ...DUMMY_ADMINS];

    
