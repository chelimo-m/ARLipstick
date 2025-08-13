console.log("=== Testing Production API ===");
console.log("\n=== Test URLs ===");
console.log("1. API Endpoint: https://arl-ipstick.vercel.app/api/products");
console.log("2. Main App: https://arl-ipstick.vercel.app/");
console.log("\n=== Manual Test Steps ===");
console.log(
	"1. Open browser and go to: https://arl-ipstick.vercel.app/api/products"
);
console.log("2. If you see JSON data with products → API is working");
console.log("3. If you see an error → Environment variables missing");
console.log("\n=== Common Error Messages ===");
console.log("- 'Firebase credentials not configured' → Missing env vars");
console.log("- 'Failed to initialize Firebase Admin' → Wrong credentials");
console.log("- 'Unauthorized' → Firebase permissions issue");
console.log("- Empty array [] → No products in database");
console.log("\n=== Next Steps ===");
console.log(
	"If API returns error, follow the environment variable setup steps"
);
console.log("If API returns empty array, check Firebase Console for products");
