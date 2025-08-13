"use strict";
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.applicationDefault(), // or use your service account
	});
}
const db = admin.firestore();

async function makeAdminByEmail(email) {
	try {
		// Find user by email in Firebase Auth
		const userRecord = await admin.auth().getUserByEmail(email);
		const uid = userRecord.uid;
		// Update Firestore user document
		await db
			.collection("users")
			.doc(uid)
			.set({ role: "admin" }, { merge: true });
		console.log(`User ${email} (${uid}) promoted to admin!`);
	} catch (error) {
		console.error("Error promoting user:", error);
		process.exit(1);
	}
}

// Get email from command line args
const email = process.argv[2];
if (!email) {
	console.error("Usage: node promoteAdmin.js user@example.com");
	process.exit(1);
}
makeAdminByEmail(email);
