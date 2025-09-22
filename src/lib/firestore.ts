
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
  role: UserRole;
}

export interface Reputation {
  positive: number;
  negative: number;
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
  screenshotUrl: string;
  screenshotHint: string;
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


// --- Optimized Firestore data fetching functions ---

export async function getUser(userId: string): Promise<User | undefined> {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
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

export async function getAlerts(): Promise<AlertPost[]> {
    const alertsCol = collection(db, 'alerts');
    const q = query(alertsCol, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            timestamp: (data.timestamp as Timestamp).toDate().toISOString(),
        } as AlertPost;
    });
}

export async function getAlertsByTrader(traderId: string): Promise<AlertPost[]> {
    const alertsCol = collection(db, 'alerts');
    const q = query(alertsCol, where('traderId', '==', traderId), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            timestamp: (data.timestamp as Timestamp).toDate().toISOString(),
        } as AlertPost;
    });
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


// --- Functions to update data ---

export async function toggleAlertLike(alertId: string, userId: string, hasLiked: boolean) {
    const alertRef = doc(db, 'alerts', alertId);
    if (hasLiked) {
        await updateDoc(alertRef, { likes: arrayRemove(userId) });
    } else {
        const batch = writeBatch(db);
        batch.update(alertRef, { likes: arrayUnion(userId) });
        batch.update(alertRef, { dislikes: arrayRemove(userId) });
        await batch.commit();
    }
}

export async function toggleAlertDislike(alertId: string, userId: string, hasDisliked: boolean) {
    const alertRef = doc(db, 'alerts', alertId);
    if (hasDisliked) {
        await updateDoc(alertRef, { dislikes: arrayRemove(userId) });
    } else {
        const batch = writeBatch(db);
        batch.update(alertRef, { dislikes: arrayUnion(userId) });
        batch.update(alertRef, { likes: arrayRemove(userId) });
        await batch.commit();
    }
}


export async function addCommentToAlert(alertId: string, comment: Comment) {
  const alertRef = doc(db, 'alerts', alertId);
  await updateDoc(alertRef, {
    comments: arrayUnion(comment),
  });
  return comment;
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


export async function updateTraderReputation(traderId: string, userId: string, type: 'pos' | 'neg') {
    const traderRef = doc(db, 'traders', traderId);
    const userRepRef = doc(db, 'users', userId, 'traderReputation', traderId);
    
    const batch = writeBatch(db);
    const userRepSnap = await getDoc(userRepRef);
    const previousAction = userRepSnap.exists() ? userRepSnap.data().action : null;

    if (previousAction === type) { // Undoing action
        const fieldToDecrement = type === 'pos' ? 'reputation.positive' : 'reputation.negative';
        batch.update(traderRef, { [fieldToDecrement]: increment(-1) });
        batch.delete(userRepRef);
    } else if (previousAction) { // Switching action
        const fieldToIncrement = type === 'pos' ? 'reputation.positive' : 'reputation.negative';
        const fieldToDecrement = type === 'pos' ? 'reputation.negative' : 'reputation.positive';
        batch.update(traderRef, {
            [fieldToIncrement]: increment(1),
            [fieldToDecrement]: increment(-1)
        });
        batch.set(userRepRef, { action: type });
    } else { // New action
        const fieldToIncrement = type === 'pos' ? 'reputation.positive' : 'reputation.negative';
        batch.update(traderRef, { [fieldToIncrement]: increment(1) });
        batch.set(userRepRef, { action: type });
    }
    
    await batch.commit();
    
    const newRepSnap = await getDoc(userRepRef);
    return newRepSnap.exists() ? newRepSnap.data().action : null;
}


export async function getUserTraderReputation(userId: string, traderId: string) {
    const userRepRef = doc(db, 'users', userId, 'traderReputation', traderId);
    const docSnap = await getDoc(userRepRef);
    if (docSnap.exists()) {
        return docSnap.data().action as 'pos' | 'neg' | null;
    }
    return null;
}

export async function createAlert(post: Omit<AlertPost, 'id' | 'timestamp' | 'likes' | 'dislikes' | 'comments'>): Promise<AlertPost> {
    const alertsCol = collection(db, 'alerts');
    const newPost = {
        ...post,
        timestamp: Timestamp.now(),
        likes: [],
        dislikes: [],
        comments: [],
    };
    const docRef = await addDoc(alertsCol, newPost);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    return { ...newPost, id: docRef.id, timestamp: (data?.timestamp as Timestamp).toDate().toISOString() };
}

export async function updateAlertText(alertId: string, newText: string) {
    const alertRef = doc(db, 'alerts', alertId);
    await updateDoc(alertRef, { text: newText });
}

export async function deleteAlert(alertId: string) {
    const alertRef = doc(db, 'alerts', alertId);
    await deleteDoc(alertRef);
}

export async function banUser(userId: string) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { isBanned: true });
}
export async function unbanUser(userId: string) {
    const userRef = doc(db, 'users', userId);
await updateDoc(userRef, { isBanned: false });
}
export async function activateTrader(traderId: string) {
    const traderRef = doc(db, 'traders', traderId);
    await updateDoc(traderRef, { status: 'active' });
}
export async function deactivateTrader(traderId: string) {
    const traderRef = doc(db, 'traders', traderId);
    await updateDoc(traderRef, { status: 'inactive' });
}
export async function resolveReport(reportId: string) {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, { status: 'resolved' });
}

    