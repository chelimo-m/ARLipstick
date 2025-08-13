// listProducts.js
import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.FIREBASE_PRIVATE_KEY) {
	console.error(
		"FIREBASE_PRIVATE_KEY is not set. Please check your .env.local file."
	);
	process.exit(1);
}
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
	privateKey = privateKey.slice(1, -1);
}
privateKey = privateKey.replace(/\\n/g, "\n");

if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.cert({
			projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
			clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
			privateKey,
		}),
	});
}

const db = admin.firestore();

async function listProducts() {
	const snapshot = await db.collection("products").get();
	if (snapshot.empty) {
		console.log("No products found.");
		return;
	}
	snapshot.forEach((doc) => {
		console.log(doc.id, "=>", doc.data());
	});
}

listProducts().catch(console.error);
