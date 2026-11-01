import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  initializeAuth, 
  getAuth, 
  browserLocalPersistence, 
  inMemoryPersistence 
} from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Ignore transient background IndexedDB "Database is closing/hidden" and offline fallback warnings in preview iframes
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    if (
      event.reason &&
      (event.reason.message?.includes("Database is closing/hidden") ||
       event.reason.message?.includes("IndexedDB") ||
       event.reason.message?.includes("Could not reach Cloud Firestore backend") ||
       event.reason.toString?.().includes("Database is closing/hidden") ||
       event.reason.toString?.().includes("Could not reach Cloud Firestore backend"))
    ) {
      event.preventDefault();
      console.warn("Handled background IndexedDB/Offline Firestore notice:", event.reason);
    }
  });
}

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with robust localStorage & inMemory persistence (completely avoids IndexedDB iframe closures)
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: [browserLocalPersistence, inMemoryPersistence]
  });
} catch (e) {
  authInstance = getAuth(app);
}

export const auth = authInstance;

// Initialize Firestore with robust local offline cache and auto long-polling fallback
let firestoreDb;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
      experimentalAutoDetectLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId || undefined
  );
} catch (err) {
  firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
}

export const db = firestoreDb;
export default app;
