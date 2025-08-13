import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase configuration for arlipstick-84040 project
const firebaseConfig = {
	apiKey:
		process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
		"AIzaSyDGDsfQA_URHm5EaKUfH7gXh5K6Oh-_-7A",
	authDomain:
		process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
		"arlipstick-84040.firebaseapp.com",
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "arlipstick-84040",
	storageBucket:
		process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
		"arlipstick-84040.firebasestorage.app",
	messagingSenderId:
		process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "429071766693",
	appId:
		process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
		"1:429071766693:web:829b26ffd1f1fcfc7fa94c",
	measurementId:
		process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-XYR7D1HKY8",
};

// Only initialize Firebase if we're in the browser and have valid config
let app: any = null;
let db: any = null;
let auth: any = null;
let storage: any = null;

if (typeof window !== "undefined") {
	try {
		app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
		db = getFirestore(app);
		auth = getAuth(app);
		storage = getStorage(app);
	} catch (error) {
		console.warn("Firebase initialization failed:", error);
	}
}

export { app, db, auth, storage };
