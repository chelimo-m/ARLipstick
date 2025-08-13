const { google } = require("googleapis");

// You'll need to enable the Firebase Management API and get credentials
// This is a more complex approach that requires OAuth2 setup

console.log(
	"To add the authorized domain to Firebase, you have a few options:"
);
console.log("");
console.log("OPTION 1: Manual (Recommended)");
console.log(
	"1. Go to: https://console.firebase.google.com/project/joannak-try-on/authentication/settings"
);
console.log('2. Scroll down to "Authorized domains"');
console.log('3. Click "Add domain"');
console.log("4. Enter: ar-lipstick.vercel.app");
console.log('5. Click "Add"');
console.log("");
console.log("OPTION 2: Using Firebase CLI (if you have the right permissions)");
console.log(
	"firebase auth:domains:add ar-lipstick.vercel.app --project=joannak-try-on"
);
console.log("");
console.log("OPTION 3: Using Google Cloud CLI");
console.log("gcloud auth login");
console.log("gcloud config set project joannak-try-on");
console.log("gcloud firebase auth:domains:add ar-lipstick.vercel.app");
