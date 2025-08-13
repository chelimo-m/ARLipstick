const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("../src/secret/firebase-service-account.json");
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

async function createAdminUser(email) {
	console.log(`Creating admin user document for: ${email}`);

	try {
		// Get user from Firebase Auth
		const userRecord = await auth.getUserByEmail(email);
		console.log(`Found user in Auth: ${userRecord.uid}`);

		// Create user document in Firestore
		const userDoc = {
			userId: userRecord.uid,
			email: userRecord.email,
			displayName: userRecord.displayName || "Chelimo M",
			photoURL: userRecord.photoURL || null,
			roleId: "admin",
			phone: "+254700000002",
			bio: "System Administrator for AR Lipstick",
			profileCompleted: true,
			status: "active",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await db.collection("users").doc(userRecord.uid).set(userDoc);
		console.log(`✅ User document created in Firestore with admin role`);

		// Create cart for user
		const cartData = {
			cartId: userRecord.uid,
			userId: userRecord.uid,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await db.collection("carts").doc(userRecord.uid).set(cartData);
		console.log(`✅ Cart created for user`);

		console.log(`🎉 Successfully created admin user: ${userDoc.displayName}`);
	} catch (error) {
		console.error("Error creating admin user:", error);
	} finally {
		process.exit(0);
	}
}

// Get email from command line arguments
const email = process.argv[2];
if (!email) {
	console.error("Please provide an email address");
	console.log("Usage: node scripts/create-admin-user.js <email>");
	process.exit(1);
}

createAdminUser(email);
