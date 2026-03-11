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
    console.log("[FIREBASE] Initialized successfully with project ID:", firebaseConfig.projectId);
  } catch (error) {
    console.error("[FIREBASE] Initialization failed:", error);
  }
} else {
  console.warn("[FIREBASE] Config is missing! Check your .env file or VITE_ secrets.");
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
  displayName: 'dn', photoURL: 'pu', uid: 'u',
  monstersKilled: 'mk', bossesKilled: 'bk',
  potionMaxBuyUpgrade: 'pmbu', potionQualityUpgrade: 'pqu',
  rebornHistory: 'rh',
  autoHealUnlocked: 'ahu', autoHealThreshold: 'aht',
  quests: 'q', potions: 'po',
  // Reborn Upgrade subfields
  atkBonus: 'ab', hpBonus: 'hb', expBonus: 'eb', goldBonus: 'gb', statBonus: 'sb', pointBonus: 'pb',
  // Attribute names (also used in Item stats)
  str: 'str', agi: 'agi', vit: 'vit', int: 'int', luk: 'luk'
};

const ITEM_MAP: Record<string, string> = {
  id: 'id', name: 'n', type: 't', rarity: 'r', value: 'v',
  sellPrice: 'p', effect: 'ef', setName: 'sn', upgradeLevel: 'ul',
  stats: 'st'
};

const compressData = (data: any): any => {
  if (data === undefined) return undefined;
  if (data === null || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(compressData).filter(v => v !== undefined);

  const compressed: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    const shortKey = FIELD_MAP[key] || ITEM_MAP[key] || key;
    // Only recurse if it's a plain object or array
    compressed[shortKey] = (value && typeof value === 'object' && (value.constructor === Object || Array.isArray(value)))
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
    const longKey = reverseFieldMap[key] || reverseItemMap[key] || key;
    // Only recurse if it's a plain object or array
    decompressed[longKey] = (value && typeof value === 'object' && (value.constructor === Object || Array.isArray(value)))
      ? decompressData(value)
      : value;
  }
  return decompressed;
};

// Database helpers
export const savePlayerData = async (uid: string, data: any) => {
  if (!isFirebaseConfigured) {
    console.warn("[FIREBASE] Cannot save: Firebase config missing.");
    return;
  }
  try {
    const compressed = compressData(data);
    console.log(`[FIREBASE] Pushing cloud sync for ${uid}...`, {
      items: data.inventory?.length || 0,
      gold: data.gold,
      level: data.level
    });
    const docRef = doc(db, 'players', uid);
    await setDoc(docRef, {
      ...compressed,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    console.log("[FIREBASE] Cloud sync successful.");
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.error("[FIREBASE] Save failed: Security Rules are blocking access! Visit your Firebase Console and deploy rules.");
    } else {
      console.error("[FIREBASE] Error saving player data:", error);
    }
    throw error; // Rethrow to let the UI know
  }
};

export const getPlayerData = async (uid: string) => {
  if (!isFirebaseConfigured) return null;
  try {
    console.log(`[FIREBASE] Fetching data for ${uid}...`);
    const docRef = doc(db, 'players', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const decompressed = decompressData(data);
      console.log("[FIREBASE] Data retrieved & reconstructed:", {
        level: decompressed.level,
        gold: decompressed.gold,
        inventory: decompressed.inventory?.length || 0
      });
      return decompressed;
    }
    console.log("[FIREBASE] No cloud document found for this user.");
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
    const docRef = doc(db, 'records', record.uid);
    const existingDoc = await getDoc(docRef);
    
    let shouldUpdate = true;
    if (existingDoc.exists()) {
      const existingData = existingDoc.data();
      // Use uncompressed keys for comparison if available, otherwise fallback to compressed for legacy
      const existingStage = Number(existingData.stage ?? existingData.s ?? 0);
      const existingLevel = Number(existingData.level ?? existingData.l ?? 0);

      // Only update if new stage is higher, or stage is same but level is higher
      if (record.stage < existingStage) {
        shouldUpdate = false;
      } else if (record.stage === existingStage && record.level <= existingLevel) {
        // Even if the run is the same, if we are migrating from legacy 's' to 'stage', we should update
        if (existingData.s && !existingData.stage) {
            shouldUpdate = true;
        } else {
            shouldUpdate = false;
        }
      }
    }

    if (shouldUpdate) {
      // SAVE WITHOUT COMPRESSION for better querying in Dashboard
      await setDoc(docRef, {
        ...record,
        timestamp: serverTimestamp()
      }, { merge: true });
      console.log(`[FIREBASE] High score update triggered for ${record.displayName}: Stage ${record.stage}`);
    }
  } catch (error) {
    console.error("Error saving reborn record", error);
  }
};

export const getGlobalRecords = async (limitCount: number = 50) => {
  if (!isFirebaseConfigured) return [];
  try {
    // Use simple timestamp ordering to avoid needing composite indices
    // We fetch a larger batch and sort client-side for better reliability
    const q = query(
      collection(db, 'records'), 
      orderBy('timestamp', 'desc'), 
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const records = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // If data was compressed (legacy), decompress it, otherwise use as-is
        const decompressed = data.s ? decompressData(data) : data;
        // Ensure stage and level are numbers for sorting
        return { 
            id: doc.id, 
            ...decompressed,
            stage: Number(decompressed.stage || 0),
            level: Number(decompressed.level || 0)
        };
    });

    // Sort by Stage DESC, then Level DESC
    return records.sort((a, b) => {
        if (b.stage !== a.stage) return b.stage - a.stage;
        return b.level - a.level;
    });
  } catch (error) {
    console.error("Error getting global records", error);
    return [];
  }
};
