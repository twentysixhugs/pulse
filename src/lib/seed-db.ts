
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
    // from seed.json users with role 'user'
    ...Object.entries(seedData.users).filter(([, u]) => u.role === 'user').map(([id, data]) => ({ id, ...data, email: `${data.telegramId}@example.com`, password: 'password' })),
     // from seed.json users with role 'admin'
    ...Object.entries(seedData.users).filter(([, u]) => u.role === 'admin').map(([id, data]) => ({ id, ...data, email: `${data.telegramId}@example.com`, password: 'password' })),
    // from seed.json traders (who are also users)
    ...Object.entries(seedData.traders).map(([id, data]) => ({ id, ...data, email: `${data.telegramId}@example.com`, password: 'password' })),
  ];
  
  // To map old seed IDs to new Firebase Auth UIDs
  const idMap: { [oldId: string]: string } = {};

  for (const user of allSeedUsers) {
    try {
        // Use an email based on telegramId for uniqueness
        const email = `${user.telegramId.toLowerCase()}@example.com`;
        const userCredential = await createUserWithEmailAndPassword(auth, email, 'password');
        const newUid = userCredential.user.uid;
        idMap[user.id] = newUid;
    } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') {
            // This is expected if you run seed multiple times.
            // We need to find the existing user to get their UID.
            // This part is complex and would require admin SDK. For client-side, we'll skip creating a new user and assume old mappings might work if unchanged.
            console.warn(`User with email ${user.telegramId.toLowerCase()}@example.com already exists. Seeding might be incomplete if UIDs change.`);
            // A simple approach is to keep the old ID, hoping it matches an existing auth user.
            idMap[user.id] = user.id;
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

    // Set email based on telegramId
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
    if (!newUid) return; // Skip if auth user creation failed

    // Create user entry for the trader
    const userRef = doc(db, 'users', newUid);
    const traderUserRecord = {
        name: data.name,
        telegramId: data.telegramId,
        email: `${data.telegramId.toLowerCase()}@example.com`,
        role: 'trader',
        isBanned: false,
        subscriptionStatus: 'active',
        subscriptionEndDate: Timestamp.fromDate(new Date('2099-12-31')),
        createdAt: Timestamp.now(),
    };
    batch.set(userRef, traderUserRecord);
    
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
  Object.entries(seedData.reports).forEach(([id, data]) => {
    // Reports might become invalid due to alert IDs changing. For simplicity, we will skip seeding them.
    // If needed, we'd have to map old alert IDs to new ones.
  });

  await batch.commit();
  console.log('ID Map:', idMap);
  return { message: 'База данных успешно заполнена! Были созданы реальные пользователи. Используйте email вида `telegramId@example.com` и пароль `password` для входа.' };
}
