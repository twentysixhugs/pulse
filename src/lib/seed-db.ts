
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


// A helper function to check if a collection is empty.
async function isCollectionEmpty(db: Firestore, collectionPath: string): Promise<boolean> {
  const collectionRef = collection(db, collectionPath);
  const q = query(collectionRef, limit(1));
  const snapshot = await getDocs(q);
  return snapshot.empty;
}

export async function seedDatabase(db: Firestore) {
  // NOTE: The check for an empty database was removed as it was causing extreme slowdowns.
  // We will now assume that if this function is called, a seeding operation is intended.

  const batch = writeBatch(db);

  // --- CATEGORIES ---
  Object.entries(seedData.categories).forEach(([id, data]) => {
    const docRef = doc(db, 'categories', id);
    batch.set(docRef, data);
  });

  // --- USERS ---
  Object.entries(seedData.users).forEach(([id, data]) => {
    const docRef = doc(db, 'users', id);
    const userData: { [key: string]: any } = { ...data };
    if (userData.subscriptionEndDate) {
      userData.subscriptionEndDate = Timestamp.fromDate(new Date((userData.subscriptionEndDate as any).value));
    }
    batch.set(docRef, userData);
  });

  // --- TRADERS ---
  Object.entries(seedData.traders).forEach(([id, data]) => {
    const docRef = doc(db, 'traders', id);
    batch.set(docRef, data as any); // Type assertion to handle reputation structure
  });

  // --- ALERTS ---
  Object.entries(seedData.alerts).forEach(([id, data]) => {
    const docRef = doc(db, 'alerts', id);
    const alertData = {
      ...data,
      // Convert timestamp placeholder to actual Firestore Timestamp
      timestamp: Timestamp.fromDate(new Date((data.timestamp as any).value)),
    };
    batch.set(docRef, alertData as any); // Type assertion for complex structure
  });

  // --- REPORTS ---
  Object.entries(seedData.reports).forEach(([id, data]) => {
    const docRef = doc(db, 'reports', id);
    batch.set(docRef, data);
  });

  await batch.commit();
  return { message: 'База данных успешно заполнена!' };
}
