import admin from 'firebase-admin';

const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY 
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

if (!rawPrivateKey) {
  console.error("FIREBASE_PRIVATE_KEY is not set in the environment variables. Please set it in your .env file or AI Studio Secrets.");
}

const serviceAccount = {
  projectId: "boevik-1e8c3",
  clientEmail: "firebase-adminsdk-fbsvc@boevik-1e8c3.iam.gserviceaccount.com",
  privateKey: rawPrivateKey,
};

if (!admin.apps.length && rawPrivateKey) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://boevik-1e8c3-default-rtdb.europe-west1.firebasedatabase.app/"
  });
}

// Provide a mock database if Firebase is not initialized
export const db = rawPrivateKey ? admin.database() : {
  ref: () => ({
    once: async () => ({ val: () => null, exists: () => false }),
    set: async () => {},
    update: async () => {},
    remove: async () => {},
    push: () => ({ key: 'mock_key_' + Date.now() }),
    orderByChild: () => ({ equalTo: () => ({ once: async () => ({ val: () => null, exists: () => false }) }) })
  })
} as any;

export const firestore = rawPrivateKey ? admin.firestore() : {} as any;
