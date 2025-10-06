
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

export async function getAllUsers(): Promise<User[]> {
  const usersCol = collection(db, 'users');
  const snapshot = await getDocs(usersCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
}

export async function getAllTraders(): Promise<Trader[]> {
  const tradersCol = collection(db, 'traders');
  const snapshot = await getDocs(tradersCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trader));
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


export async function updateTraderReputation(traderId: string, userId: string, type: 'pos') {
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
export async function activateTrader(db: Firestore, traderId: string) {
    const traderRef = doc(db, 'traders', traderId);
    await updateDoc(traderRef, { status: 'active' });
}
export async function deactivateTrader(db: Firestore, traderId: string) {
    const traderRef = doc(db, 'traders', traderId);
    await updateDoc(traderRef, { status: 'inactive' });
}
export async function resolveReport(db: Firestore, reportId: string) {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, { status: 'resolved' });
}

export async function updateUserSubscription(userId: string, newEndDate: Date) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { subscriptionEndDate: Timestamp.fromDate(newEndDate) });
}
