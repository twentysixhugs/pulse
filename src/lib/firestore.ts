
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  writeBatch,
  increment,
  addDoc,
  Timestamp,
  deleteDoc,
  query,
  orderBy,
  limit,
  getDoc,
  setDoc,
  where,
  Firestore,
  getCountFromServer,
  startAfter,
  onSnapshot,
  Unsubscribe,
  runTransaction,
  and,
  or,
} from 'firebase/firestore';
import { db } from './firebase';


// Data type definitions
export type SubscriptionStatus = 'active' | 'inactive';
export type TraderStatus = 'active' | 'inactive';
export type ReportStatus = 'pending' | 'resolved';
export type UserRole = 'user' | 'admin' | 'trader';

export interface Category {
  id: string;
  name: string;
}

export interface User {
  id: string; // This will be the document ID from Firestore
  name: string;
  email: string;
  telegramId: string;
  isBanned: boolean;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndDate?: string | Timestamp; // ISO string or Firestore Timestamp
  role: UserRole;
}

export interface Reputation {
  positive: number;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string; // ISO string
}

export interface AlertPost {
  id: string; // This will be the document ID from Firestore
  traderId: string;
  traderName: string; // Denormalized
  traderProfilePicUrl: string; // Denormalized
  traderProfilePicHint: string; // Denormalized
  text: string;
  screenshotUrl?: string;
  screenshotHint?: string;
  timestamp: string | Timestamp; // ISO string or Firestore Timestamp
  likes: string[]; // array of userIds
  dislikes: string[]; // array of userIds
  comments: Comment[];
}

export interface Trader {
  id: string; // This will be the document ID from Firestore
  name:string;
  email: string;
  telegramId: string;
  specialization: string;
  category: string; // Should be a category ID
  status: TraderStatus;
  reputation: Reputation;
  profilePicUrl: string;
  profilePicHint: string;
}

export interface Report {
  id: string; // This will be the document ID from Firestore
  alertId: string;
  reporterId: string;
  reason: string;
  status: ReportStatus;
}

// --- Real-time Listeners ---

export function listenToAlerts(
  onData: ({ alerts, totalCount }: { alerts: AlertPost[], totalCount: number }) => void,
  onError: (error: Error) => void,
  page: number,
  alertsPerPage: number
): Unsubscribe {
  const alertsCol = collection(db, 'alerts');
  const q = query(alertsCol, orderBy('timestamp', 'desc'));

  const unsubscribe = onSnapshot(q, async (snapshot) => {
    try {
      const totalCount = snapshot.size;
      
      const paginatedDocs = snapshot.docs.slice((page - 1) * alertsPerPage, page * alertsPerPage);

      const alerts = paginatedDocs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as Timestamp).toDate().toISOString(),
        } as AlertPost;
      });

      onData({ alerts, totalCount });
    } catch(e: any) {
        onError(e);
    }
  }, onError);

  return unsubscribe;
}


export function listenToAlertsByTrader(
  traderId: string,
  onData: ({ alerts, totalCount }: { alerts: AlertPost[], totalCount: number }) => void,
  onError: (error: Error) => void,
  page: number,
  alertsPerPage: number,
): Unsubscribe {
  const alertsCol = collection(db, 'alerts');
  const q = query(alertsCol, where('traderId', '==', traderId), orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const totalCount = snapshot.size;

    const paginatedDocs = snapshot.docs.slice((page - 1) * alertsPerPage, page * alertsPerPage);
    
    const alerts = paginatedDocs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            timestamp: (data.timestamp as Timestamp).toDate().toISOString(),
        } as AlertPost;
    });
    
    onData({ alerts, totalCount });
  }, onError);
}

// --- Single-fetch functions ---

export async function getUser(userId: string): Promise<User | undefined> {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return { id: docSnap.id, ...data } as User;
    }
    return undefined;
}

export async function getTrader(traderId: string): Promise<Trader | undefined> {
    const traderRef = doc(db, 'traders', traderId);
    const docSnap = await getDoc(traderRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Trader;
    }
    return undefined;
}

export async function getCategory(categoryId: string): Promise<Category | undefined> {
    const categoryRef = doc(db, 'categories', categoryId);
    const docSnap = await getDoc(categoryRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Category;
    }
    return undefined;
}


// --- Functions to get full collections (use with caution, for admin panels etc.) ---

type GetAllParams = {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
}

export async function getAllUsers({ page, limit, search, role }: GetAllParams): Promise<{ data: User[], totalCount: number }> {
  const usersCol = collection(db, 'users');
  let constraints = [];
  if (role) {
    constraints.push(where('role', '==', role));
  }
  if (search) {
    const searchTermLower = search.toLowerCase();
    // This is a very basic search. For production, consider a dedicated search service like Algolia or Typesense.
    // Firestore does not support native full-text search on multiple fields efficiently.
    // The query below searches by name OR telegramId. It requires composite indexes.
    // Due to emulator limitations, we fetch all and filter client-side for simplicity here.
  }

  const q = query(usersCol, ...constraints);
  const snapshot = await getDocs(q);

  let allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

  if (search) {
    const searchTermLower = search.toLowerCase();
    allUsers = allUsers.filter(user => 
        user.name.toLowerCase().includes(searchTermLower) || 
        user.telegramId.toLowerCase().includes(searchTermLower)
    );
  }

  const totalCount = allUsers.length;
  const data = allUsers.slice((page - 1) * limit, page * limit);
  
  return { data, totalCount };
}

