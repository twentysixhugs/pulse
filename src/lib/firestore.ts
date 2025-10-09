

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
  startAt,
  endAt,
} from 'firebase/firestore';
import { db, app, firebaseConfig } from './firebase';
import { getAuth, createUserWithEmailAndPassword, initializeAuth, browserLocalPersistence } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';


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
  email?: string; // Make email optional
  telegramId: string;
  isBanned: boolean;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndDate?: string | Timestamp; // ISO string or Firestore Timestamp
  createdAt?: Timestamp; // Add createdAt for tracking new users
  firstSubscribedAt?: Timestamp;
  lastRenewedAt?: Timestamp;
  role: UserRole;
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
  reputation: number;
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


export type Metrics = {
  newUsers: number;
  totalSubscribedUsers: number;
  newlySubscribedUsers: number;
  renewedSubscriptions: number;
  expiredSubscriptions: number;
  traderPosts: number;
};


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

type GetAllUsersParams = {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  subscriptionStatus?: 'all' | 'active' | 'inactive';
  banStatus?: 'all' | 'banned' | 'not_banned';
}

export async function getAllUsers(params: GetAllUsersParams = {}): Promise<{ data: User[], totalCount: number }> {
  const { 
    page = 1, 
    limit = Number.MAX_SAFE_INTEGER, 
    search, 
    role,
    subscriptionStatus = 'all',
    banStatus = 'all'
  } = params;
  
  const usersCol = collection(db, 'users');
  let allUsers: User[] = [];

  // This is inefficient. For a real app, use a dedicated search service like Algolia or Typesense,
  // or structure your data to allow for more complex Firestore queries.
  const snapshot = await getDocs(query(usersCol));
  allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

  // Apply filters in memory
  let filteredUsers = allUsers;

  if (role) {
    filteredUsers = filteredUsers.filter(user => user.role === role);
  }
  
  if (subscriptionStatus !== 'all') {
    filteredUsers = filteredUsers.filter(user => user.subscriptionStatus === subscriptionStatus);
  }

  if (banStatus !== 'all') {
    if (banStatus === 'banned') {
        filteredUsers = filteredUsers.filter(user => user.isBanned);
    } else { // 'not_banned'
        filteredUsers = filteredUsers.filter(user => !user.isBanned);
    }
  }

  if (search) {
    const searchTermLower = search.toLowerCase();
    filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(searchTermLower) || 
        (user.telegramId && user.telegramId.toLowerCase().includes(searchTermLower))
    );
  }

  const totalCount = filteredUsers.length;
  const data = filteredUsers.slice((page - 1) * limit, page * limit);
  
  return { data, totalCount };
}


type GetAllTradersParams = {
  page?: number;
  limit?: number;
  search?: string;
}

