

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

  const collectionsToClear = ['users', 'traders', 'alerts', 'categories', 'reports'];
  
  // Clear existing collections in Firestore
  for (const collectionPath of collectionsToClear) {
      const q = query(collection(db, collectionPath));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
          const deleteBatch = writeBatch(db);
          snapshot.docs.forEach(d => deleteBatch.delete(d.ref));
          await deleteBatch.commit();
          console.log(`Cleared collection: ${collectionPath}`);
      }
  }


  const batch = writeBatch(db);

  // --- CREATE AUTH USERS ---
  const allSeedUsers = [
    // from seed.json users with role 'user' or 'admin' or 'trader'
    ...Object.entries(seedData.users).map(([id, data]) => ({ seedId: id, ...data, email: `${data.telegramId}@example.com`, password: 'password' })),
  ].filter((user, index, self) => index === self.findIndex((u) => u.email === user.email)); // a-la unique by email
  
  
  // To map old seed IDs to new Firebase Auth UIDs
  const idMap: { [oldId: string]: string } = {};

  console.log("Starting to create Auth users. If a user already exists, they will be skipped.");
  for (const user of allSeedUsers) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, user.email, 'password');
        const newUid = userCredential.user.uid;
        idMap[user.seedId] = newUid;
    } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') {
            console.warn(`User with email ${user.email} already exists. Seeding might be incomplete if UIDs change. For a clean seed, delete users from the Firebase Authentication console.`);
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
    if (!newUid) return; // Skip if user creation failed or was skipped

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
  Object.entries(seedData.alerts).forEach(([_, data]) => {
    const newTraderId = idMap[data.traderId];
    if (!newTraderId) return;

    const newComments = (data.comments || []).map(comment => ({
        ...comment,
        userId: idMap[comment.userId] || comment.userId,
    }));

    const alertData = {
      ...data,
      traderId: newTraderId,
      likes: (data.likes || []).map(userId => idMap[userId] || userId).filter(Boolean),
      dislikes: (data.dislikes || []).map(userId => idMap[userId] || userId).filter(Boolean),
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
  return { message: 'База данных успешно перезаписана! Были созданы или пропущены существующие пользователи. Для полной очистки, удалите пользователей из Firebase Authentication console.' };
}
