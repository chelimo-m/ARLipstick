const admin = require("firebase-admin");
require("dotenv").config();

// Initialize Firebase Admin with credentials from environment variables
const serviceAccount = {
	type: "service_account",
	project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
	private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
	client_email: process.env.FIREBASE_CLIENT_EMAIL,
	client_id: process.env.FIREBASE_CLIENT_ID,
	auth_uri: "https://accounts.google.com/o/oauth2/auth",
	token_uri: "https://oauth2.googleapis.com/token",
	auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
	client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
};

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

async function listOrders() {
	try {
		console.log("Fetching orders from Firestore...");

		const ordersSnapshot = await db.collection("orders").get();

		if (ordersSnapshot.empty) {
			console.log("No orders found in Firestore.");
			return;
		}

		console.log(`Found ${ordersSnapshot.size} orders:`);
		console.log("=".repeat(50));

		const statusCounts = {
			pending: 0,
			completed: 0,
			cancelled: 0,
			approved: 0,
			paid: 0,
			other: 0,
		};

		ordersSnapshot.forEach((doc) => {
			const order = doc.data();
			const status = order.status || "unknown";

			console.log(`Order ID: ${doc.id}`);
			console.log(`Status: ${status}`);
			console.log(`Total: ${order.total || 0}`);
			console.log(`Created: ${order.createdAt || "N/A"}`);
			console.log("-".repeat(30));

			if (statusCounts.hasOwnProperty(status)) {
				statusCounts[status]++;
			} else {
				statusCounts.other++;
			}
		});

		console.log("\nStatus Summary:");
		console.log("=".repeat(30));
		Object.entries(statusCounts).forEach(([status, count]) => {
			if (count > 0) {
				console.log(`${status}: ${count}`);
			}
		});

		console.log(`\nTotal Orders: ${ordersSnapshot.size}`);
	} catch (error) {
		console.error("Error fetching orders:", error);
	} finally {
		process.exit(0);
	}
}

listOrders();
