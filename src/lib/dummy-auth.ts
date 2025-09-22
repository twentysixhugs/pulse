
// NOTE: This file is for temporary, dummy authentication.
// In a real application, this would be replaced by a proper auth system
// and user data would be stored securely in a database.

export const DUMMY_USERS = [
  { email: 'user@example.com', password: 'password', role: 'user', uid: 'user-1', name: 'Иван Петров' },
];

export const DUMMY_TRADERS = [
  { email: 'trader@example.com', password: 'password', role: 'trader', uid: 'trader-1', name: 'Алекс \'КриптоКороль\' Иванов' },
];

export const DUMMY_ADMINS = [
  { email: 'admin@example.com', password: 'password', role: 'admin', uid: 'admin-1', name: 'Admin User' },
];

export const ALL_DUMMY_USERS = [...DUMMY_USERS, ...DUMMY_TRADERS, ...DUMMY_ADMINS];
