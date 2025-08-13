#!/usr/bin/env node

/**
 * Remove Users Script
 *
 * This script removes specific users from Firebase Auth and Firestore.
 * Usage: node scripts/remove-users.js
 */

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

// Initialize Firebase Admin
const serviceAccount = {
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
	privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

if (
	!serviceAccount.projectId ||
	!serviceAccount.clientEmail ||
	!serviceAccount.privateKey
) {
	console.error("❌ Firebase credentials not found in environment variables");
	process.exit(1);
}

// Initialize Firebase Admin
let app;
try {
	app = initializeApp({
		credential: cert(serviceAccount),
	});
	console.log("✅ Firebase Admin initialized successfully");
} catch (error) {
	console.error("❌ Failed to initialize Firebase Admin:", error.message);
	process.exit(1);
}

const db = getFirestore(app);
const auth = getAuth(app);

// Users to remove
const usersToRemove = [
	{
		email: "kiruivictor097@gmail.com",
		name: "Victor Quaint",
	},
	{
		email: "victorquaint@gmail.com",
		name: "Victor Quaint",
	},
];

async function findUserByEmail(email) {
	try {
		const userRecord = await auth.getUserByEmail(email);
		return userRecord;
	} catch (error) {
		if (error.code === "auth/user-not-found") {
			return null;
		}
		throw error;
	}
}

async function removeUserFromFirestore(userId) {
	try {
		// Remove user document
		await db.collection("users").doc(userId).delete();
		console.log(`✅ Removed user document from Firestore: ${userId}`);

		// Remove user's cart
		await db.collection("carts").doc(userId).delete();
		console.log(`✅ Removed user's cart from Firestore: ${userId}`);

		// Remove user's orders (if any)
		const ordersSnapshot = await db
			.collection("orders")
			.where("userId", "==", userId)
			.get();
		const orderDeletions = ordersSnapshot.docs.map((doc) => doc.ref.delete());
		await Promise.all(orderDeletions);
		console.log(
			`✅ Removed ${ordersSnapshot.size} orders from Firestore: ${userId}`
		);

		return true;
	} catch (error) {
		console.error(
			`❌ Failed to remove user data from Firestore: ${error.message}`
		);
		return false;
	}
}

async function removeUserFromAuth(userId) {
	try {
		await auth.deleteUser(userId);
		console.log(`✅ Removed user from Firebase Auth: ${userId}`);
		return true;
	} catch (error) {
		console.error(
			`❌ Failed to remove user from Firebase Auth: ${error.message}`
		);
		return false;
	}
}

async function removeUsers() {
	console.log("\n🗑️  User Removal Script");
	console.log("=====================\n");

	for (const userData of usersToRemove) {
		console.log(`🔍 Processing user: ${userData.name} (${userData.email})`);

		try {
			// Find user in Firebase Auth
			const userRecord = await findUserByEmail(userData.email);

			if (!userRecord) {
				console.log(`⚠️  User not found in Firebase Auth: ${userData.email}`);
				continue;
			}

			console.log(`📋 Found user in Firebase Auth: ${userRecord.uid}`);

			// Remove from Firestore first
			const firestoreRemoved = await removeUserFromFirestore(userRecord.uid);

			// Remove from Firebase Auth
			const authRemoved = await removeUserFromAuth(userRecord.uid);

			if (firestoreRemoved && authRemoved) {
				console.log(
					`✅ Successfully removed user: ${userData.name} (${userData.email})`
				);
			} else {
				console.log(
					`⚠️  Partially removed user: ${userData.name} (${userData.email})`
				);
			}
		} catch (error) {
			console.error(`❌ Error removing user ${userData.email}:`, error.message);
		}

		console.log(""); // Empty line for readability
	}

	console.log("🎉 User removal process completed!");
}

// Handle script execution
if (require.main === module) {
	removeUsers().catch((error) => {
		console.error("❌ Script execution failed:", error.message);
		process.exit(1);
	});
}

module.exports = { removeUsers };
