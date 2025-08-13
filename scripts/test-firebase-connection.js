const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("../src/secret/firebase-service-account.json");
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function testFirebaseConnection() {
	console.log("🔍 Testing Firebase connection...\n");

	try {
		// Test basic connection by trying to access a collection
		console.log("📋 Testing Firestore connection...");
		const usersRef = db.collection("users");
		const snapshot = await usersRef.limit(1).get();

		console.log("✅ Firebase connection successful!");
		console.log(`📊 Found ${snapshot.size} documents in users collection`);

		// Test creating a test document
		console.log("\n🧪 Testing document creation...");
		const testDoc = await db.collection("test").add({
			timestamp: admin.firestore.FieldValue.serverTimestamp(),
			message: "Firebase connection test successful",
		});

		console.log(`✅ Test document created with ID: ${testDoc.id}`);

		// Clean up test document
		await testDoc.delete();
		console.log("🧹 Test document cleaned up");

		console.log("\n🎉 All Firebase tests passed!");
		console.log("✅ Your Firebase configuration is working correctly");
	} catch (error) {
		console.error("❌ Firebase connection test failed:", error.message);

		if (error.code === 5) {
			console.log("\n💡 The database might not be initialized yet.");
			console.log("   This is normal for a new Firebase project.");
			console.log(
				"   Try accessing the Firebase Console to initialize the database."
			);
		}
	} finally {
		process.exit(0);
	}
}

testFirebaseConnection();
