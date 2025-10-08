
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
import seedData from '../../seed.json';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from './firebase';


// A helper function to check if a collection is empty.
async function isCollectionEmpty(db: Firestore, collectionPath: string): Promise<boolean> {
  const collectionRef = collection(db, collectionPath);
  const q = query(collectionRef, limit(1));
  const snapshot = await getDocs(q);
  return snapshot.empty;
}

// NOTE: This seed function now also creates REAL Firebase Auth users.
// Be aware that this will populate your Firebase Authentication panel.
export async function seedDatabase(db: Firestore) {
  const auth = getAuth(app);

  const isUsersEmpty = await isCollectionEmpty(db, 'users');
  if (!isUsersEmpty) {
    const message = 'База данных уже заполнена. Очистите пользователей в Firebase Authentication и коллекции в Firestore, чтобы запустить заполнение заново.';
    console.warn(message);
    return { message };
  }
  
  const collectionsToClear = ['users', 'traders', 'alerts', 'categories', 'reports'];
  for (const collectionPath of collectionsToClear) {
      const q = query(collection(db, collectionPath));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
          const deleteBatch = writeBatch(db);
          snapshot.docs.forEach(d => deleteBatch.delete(d.ref));
          await deleteBatch.commit();
      }
  }


  const batch = writeBatch(db);

  // --- CREATE AUTH USERS ---
  const allSeedUsers = [
    // from seed.json users with role 'user' or 'admin'
    ...Object.entries(seedData.users).map(([id, data]) => ({ seedId: id, ...data, email: `${data.telegramId}@example.com`, password: 'password' })),
  ].filter((user, index, self) => index === self.findIndex((u) => u.email === user.email)); // a-la unique by email
  
  
  // To map old seed IDs to new Firebase Auth UIDs
  const idMap: { [oldId: string]: string } = {};

  for (const user of allSeedUsers) {
    try {
        const email = `${user.telegramId.toLowerCase()}@example.com`;
        const userCredential = await createUserWithEmailAndPassword(auth, email, 'password');
        const newUid = userCredential.user.uid;
        idMap[user.seedId] = newUid;
    } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') {
            console.warn(`User with email ${user.telegramId.toLowerCase()}@example.com already exists. Seeding might be incomplete if UIDs change.`);
            // This case should ideally be handled by fetching the existing user's UID,
            // which requires admin privileges not available on the client.
            // For this project, we'll just log it.
        } else {
            console.error(`Error creating auth user for ${user.telegramId}:`, e.message);
        }
    }
  }

  // --- CATEGORIES ---
  Object.entries(seedData.categories).forEach(([id, data]) => {
    const docRef = doc(db, 'categories', id);
    batch.set(docRef, data);
  });

  // --- USERS (in Firestore) ---
  Object.entries(seedData.users).forEach(([id, data]) => {
    const newUid = idMap[id];
    if (!newUid) return; // Skip if user creation failed

    const docRef = doc(db, 'users', newUid);
    const userData: { [key: string]: any } = { ...data, createdAt: Timestamp.now() };

    userData.email = `${data.telegramId.toLowerCase()}@example.com`;

    if (userData.subscriptionEndDate) {
      const subDate = new Date((userData.subscriptionEndDate as any).value);
      userData.subscriptionEndDate = Timestamp.fromDate(subDate);
      if (userData.subscriptionStatus === 'active' && subDate > new Date()) {
          userData.firstSubscribedAt = Timestamp.fromDate(new Date(subDate.getTime() - 30 * 24 * 60 * 60 * 1000));
      }
    }
    batch.set(docRef, userData);
  });

  // --- TRADERS (in Firestore) ---
  Object.entries(seedData.traders).forEach(([id, data]) => {
    const newUid = idMap[id];
    if (!newUid) return;

    // Create trader profile
    const traderRef = doc(db, 'traders', newUid);
    const traderData = {
        ...data,
        email: `${data.telegramId.toLowerCase()}@example.com`,
    };
    batch.set(traderRef, traderData as any);
  });

  // --- ALERTS ---
  Object.entries(seedData.alerts).forEach(([id, data]) => {
    const newTraderId = idMap[data.traderId];
    if (!newTraderId) return;

    const newComments = (data.comments || []).map(comment => ({
        ...comment,
        userId: idMap[comment.userId] || comment.userId,
    }));

    const alertData = {
      ...data,
      traderId: newTraderId,
      likes: (data.likes || []).map(userId => idMap[userId] || userId),
      dislikes: (data.dislikes || []).map(userId => idMap[userId] || userId),
      comments: newComments,
      timestamp: Timestamp.fromDate(new Date((data.timestamp as any).value)),
    };
    const docRef = doc(collection(db, 'alerts')); // Create with new auto-ID
    batch.set(docRef, alertData as any);
  });
  
  // --- REPORTS ---
  // Reports are skipped as their alertIds would need complex mapping.
  
  await batch.commit();
  console.log('ID Map:', idMap);
  return { message: 'База данных успешно заполнена! Были созданы реальные пользователи. Используйте email вида `telegramId@example.com` и пароль `password` для входа.' };
}
