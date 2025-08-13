// Script to check current domain and Firebase configuration
console.log("=== Firebase Domain Check ===");
console.log("Current Firebase Project ID: arlipstick-84040");
console.log("Current Auth Domain: arlipstick-84040.firebaseapp.com");
console.log("\n=== To Fix the Unauthorized Domain Error ===");
console.log(
	"1. Go to Firebase Console: https://console.firebase.google.com/project/arlipstick-84040/authentication/settings"
);
console.log("2. Scroll down to 'Authorized domains' section");
console.log("3. Add your current domain (likely one of these):");
console.log("   - localhost (for local development)");
console.log("   - your-vercel-domain.vercel.app (if deployed on Vercel)");
console.log("   - your-custom-domain.com (if you have a custom domain)");
console.log("\n=== Common Domains to Add ===");
console.log("- localhost");
console.log("- 127.0.0.1");
console.log("- arlipstick-84040.web.app");
console.log("- arlipstick-84040.firebaseapp.com");