export async function getAllTraders(params: GetAllTradersParams = {}): Promise<{ data: Trader[], totalCount: number }> {
  const { page = 1, limit = Number.MAX_SAFE_INTEGER, search } = params;
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

export async function deleteCommentFromAlert(alertId: string, commentId: string) {
    const alertRef = doc(db, 'alerts', alertId);
    await runTransaction(db, async (transaction) => {
        const alertDoc = await transaction.get(alertRef);
        if (!alertDoc.exists()) {
            throw "Alert not found!";
        }
        const currentComments = alertDoc.data().comments as Comment[];
        const newComments = currentComments.filter(c => c.id !== commentId);
        transaction.update(alertRef, { comments: newComments });
    });
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


export async function updateTraderReputation(
    traderId: string,
    userId: string,
  ): Promise<{ updatedTrader: Trader; newRepAction: 'pos' | null }> {
    const traderRef = doc(db, 'traders', traderId);
    const userRepRef = doc(db, 'users', userId, 'traderReputation', traderId);
  
    let newRepAction: 'pos' | null = null;
  
    await runTransaction(db, async (transaction) => {
      const userRepDoc = await transaction.get(userRepRef);
  
      if (userRepDoc.exists()) {
        // User is undoing their positive vote
        transaction.update(traderRef, { 'reputation': increment(-1) });
        transaction.delete(userRepRef);
        newRepAction = null;
      } else {
        // User is adding a positive vote
        transaction.update(traderRef, { 'reputation': increment(1) });
        transaction.set(userRepRef, { action: 'pos' });
        newRepAction = 'pos';
      }
    });
  
    const updatedTraderDoc = await getDoc(traderRef);
    const updatedTrader = { id: updatedTraderDoc.id, ...updatedTraderDoc.data() } as Trader;
  
    return { updatedTrader, newRepAction };
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
    await updateDoc(userRef, { isBanned: true, subscriptionStatus: 'inactive' });
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


export async function createTrader(db: Firestore, traderData: Omit<Trader & { email: string }, 'id' | 'status' | 'reputation'>, password: string) {
    const tempAppName = `create-trader-app-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = initializeAuth(tempApp, { persistence: browserLocalPersistence });

    try {
        const usersCol = collection(db, 'users');
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

        const userCredential = await createUserWithEmailAndPassword(tempAuth, traderData.email, password);
        const newTraderId = userCredential.user.uid;

        const batch = writeBatch(db);

        const { email, ...traderProfileData } = traderData;
        const traderRef = doc(db, 'traders', newTraderId);
        batch.set(traderRef, {
            ...traderProfileData,
            status: 'active',
            reputation: 0,
        });

        const userRef = doc(db, 'users', newTraderId);
        batch.set(userRef, {
            name: traderData.name,
            email: traderData.email,
            telegramId: traderData.telegramId,
            role: 'trader',
            isBanned: false,
            subscriptionStatus: 'active',
            subscriptionEndDate: Timestamp.fromDate(new Date('2099-12-31')),
            createdAt: Timestamp.now(),
        });

        await batch.commit();
    } finally {
        await deleteApp(tempApp);
    }
}


export async function resolveReport(db: Firestore, reportId: string) {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, { status: 'resolved' });
}

export async function updateUserSubscription(userId: string, newEndDate: Date) {
  const userRef = doc(db, 'users', userId);
  const now = new Date();
  
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  const userData = userSnap.data() as User;

  const currentEndDate = userData.subscriptionEndDate ? (userData.subscriptionEndDate as Timestamp).toDate() : now;
  const isCurrentlyActive = userData.subscriptionStatus === 'active' && currentEndDate >= now;

  const updates: any = { 
    subscriptionEndDate: Timestamp.fromDate(newEndDate),
    subscriptionStatus: newEndDate >= now ? 'active' : 'inactive',
  };

  const isBecomingActive = !isCurrentlyActive && newEndDate >= now;

  if (isBecomingActive) {
    // This is a new subscription or resubscription after expiry
    if (!userData.firstSubscribedAt) {
      updates.firstSubscribedAt = Timestamp.now();
    } else {
      updates.lastRenewedAt = Timestamp.now();
    }
  } else if (newEndDate > currentEndDate) {
    // This is an extension/renewal of an already active subscription
    updates.lastRenewedAt = Timestamp.now();
  }
  
  await updateDoc(userRef, updates);
}

export async function updateTrader(db: Firestore, traderId: string, data: Partial<Omit<Trader, 'id' | 'email' | 'status' | 'reputation'>>) {
    const traderRef = doc(db, 'traders', traderId);
    const userRef = doc(db, 'users', traderId);

    const batch = writeBatch(db);

    // Update trader profile
    batch.update(traderRef, data);

    // Update corresponding user document if name or telegramId changed
    const userUpdateData: { [key: string]: any } = {};
    if(data.name) userUpdateData.name = data.name;
    if(data.telegramId) userUpdateData.telegramId = data.telegramId;

    if (Object.keys(userUpdateData).length > 0) {
        batch.update(userRef, userUpdateData);
    }

    await batch.commit();
}

// --- Metrics ---

export async function getMetrics(period: 'today' | '7d'): Promise<Metrics> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = period === 'today' ? startOfDay : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const usersRef = collection(db, 'users');
  const alertsRef = collection(db, 'alerts');

  // New Users (registrations)
  const newUsersQuery = query(usersRef, where('createdAt', '>=', startDate));
  const newUsersSnap = await getCountFromServer(newUsersQuery);
  const newUsers = newUsersSnap.data().count;

  // Total Active Subscriptions
  const totalSubscribedQuery = query(usersRef, where('subscriptionStatus', '==', 'active'), where('subscriptionEndDate', '>=', now));
  const totalSubscribedSnap = await getCountFromServer(totalSubscribedQuery);
  const totalSubscribedUsers = totalSubscribedSnap.data().count;
  
  // New Subscriptions (first time ever)
  const newlySubscribedQuery = query(usersRef, where('firstSubscribedAt', '>=', startDate));
  const newlySubscribedSnap = await getCountFromServer(newlySubscribedQuery);
  const newlySubscribedUsers = newlySubscribedSnap.data().count;
  
  // Renewed Subscriptions (had a sub before)
  const renewedQuery = query(usersRef, where('lastRenewedAt', '>=', startDate));
  const renewedSnap = await getCountFromServer(renewedQuery);
  const renewedSubscriptions = renewedSnap.data().count;
  
  // Expired Subscriptions
  const expiredQuery = query(usersRef, where('subscriptionStatus', '==', 'active'), where('subscriptionEndDate', '>=', startDate), where('subscriptionEndDate', '<', now));
  const expiredSnap = await getCountFromServer(expiredQuery);
  const expiredSubscriptions = expiredSnap.data().count;

  // Trader Posts
  const postsQuery = query(alertsRef, where('timestamp', '>=', startDate));
  const postsSnap = await getCountFromServer(postsQuery);
  const traderPosts = postsSnap.data().count;

  return {
    newUsers,
    totalSubscribedUsers,
    newlySubscribedUsers,
    renewedSubscriptions,
    expiredSubscriptions,
    traderPosts,
  };
}
