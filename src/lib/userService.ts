import { 
  collection, getDocs, getDoc, setDoc, deleteDoc, doc, query, where 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  getAuth
} from 'firebase/auth';
import { db } from './firebase';
import { initializeApp } from 'firebase/app';

const USERS_COLLECTION = 'users';

export type UserRole = 'admin' | 'telecaller';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  isActive: boolean;
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as AppUser;
}

export async function getAllUsers(): Promise<AppUser[]> {
  const q = query(collection(db, USERS_COLLECTION));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser));
}

export async function createTelecallerAccount(
  email: string, 
  password: string, 
  displayName: string
): Promise<AppUser> {
  // Use a secondary Firebase app to create the user without signing out admin
  const { app } = await import('./firebase');
  const secondaryApp = initializeApp(app.options, 'Secondary');
  const secondaryAuth = getAuth(secondaryApp);
  
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    
    const newUser: Omit<AppUser, 'uid'> = {
      email,
      displayName,
      role: 'telecaller',
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    
    await setDoc(doc(db, USERS_COLLECTION, cred.user.uid), newUser);
    await secondaryAuth.signOut();
    
    return { uid: cred.user.uid, ...newUser };
  } finally {
    // Clean up secondary app
    try {
      await secondaryApp.delete();
    } catch {}
  }
}

export async function setUserProfile(uid: string, data: Omit<AppUser, 'uid'>): Promise<void> {
  await setDoc(doc(db, USERS_COLLECTION, uid), data);
}

export async function toggleUserActive(uid: string, isActive: boolean): Promise<void> {
  await setDoc(doc(db, USERS_COLLECTION, uid), { isActive }, { merge: true });
}

export async function deleteUserProfile(uid: string): Promise<void> {
  await deleteDoc(doc(db, USERS_COLLECTION, uid));
}
