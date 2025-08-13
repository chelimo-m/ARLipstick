const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("../src/secret/firebase-service-account.json");
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

async function createProperAdmin(email, displayName, phone, bio) {
	console.log(`Creating proper admin user: ${displayName} (${email})`);

	try {
		// Step 1: Create user in Firebase Auth
		console.log("Step 1: Creating user in Firebase Auth...");
		const userRecord = await auth.createUser({
			email: email,
			displayName: displayName,
			emailVerified: true,
		});
		console.log(`✅ User created in Firebase Auth with UID: ${userRecord.uid}`);

		// Step 2: Create user document in Firestore
		console.log("Step 2: Creating user document in Firestore...");
		const userDoc = {
			userId: userRecord.uid,
			email: userRecord.email,
			displayName: userRecord.displayName,
			photoURL: userRecord.photoURL || null,
			roleId: "admin",
			phone: phone,
			bio: bio,
			profileCompleted: true,
			status: "active",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await db.collection("users").doc(userRecord.uid).set(userDoc);
		console.log(`✅ User document created in Firestore with admin role`);

		// Step 3: Create cart for user
		console.log("Step 3: Creating cart for user...");
		const cartData = {
			cartId: userRecord.uid,
			userId: userRecord.uid,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await db.collection("carts").doc(userRecord.uid).set(cartData);
		console.log(`✅ Cart created for user`);

		console.log(`🎉 Successfully created admin user: ${displayName}`);
		console.log(`📧 Email: ${email}`);
		console.log(`🆔 UID: ${userRecord.uid}`);
		console.log(`👑 Role: admin`);
	} catch (error) {
		console.error("Error creating admin user:", error);
	} finally {
		process.exit(0);
	}
}

// Get parameters from command line arguments
const email = process.argv[2];
const displayName = process.argv[3] || "Chelimo M";
const phone = process.argv[4] || "+254700000002";
const bio = process.argv[5] || "System Administrator for AR Lipstick";

if (!email) {
	console.error("Please provide an email address");
	console.log(
		"Usage: node scripts/create-proper-admin.js <email> [displayName] [phone] [bio]"
	);
	process.exit(1);
}

createProperAdmin(email, displayName, phone, bio);
