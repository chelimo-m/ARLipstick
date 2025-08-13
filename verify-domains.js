console.log("=== Firebase Domain Verification ===");
console.log("Project ID: arlipstick-84040");
console.log("\n=== Domains You Need to Add ===");
console.log("1. arl-ipstick.vercel.app (your Vercel deployment)");
console.log("2. localhost (for local development)");
console.log("\n=== Steps to Add Domains ===");
console.log(
	"1. Go to: https://console.firebase.google.com/project/arlipstick-84040/authentication/settings"
);
console.log("2. Click 'Authentication' in left sidebar");
console.log("3. Click 'Settings' tab");
console.log("4. Scroll to 'Authorized domains' section");
console.log("5. Click 'Add domain'");
console.log("6. Add 'arl-ipstick.vercel.app' and click 'Add'");
console.log("7. Click 'Add domain' again");
console.log("8. Add 'localhost' and click 'Add'");
console.log("\n=== After Adding Domains ===");
console.log("- Refresh https://arl-ipstick.vercel.app/");
console.log("- Refresh http://localhost:3000/");
console.log("- The auth error should be resolved");
