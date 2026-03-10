import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if Firebase config is valid before initializing
const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app;
let auth: any;
let db: any;
let googleProvider: any;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { auth, db, googleProvider, isFirebaseConfigured };

export const signInWithGoogle = async () => {
  if (!isFirebaseConfigured) {
    console.error("Firebase is not configured. Please add your API keys in Settings > Secrets.");
    return null;
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = async () => {
  if (!isFirebaseConfigured) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

// Database helpers
export const savePlayerData = async (uid: string, data: any) => {
  if (!isFirebaseConfigured) return;
  try {
    await setDoc(doc(db, 'players', uid), {
      ...data,
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving player data", error);
  }
};

export const getPlayerData = async (uid: string) => {
  if (!isFirebaseConfigured) return null;
  try {
    const docRef = doc(db, 'players', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting player data", error);
    return null;
  }
};

export const saveRebornRecord = async (record: any) => {
  if (!isFirebaseConfigured) return;
  try {
    await addDoc(collection(db, 'records'), {
      ...record,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error saving reborn record", error);
  }
};

export const getGlobalRecords = async (limitCount: number = 20) => {
  if (!isFirebaseConfigured) return [];
  try {
    const q = query(collection(db, 'records'), orderBy('timestamp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting global records", error);
    return [];
  }
};