export async function getAllTraders({ page, limit, search }: GetAllParams): Promise<{ data: Trader[], totalCount: number }> {
  const tradersCol = collection(db, 'traders');

  const q = query(tradersCol);
  const snapshot = await getDocs(q);

  let allTraders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trader));

  if (search) {
    const searchTermLower = search.toLowerCase();
    allTraders = allTraders.filter(trader =>
      trader.name.toLowerCase().includes(searchTermLower) ||
      trader.telegramId.toLowerCase().includes(searchTermLower)
    );
  }

  const totalCount = allTraders.length;
  const data = allTraders.slice((page - 1) * limit, page * limit);
  
  return { data, totalCount };
}

export async function getAllCategories(): Promise<Category[]> {
  const categoriesCol = collection(db, 'categories');
  const snapshot = await getDocs(categoriesCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
}

export async function getAllReports(): Promise<Report[]> {
  const reportsCol = collection(db, 'reports');
  const snapshot = await getDocs(reportsCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
}

export async function getAlerts(): Promise<{alerts: AlertPost[], totalCount: number}> {
    const alertsCol = collection(db, 'alerts');
    const q = query(alertsCol, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: (doc.data().timestamp as Timestamp).toDate().toISOString() } as AlertPost));
    return { alerts, totalCount: snapshot.size };
}


// --- Functions to update data ---

export async function toggleAlertLike(alertId: string, userId: string) {
    const alertRef = doc(db, 'alerts', alertId);
    const alertSnap = await getDoc(alertRef);
    if (!alertSnap.exists()) throw new Error("Alert not found");

    const hasLiked = alertSnap.data().likes.includes(userId);
    const batch = writeBatch(db);

    if (hasLiked) {
        batch.update(alertRef, { likes: arrayRemove(userId) });
    } else {
        batch.update(alertRef, { likes: arrayUnion(userId) });
        batch.update(alertRef, { dislikes: arrayRemove(userId) });
    }
    await batch.commit();
}

export async function toggleAlertDislike(alertId: string, userId: string) {
    const alertRef = doc(db, 'alerts', alertId);
    const alertSnap = await getDoc(alertRef);
    if (!alertSnap.exists()) throw new Error("Alert not found");

    const hasDisliked = alertSnap.data().dislikes.includes(userId);
    const batch = writeBatch(db);

    if (hasDisliked) {
        batch.update(alertRef, { dislikes: arrayRemove(userId) });
    } else {
        batch.update(alertRef, { dislikes: arrayUnion(userId) });
        batch.update(alertRef, { likes: arrayRemove(userId) });
    }
    await batch.commit();
}


export async function addCommentToAlert(alertId: string, comment: Omit<Comment, 'id' | 'timestamp'>) {
  const alertRef = doc(db, 'alerts', alertId);
  const newComment = {
    ...comment,
    id: `comment-${Date.now()}`,
    timestamp: new Date().toISOString(),
  }
  await updateDoc(alertRef, {
    comments: arrayUnion(newComment),
  });
  return newComment;
}

export async function createReport(report: Omit<Report, 'id' | 'status'>): Promise<Report> {
    const reportsCol = collection(db, 'reports');
    const newReport = {
        ...report,
        status: 'pending' as ReportStatus
    }
    const docRef = await addDoc(reportsCol, newReport);
    return { ...newReport, id: docRef.id };
}


export async function updateTraderReputation(traderId: string, userId: string, type: 'pos'): Promise<Trader> {
  const traderRef = doc(db, 'traders', traderId);
  const userRepRef = doc(db, 'users', userId, 'traderReputation', traderId);

  await runTransaction(db, async (transaction) => {
    const userRepDoc = await transaction.get(userRepRef);

    if (userRepDoc.exists()) {
      // User has already voted, so we are undoing the vote.
      transaction.update(traderRef, { 'reputation.positive': increment(-1) });
      transaction.delete(userRepRef);
    } else {
      // User has not voted yet, so we are adding the vote.
      transaction.update(traderRef, { 'reputation.positive': increment(1) });
      transaction.set(userRepRef, { action: type });
    }
  });

  const updatedTraderDoc = await getDoc(traderRef);
  return { id: updatedTraderDoc.id, ...updatedTraderDoc.data() } as Trader;
}


export async function getUserTraderReputation(userId: string, traderId: string): Promise<'pos' | null> {
    const userRepRef = doc(db, 'users', userId, 'traderReputation', traderId);
    const docSnap = await getDoc(userRepRef);
    if (docSnap.exists()) {
        return docSnap.data().action as 'pos' | null;
    }
    return null;
}

