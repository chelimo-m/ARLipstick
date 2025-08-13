const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("../src/secret/firebase-service-account.json");
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function promoteToAdmin(email) {
	if (!email) {
		console.error("Please provide an email address");
		console.log("Usage: node scripts/promote-to-admin.js <email>");
		process.exit(1);
	}

	console.log(`Promoting user with email: ${email} to admin...`);

	try {
		// Find user by email
		const userQuery = await db
			.collection("users")
			.where("email", "==", email)
			.limit(1)
			.get();

		if (userQuery.empty) {
			console.error(`No user found with email: ${email}`);
			process.exit(1);
		}

		const userDoc = userQuery.docs[0];
		const userData = userDoc.data();

		console.log(`Found user: ${userData.displayName} (${userData.email})`);
		console.log(`Current role: ${userData.roleId}`);

		if (userData.roleId === "admin") {
			console.log("User is already an admin!");
			process.exit(0);
		}

		// Update user to admin
		await userDoc.ref.update({
			roleId: "admin",
			bio: userData.bio || "System Administrator",
		});

		console.log(`Successfully promoted ${userData.displayName} to admin!`);
	} catch (error) {
		console.error("Error promoting user:", error);
	} finally {
		process.exit(0);
	}
}

// Get email from command line arguments
const email = process.argv[2];
promoteToAdmin(email);
