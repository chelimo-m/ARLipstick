const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
// You'll need to download your service account key from Firebase Console
// Go to Project Settings > Service Accounts > Generate new private key
const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	projectId: "arlipstick-84040", // Updated to correct project ID
});

async function addAuthorizedDomain() {
	try {
		const auth = admin.auth();

		// Get current authorized domains
		const domains = await auth.listAuthorizedDomains();
		console.log("Current authorized domains:", domains.authorizedDomains);

		// Common domains to add
		const domainsToAdd = [
			"localhost",
			"127.0.0.1",
			"arlipstick-84040.web.app",
			"arlipstick-84040.firebaseapp.com",
		];

		console.log("\n=== Firebase Domain Authorization ===");
		console.log("Firebase Admin SDK cannot directly add authorized domains.");
		console.log(
			"Please add the following domains manually in Firebase Console:"
		);
		console.log(
			"\n1. Go to: https://console.firebase.google.com/project/arlipstick-84040/authentication/settings"
		);
		console.log("2. Scroll to 'Authorized domains' section");
		console.log("3. Click 'Add domain' for each of these domains:");

		domainsToAdd.forEach((domain) => {
			if (!domains.authorizedDomains.includes(domain)) {
				console.log(`   - ${domain} (NOT currently authorized)`);
			} else {
				console.log(`   - ${domain} (already authorized)`);
			}
		});

		console.log("\n4. Click 'Add' after entering each domain");
		console.log("\n=== Additional Domains to Consider ===");
		console.log("If you're deploying to Vercel, also add:");
		console.log("- your-app-name.vercel.app");
		console.log("- your-custom-domain.com (if applicable)");
	} catch (error) {
		console.error("Error:", error);
		console.log("\nIf you don't have firebase-service-account.json, you can:");
		console.log(
			"1. Go to Firebase Console > Project Settings > Service Accounts"
		);
		console.log("2. Click 'Generate new private key'");
		console.log(
			"3. Save the JSON file as 'firebase-service-account.json' in your project root"
		);
	}
}

addAuthorizedDomain();
