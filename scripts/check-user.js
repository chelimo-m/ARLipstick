const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("../src/secret/firebase-service-account.json");
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkUser(email) {
	console.log(`Checking for user with email: ${email}`);

	try {
		// Check in users collection
		const userQuery = await db
			.collection("users")
			.where("email", "==", email)
			.get();

		if (userQuery.empty) {
			console.log("❌ User not found in users collection");
		} else {
			const userDoc = userQuery.docs[0];
			const userData = userDoc.data();
			console.log("✅ User found in users collection:");
			console.log(`   Name: ${userData.displayName}`);
			console.log(`   Email: ${userData.email}`);
			console.log(`   Role: ${userData.roleId}`);
			console.log(`   ID: ${userDoc.id}`);
		}

		// Check in Firebase Auth
		try {
			const auth = admin.auth();
			const userRecord = await auth.getUserByEmail(email);
			console.log("✅ User found in Firebase Auth:");
			console.log(`   UID: ${userRecord.uid}`);
			console.log(`   Email: ${userRecord.email}`);
			console.log(`   Display Name: ${userRecord.displayName}`);
		} catch (authError) {
			if (authError.code === "auth/user-not-found") {
				console.log("❌ User not found in Firebase Auth");
			} else {
				console.error("Error checking Firebase Auth:", authError.message);
			}
		}
	} catch (error) {
		console.error("Error checking user:", error);
	} finally {
		process.exit(0);
	}
}

// Get email from command line arguments
const email = process.argv[2];
if (!email) {
	console.error("Please provide an email address");
	console.log("Usage: node scripts/check-user.js <email>");
	process.exit(1);
}

checkUser(email);
