const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("../src/secret/firebase-service-account.json");
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

async function deleteUser(email) {
	console.log(`Deleting user: ${email}`);

	try {
		// Get user from Firebase Auth
		const userRecord = await auth.getUserByEmail(email);
		const uid = userRecord.uid;
		console.log(`Found user in Auth with UID: ${uid}`);

		// Delete from Firestore collections
		console.log("Deleting from Firestore...");

		// Delete user document
		await db.collection("users").doc(uid).delete();
		console.log("✅ User document deleted from Firestore");

		// Delete cart
		await db.collection("carts").doc(uid).delete();
		console.log("✅ Cart deleted from Firestore");

		// Delete from Firebase Auth
		console.log("Deleting from Firebase Auth...");
		await auth.deleteUser(uid);
		console.log("✅ User deleted from Firebase Auth");

		console.log(`🎉 Successfully deleted user: ${email}`);
	} catch (error) {
		if (error.code === "auth/user-not-found") {
			console.log("❌ User not found in Firebase Auth");
		} else {
			console.error("Error deleting user:", error);
		}
	} finally {
		process.exit(0);
	}
}

// Get email from command line arguments
const email = process.argv[2];
if (!email) {
	console.error("Please provide an email address");
	console.log("Usage: node scripts/delete-user.js <email>");
	process.exit(1);
}

deleteUser(email);
