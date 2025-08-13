// Simple test to check current domain and Firebase auth status
console.log("=== Current Domain Test ===");

// Check if we're in a browser environment
if (typeof window !== "undefined") {
	console.log("Current domain:", window.location.hostname);
	console.log("Current URL:", window.location.href);

	// Test Firebase auth
	const { auth } = require("./src/app/firebaseConfig.ts");

	if (auth) {
		console.log("Firebase Auth initialized successfully");
		console.log("Auth domain:", auth.config.authDomain);
	} else {
		console.log("Firebase Auth not initialized");
	}
} else {
	console.log("Not in browser environment");
	console.log("To test domain authorization:");
	console.log("1. Start your development server: npm run dev");
	console.log("2. Open browser console at localhost:3000");
	console.log("3. Check for Firebase auth errors");
}

console.log("\n=== Quick Fix Steps ===");
console.log(
	"1. Go to: https://console.firebase.google.com/project/arlipstick-84040/authentication/settings"
);
console.log("2. Add 'localhost' to authorized domains");
console.log("3. Refresh your app");
