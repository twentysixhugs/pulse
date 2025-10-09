

import {
  collection,
  writeBatch,
  getDocs,
  Timestamp,
  doc,
  query,
  Firestore,
} from 'firebase/firestore';
import seedData from '../../seed.json';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { app } from './firebase';


// NOTE: This seed function now also creates REAL Firebase Auth users.
// Be aware that this will populate your Firebase Authentication panel.
export async function seedDatabase(db: Firestore) {
  const auth = getAuth(app);

  const collectionsToClear = ['users', 'traders', 'alerts', 'categories', 'reports'];
  
  // 1. Clear existing Firestore data for a clean slate
  console.log("Clearing existing Firestore data...");
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

  // 2. CREATE/VERIFY AUTH USERS and build a map from seed ID to Auth UID
  const allSeedUsers = [
    ...Object.entries(seedData.users).map(([id, data]) => ({ seedId: id, ...data, email: `${data.telegramId}@example.com`, password: 'password' })),
  ].filter((user, index, self) => index === self.findIndex((u) => u.email === user.email));
  
  
  const idMap: { [oldId: string]: string } = {};

  console.log("Starting to create or verify Auth users...");
  for (const user of allSeedUsers) {
    let uid: string | null = null;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
        uid = userCredential.user.uid;
        console.log(`Created new auth user for ${user.email}`);
        await signOut(auth); // Sign out the newly created user immediately
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            try {
                // If user exists, sign in to get their UID
                const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
                uid = userCredential.user.uid;
                console.warn(`User with email ${user.email} already exists. Using existing UID.`);
                await signOut(auth); // Sign out after getting UID
            } catch (signInError: any) {
                 console.error(`Failed to sign in existing user ${user.email} to get UID. The password might be different from 'password'.`, signInError.message);
            }
        } else {
            console.error(`Error creating auth user for ${user.telegramId}:`, error.message);
        }
    }
    if (uid) {
        idMap[user.seedId] = uid;
    }
  }

  console.log("Finished Auth user processing. Starting Firestore data population.");
  console.log("ID Map:", idMap);

  // --- 3. POPULATE FIRESTORE USING THE CORRECT UIDS ---

  // --- CATEGORIES ---
  Object.entries(seedData.categories).forEach(([id, data]) => {
    const docRef = doc(db, 'categories', id);
    batch.set(docRef, data);
  });

  // --- USERS (in Firestore) ---
  Object.entries(seedData.users).forEach(([id, data]) => {
    const newUid = idMap[id];
    if (!newUid) {
      console.warn(`Skipping Firestore user entry for ${data.telegramId} because UID was not found.`);
      return; 
    }

    const docRef = doc(db, 'users', newUid);
    const userData: { [key: string]: any } = { ...data, createdAt: Timestamp.now() };

    if (!(userData as any).email) {
      userData.email = `${data.telegramId.toLowerCase()}@example.com`;
    }
    
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
     if (!newUid) {
        console.warn(`Skipping Firestore trader entry for ${data.telegramId} because UID was not found.`);
        return;
    }

    // Create trader profile
    const traderRef = doc(db, 'traders', newUid);
    const traderData = {
        ...data,
    };
    batch.set(traderRef, traderData as any);
  });

  // --- ALERTS ---
  Object.entries(seedData.alerts).forEach(([id, data]) => {
    const newTraderId = idMap[data.traderId];
    if (!newTraderId) {
        console.warn(`Skipping alert because traderId ${data.traderId} could not be mapped to a new UID.`);
        return;
    }

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
  // In a real app this would be more complex, but for seeding, we'll skip to avoid dangling references
  // since alert IDs are auto-generated.
  
  await batch.commit();
  
  return { message: 'База данных успешно перезаписана! Существующие аккаунты были использованы повторно.' };
}
