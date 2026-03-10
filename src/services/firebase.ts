import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { initializeFirestore, collection, doc, setDoc, getDoc, query, orderBy, limit, getDocs, addDoc, serverTimestamp, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if Firebase config is valid before initializing
const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app: any;
let auth: any;
let db: any;
let googleProvider: any;
let analytics: any;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = initializeFirestore(app, {
      ignoreUndefinedProperties: true,
    });
    
    // Enable offline persistence
    if (typeof window !== 'undefined') {
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
        } else if (err.code === 'unimplemented') {
          console.warn("The current browser does not support all of the features required to enable persistence.");
        }
      });
    }

    googleProvider = new GoogleAuthProvider();
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { auth, db, googleProvider, isFirebaseConfigured, analytics };

export const signInWithGoogle = async () => {
  if (!isFirebaseConfigured) {
    const error = new Error("Firebase is not configured. Please add your API keys in Settings > Secrets.");
    console.error(error.message);
    throw error;
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/unauthorized-domain') {
      const customError = new Error(
        "Unauthorized Domain: Please add this app's domain to your Firebase Console (Authentication > Settings > Authorized domains). " +
        "Required domains: ais-dev-iibvpmqpmqcrycx7myrbal-201663312415.asia-southeast1.run.app, ais-pre-iibvpmqpmqcrycx7myrbal-201663312415.asia-southeast1.run.app"
      );
      console.error(customError.message);
      throw customError;
    }
    if (error.code === 'auth/popup-closed-by-user') {
      const customError = new Error(
        "Sign-in cancelled: The login popup was closed. " +
        "Tip: Check your popup blocker, or try opening the app in a new tab if you're in the preview iframe."
      );
      console.warn(customError.message);
      throw customError;
    }
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

// Data Compression Helpers to minimize Firestore storage footprint
const FIELD_MAP: Record<string, string> = {
    level: 'l', exp: 'e', maxExp: 'me', hp: 'h', maxHp: 'mh', mp: 'm', maxMp: 'mm',
    baseAttack: 'ba', baseDefense: 'bd', gold: 'g', stage: 's', statPoints: 'sp',
    stats: 'st', playerClass: 'pc', inventory: 'inv', equipment: 'eq',
    autoSell: 'as', autoSkill: 'ask', inventoryLimit: 'il', autoSellUnlocked: 'asu',
    skillCooldown: 'sc', statusEffects: 'se', settings: 'set',
    rebornPoints: 'rp', rebornCount: 'rc', rebornUpgrades: 'ru',
    displayName: 'dn', photoURL: 'pu', uid: 'u'
};

const ITEM_MAP: Record<string, string> = {
    id: 'id', name: 'n', type: 't', rarity: 'r', value: 'v',
    sellPrice: 'p', effect: 'ef', setName: 'sn', upgradeLevel: 'ul'
};

const compressData = (data: any): any => {
    if (data === undefined) return undefined;
    if (data === null || typeof data !== 'object') return data;
    if (Array.isArray(data)) return data.map(compressData).filter(v => v !== undefined);

    const compressed: any = {};
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined) continue;
        const shortKey = FIELD_MAP[key] || ITEM_MAP[key] || key;
        compressed[shortKey] = (key === 'inventory' || key === 'equipment' || typeof value === 'object') 
            ? compressData(value) 
            : value;
    }
    return compressed;
};

const decompressData = (data: any): any => {
    if (!data || typeof data !== 'object') return data;
    if (Array.isArray(data)) return data.map(decompressData);

    const decompressed: any = {};
    const reverseFieldMap = Object.fromEntries(Object.entries(FIELD_MAP).map(([k, v]) => [v, k]));
    const reverseItemMap = Object.fromEntries(Object.entries(ITEM_MAP).map(([k, v]) => [v, k]));

    for (const [key, value] of Object.entries(data)) {
        // We need to be careful here because some short keys might overlap if not unique across maps
        // But in our case they are unique enough or we can prioritize
        const longKey = reverseFieldMap[key] || reverseItemMap[key] || key;
        decompressed[longKey] = (longKey === 'inventory' || longKey === 'equipment' || typeof value === 'object')
            ? decompressData(value)
            : value;
    }
    return decompressed;
};

// Database helpers
export const savePlayerData = async (uid: string, data: any) => {
  if (!isFirebaseConfigured) return;
  try {
    const compressed = compressData(data);
    await setDoc(doc(db, 'players', uid), {
      ...compressed,
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
      return decompressData(docSnap.data());
    }
    return null;
  } catch (error: any) {
    // Handle offline error gracefully
    if (error.code === 'unavailable' || error.message?.includes('offline')) {
      console.warn("Player data fetch failed: Client is offline and data not in cache.");
    } else {
      console.error("Error getting player data", error);
    }
    return null;
  }
};

export const saveRebornRecord = async (record: any) => {
  if (!isFirebaseConfigured) return;
  try {
    const compressed = compressData(record);
    await addDoc(collection(db, 'records'), {
      ...compressed,
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
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...decompressData(doc.data()) }));
  } catch (error) {
    console.error("Error getting global records", error);
    return [];
  }
};
