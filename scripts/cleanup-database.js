const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin
// TODO: Update this path to your new service account JSON file
const serviceAccount = require("../src/secret/firebase-service-account.json");
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function cleanupDatabase() {
	console.log("🚀 Starting comprehensive database cleanup...\n");

	try {
		// Clean up Users collection
		console.log("📋 Cleaning Users collection...");
		const usersSnapshot = await db.collection("users").get();
		let userCount = 0;
		const batch = db.batch();

		usersSnapshot.forEach((doc) => {
			const userData = doc.data();
			// Keep only admin users
			if (userData.role !== "admin") {
				batch.delete(doc.ref);
				userCount++;
			}
		});

		if (userCount > 0) {
			await batch.commit();
			console.log(`✅ Deleted ${userCount} non-admin users`);
		} else {
			console.log("ℹ️  No non-admin users to delete");
		}

		// Clean up Products collection
		console.log("\n🛍️  Cleaning Products collection...");
		const productsSnapshot = await db.collection("products").get();
		const productBatch = db.batch();
		let productCount = 0;

		productsSnapshot.forEach((doc) => {
			productBatch.delete(doc.ref);
			productCount++;
		});

		if (productCount > 0) {
			await productBatch.commit();
			console.log(`✅ Deleted ${productCount} products`);
		} else {
			console.log("ℹ️  No products to delete");
		}

		// Clean up Orders collection
		console.log("\n📦 Cleaning Orders collection...");
		const ordersSnapshot = await db.collection("orders").get();
		const orderBatch = db.batch();
		let orderCount = 0;

		ordersSnapshot.forEach((doc) => {
			orderBatch.delete(doc.ref);
			orderCount++;
		});

		if (orderCount > 0) {
			await orderBatch.commit();
			console.log(`✅ Deleted ${orderCount} orders`);
		} else {
			console.log("ℹ️  No orders to delete");
		}

		// Clean up Payments collection
		console.log("\n💳 Cleaning Payments collection...");
		const paymentsSnapshot = await db.collection("payments").get();
		const paymentBatch = db.batch();
		let paymentCount = 0;

		paymentsSnapshot.forEach((doc) => {
			paymentBatch.delete(doc.ref);
			paymentCount++;
		});

		if (paymentCount > 0) {
			await paymentBatch.commit();
			console.log(`✅ Deleted ${paymentCount} payment records`);
		} else {
			console.log("ℹ️  No payment records to delete");
		}

		// Clean up Cart collection
		console.log("\n🛒 Cleaning Cart collection...");
		const cartSnapshot = await db.collection("cart").get();
		const cartBatch = db.batch();
		let cartCount = 0;

		cartSnapshot.forEach((doc) => {
			cartBatch.delete(doc.ref);
			cartCount++;
		});

		if (cartCount > 0) {
			await cartBatch.commit();
			console.log(`✅ Deleted ${cartCount} cart items`);
		} else {
			console.log("ℹ️  No cart items to delete");
		}

		console.log("\n🎉 Database cleanup completed successfully!");
		console.log("📊 Summary:");
		console.log(`   - Users deleted: ${userCount}`);
		console.log(`   - Products deleted: ${productCount}`);
		console.log(`   - Orders deleted: ${orderCount}`);
		console.log(`   - Payments deleted: ${paymentCount}`);
		console.log(`   - Cart items deleted: ${cartCount}`);
		console.log("\n✅ Database is now clean and ready for fresh data!");
	} catch (error) {
		console.error("❌ Error during cleanup:", error);
	} finally {
		process.exit(0);
	}
}

cleanupDatabase();
