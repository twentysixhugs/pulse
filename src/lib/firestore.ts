
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
  limit
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
  // Firestore specific fields if any, can be added here
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

export async function updateAlertLikes(alertId: string, userId: string, type: 'like' | 'dislike') {
  const alertRef = doc(db, 'alerts', alertId);

  if (type === 'like') {
    await updateDoc(alertRef, {
      likes: arrayUnion(userId),
      dislikes: arrayRemove(userId),
    });
  } else { // dislike
    await updateDoc(alertRef, {
      likes: arrayRemove(userId),
      dislikes: arrayUnion(userId),
    });
  }
}

export async function toggleAlertLike(alertId: string, userId: string, hasLiked: boolean) {
    const alertRef = doc(db, 'alerts', alertId);
    if (hasLiked) {
        await updateDoc(alertRef, { likes: arrayRemove(userId) });
    } else {
        await updateDoc(alertRef, { 
            likes: arrayUnion(userId),
            dislikes: arrayRemove(userId) // Ensure user is not in dislikes
        });
    }
}

export async function toggleAlertDislike(alertId: string, userId: string, hasDisliked: boolean) {
    const alertRef = doc(db, 'alerts', alertId);
    if (hasDisliked) {
        await updateDoc(alertRef, { dislikes: arrayRemove(userId) });
    } else {
        await updateDoc(alertRef, { 
            dislikes: arrayUnion(userId),
            likes: arrayRemove(userId) // Ensure user is not in likes
        });
    }
}


export async function addCommentToAlert(alertId: string, comment: Comment) {
  const alertRef = doc(db, 'alerts', alertId);
  await updateDoc(alertRef, {
    comments: arrayUnion(comment),
  });
}

export async function createReport(report: Omit<Report, 'id' | 'status'>) {
    const reportsCol = collection(db, 'reports');
    await addDoc(reportsCol, {
        ...report,
        status: 'pending'
    });
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


export async function createAlert(post: Omit<AlertPost, 'id' | 'timestamp' | 'likes' | 'dislikes' | 'comments'>) {
    const alertsCol = collection(db, 'alerts');
    const newPost = {
        ...post,
        timestamp: Timestamp.now(),
        likes: [],
        dislikes: [],
        comments: [],
    };
    const docRef = await addDoc(alertsCol, newPost);
    return { ...newPost, id: docRef.id, timestamp: newPost.timestamp.toDate().toISOString() };
}

export async function updateAlertText(alertId: string, newText: string) {
    const alertRef = doc(db, 'alerts', alertId);
    await updateDoc(alertRef, { text: newText });
}

export async function deleteAlert(alertId: string) {
    const alertRef = doc(db, 'alerts', alertId);
    await deleteDoc(alertRef);
}

// TODO: User management functions
export async function banUser(userId: string) {}
export async function unbanUser(userId: string) {}
export async function activateTrader(traderId: string) {}
export async function deactivateTrader(traderId: string) {}
export async function resolveReport(reportId: string) {}