export async function createAlert(post: Partial<Omit<AlertPost, 'id' | 'timestamp' | 'likes' | 'dislikes' | 'comments'>>): Promise<AlertPost> {
    const alertsCol = collection(db, 'alerts');
    const newPostData = {
        ...post,
        timestamp: Timestamp.now(),
        likes: [],
        dislikes: [],
        comments: [],
    };
    
    if (newPostData.screenshotUrl === undefined) {
      delete (newPostData as any).screenshotUrl;
    }
    if (newPostData.screenshotHint === undefined) {
        delete (newPostData as any).screenshotHint;
    }

    const docRef = await addDoc(alertsCol, newPostData);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    return { ...newPostData, id: docRef.id, timestamp: (data?.timestamp as Timestamp).toDate().toISOString() } as AlertPost;
}

export async function updateAlert(alertId: string, data: Partial<Pick<AlertPost, 'text' | 'screenshotUrl' | 'screenshotHint'>>) {
    const alertRef = doc(db, 'alerts', alertId);
    const updateData = {...data};

    if (updateData.screenshotUrl === undefined) {
      delete (updateData as any).screenshotUrl;
    }
    if (updateData.screenshotHint === undefined) {
        delete (updateData as any).screenshotHint;
    }

    await updateDoc(alertRef, updateData);
}

export async function deleteAlert(alertId: string) {
    const alertRef = doc(db, 'alerts', alertId);
    await deleteDoc(alertRef);
}

export async function banUser(db: Firestore, userId: string) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { isBanned: true });
}
export async function unbanUser(db: Firestore, userId: string) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { isBanned: false });
}
export async function deleteUser(db: Firestore, userId: string) {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
}

export async function activateTrader(db: Firestore, traderId: string) {
    const traderRef = doc(db, 'traders', traderId);
    await updateDoc(traderRef, { status: 'active' });
}
export async function deactivateTrader(db: Firestore, traderId: string) {
    const traderRef = doc(db, 'traders', traderId);
    await updateDoc(traderRef, { status: 'inactive' });
}
export async function deleteTrader(db: Firestore, traderId: string) {
    // This is a complex operation. In a real app, you would also need to handle:
    // - Deleting the user from Firebase Auth.
    // - Deleting associated data like alerts, comments, reputation entries.
    // This is a simplified version for this project.
    const batch = writeBatch(db);
    
    // 1. Delete trader profile
    const traderRef = doc(db, 'traders', traderId);
    batch.delete(traderRef);

    // 2. Delete user entry
    const userRef = doc(db, 'users', traderId);
    batch.delete(userRef);

    // 3. Delete alerts by this trader (in a real app, you'd query and delete)
    // For this project, we assume this is handled by a backend function or is not required.

    await batch.commit();
}


export async function createTrader(db: Firestore, traderData: Omit<Trader, 'id' | 'status' | 'reputation'>, password: string) {
    // In a real application, you would use Firebase Admin SDK on a backend server to create a user.
    // The client-side SDK cannot create users with email/password.
    // This is a simulation that adds the trader to the Firestore collections.
    // The actual login will rely on the dummy-auth file.
    
    const tradersCol = collection(db, 'traders');
    const usersCol = collection(db, 'users');

    // Check if email or telegramId is already in use in the users collection
    const emailQuery = query(usersCol, where("email", "==", traderData.email));
    const telegramIdQuery = query(usersCol, where("telegramId", "==", traderData.telegramId));

    const emailSnapshot = await getDocs(emailQuery);
    if (!emailSnapshot.empty) {
        throw new Error("Этот email уже используется.");
    }

    const telegramIdSnapshot = await getDocs(telegramIdQuery);
    if (!telegramIdSnapshot.empty) {
        throw new Error("Этот Telegram ID уже используется.");
    }
    
    const newTraderId = `trader-${Date.now()}`;
    const batch = writeBatch(db);

    // Create trader profile
    const traderRef = doc(db, 'traders', newTraderId);
    batch.set(traderRef, {
        ...traderData,
        status: 'active',
        reputation: { positive: 0 },
    });

    // Create corresponding user entry
    const userRef = doc(db, 'users', newTraderId);
    batch.set(userRef, {
        name: traderData.name,
        email: traderData.email,
        telegramId: traderData.telegramId,
        role: 'trader',
        isBanned: false,
        subscriptionStatus: 'active', // Traders have permanent subscription
        subscriptionEndDate: Timestamp.fromDate(new Date('2099-12-31')),
    });
    
    await batch.commit();

    // The developer must manually add the credentials to the dummy-auth.ts file for login to work.
    console.log(`
      ТРЕБУЕТСЯ РУЧНОЕ ДЕЙСТВИЕ:
      Добавьте следующие учетные данные в 'src/lib/dummy-auth.ts' в массив DUMMY_TRADERS, чтобы разрешить вход:
      
      { email: '${traderData.email}', password: '${password}', role: 'trader', uid: '${newTraderId}', name: '${traderData.name}' },

    `);
}


export async function resolveReport(db: Firestore, reportId: string) {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, { status: 'resolved' });
}

export async function updateUserSubscription(userId: string, newEndDate: Date) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { subscriptionEndDate: Timestamp.fromDate(newEndDate) });
}

    