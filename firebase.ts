import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  browserLocalPersistence, 
  initializeAuth
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Support both JSON config and environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigJson.measurementId,
  firestoreDatabaseId: firebaseConfigJson.firestoreDatabaseId
};

// Ensure config values are present and not placeholders
if (!firebaseConfig.apiKey || (typeof firebaseConfig.apiKey === 'string' && firebaseConfig.apiKey.includes('YOUR_'))) {
  console.warn("Firebase configuration may be incomplete. Check firebase-applet-config.json or environment variables.");
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use initializeAuth with browserLocalPersistence for reliable session storage in iframes
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
});

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Error helper for Firestore operations
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  
  const errorMessage = JSON.stringify(errInfo);
  console.error('Firestore Error:', errorMessage);
  throw new Error(errorMessage);
}
