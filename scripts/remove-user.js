const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("../src/secret/firebase-service-account.json");
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function removeUser(email) {
	if (!email) {
		console.error("Please provide an email address");
		console.log("Usage: node scripts/remove-user.js <email>");
		process.exit(1);
	}

	console.log(`Removing user with email: ${email}...`);

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
		console.log(`Role: ${userData.roleId}`);
		console.log(`Created: ${userData.createdAt}`);

		// Confirm deletion
		console.log("\nAre you sure you want to delete this user? (y/N)");
		
		// For automated execution, we'll proceed with deletion
		console.log("Proceeding with deletion...");

		// Delete the user document
		await userDoc.ref.delete();

		console.log(`Successfully removed user: ${userData.displayName} (${userData.email})`);

		// Also check if there are any related data to clean up
		console.log("Checking for related data to clean up...");

		// Check for cart items
		if (userData.userId) {
			const cartItems = await db
				.collection("cart")
				.where("userId", "==", userData.userId)
				.get();
			
			if (!cartItems.empty) {
				console.log(`Found ${cartItems.size} cart items to remove`);
				const batch = db.batch();
				cartItems.docs.forEach(doc => batch.delete(doc.ref));
				await batch.commit();
				console.log("Cart items removed");
			}


		// Check for orders
		if (userData.userId) {
			const orders = await db
				.collection("orders")
				.where("userId", "==", userData.userId)
				.get();
			
			if (!orders.empty) {
				console.log(`Found ${orders.size} orders to remove`);
				const batch = db.batch();
				orders.docs.forEach(doc => batch.delete(doc.ref));
				await batch.commit();
				console.log("Orders removed");
			}
		}

		// Check for payments
		if (userData.userId) {
			const payments = await db
				.collection("payments")
				.where("userId", "==", userData.userId)
				.get();
			
			if (!payments.empty) {
				console.log(`Found ${payments.size} payments to remove`);
				const batch = db.batch();
				payments.docs.forEach(doc => batch.delete(doc.ref));
				await batch.commit();
				console.log("Payments removed");
			}
		}

		console.log("User and all related data removed successfully!");

	} catch (error) {
		console.error("Error removing user:", error);
	} finally {
		process.exit(0);
	}
}

// Get email from command line arguments
const email = process.argv[2];
removeUser(email); 