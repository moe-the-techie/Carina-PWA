import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import admin from 'firebase-admin';
import { createRequire } from 'module';
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const require = createRequire(import.meta.url);

let serviceAccount;
try {
    serviceAccount = require('./firebase-service-account.json');
} catch (error) {
    console.log('Firebase service account file not found, using environment variables');
}

if (!admin.apps.length) {
    const adminConfig = {
        projectId: process.env.FIREBASE_PROJECT_ID,
    };

    if (serviceAccount) {
        adminConfig.credential = admin.credential.cert(serviceAccount);
    } else if (process.env.FIREBASE_PRIVATE_KEY) {
        adminConfig.credential = admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        });
    }

    admin.initializeApp(adminConfig);
}

export const adminAuth = admin.auth();
export default app;
