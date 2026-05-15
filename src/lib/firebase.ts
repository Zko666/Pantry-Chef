import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore with local persistence and long polling 
// to ensure connectivity and support offline mode in the AI Studio environment.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  experimentalAutoDetectLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

// Connection test
async function testConnection() {
  try {
    // We expect a permission error if the user isn't logged in, which is fine
    // The "unavailable" error is what we want to avoid
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('unavailable') || message.includes('offline')) {
      console.error("Firestore connection issue detected. Retrying with long polling...");
    }
  }
}
testConnection();
