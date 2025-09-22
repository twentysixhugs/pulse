
'use client';

import { db } from '@/lib/firebase';
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
} from 'firebase/firestore';


// Data type definitions from the old data.ts file
export type SubscriptionStatus = 'active' | 'inactive';
export type TraderStatus = 'active' | 'inactive';
export type ReportStatus = 'pending' | 'resolved';

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


// Firestore data fetching functions
export async function getCategories(): Promise<Category[]> {
  const categoriesCol = collection(db, 'categories');
  const snapshot = await getDocs(categoriesCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
}

export async function getUsers(): Promise<User[]> {
  const usersCol = collection(db, 'users');
  const snapshot = await getDocs(usersCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
}

export async function getTraders(): Promise<Trader[]> {
  const tradersCol = collection(db, 'traders');
  const snapshot = await getDocs(tradersCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trader));
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

export async function getReports(): Promise<Report[]> {
  const reportsCol = collection(db, 'reports');
  const snapshot = await getDocs(reportsCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
}


// Functions to update data

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


export async function updateTraderReputation(traderId: string, type: 'pos' | 'neg', previousAction: 'pos' | 'neg' | null) {
    const traderRef = doc(db, 'traders', traderId);
    const batch = writeBatch(db);

    if (previousAction === type) { // Undoing action
        const fieldToDecrement = type === 'pos' ? 'reputation.positive' : 'reputation.negative';
        batch.update(traderRef, { [fieldToDecrement]: increment(-1) });
    } else if (previousAction) { // Switching action
        const fieldToIncrement = type === 'pos' ? 'reputation.positive' : 'reputation.negative';
        const fieldToDecrement = type === 'pos' ? 'reputation.negative' : 'reputation.positive';
        batch.update(traderRef, {
            [fieldToIncrement]: increment(1),
            [fieldToDecrement]: increment(-1)
        });
    } else { // New action
        const fieldToIncrement = type === 'pos' ? 'reputation.positive' : 'reputation.negative';
        batch.update(traderRef, { [fieldToIncrement]: increment(1) });
    }
    
    await batch.commit();
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
