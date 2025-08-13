const https = require("https");

// This script uses the Firebase Management REST API to add an authorized domain
// You'll need to get an access token first

async function getAccessToken() {
	return new Promise((resolve, reject) => {
		const data = JSON.stringify({
			client_id:
				"563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
			client_secret: "j9iVZfS8kkCEFUPaAeJV0sAi",
			grant_type: "refresh_token",
			refresh_token: "YOUR_REFRESH_TOKEN", // You'll need to get this
		});

		const options = {
			hostname: "oauth2.googleapis.com",
			port: 443,
			path: "/token",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Content-Length": data.length,
			},
		};

		const req = https.request(options, (res) => {
			let body = "";
			res.on("data", (chunk) => (body += chunk));
			res.on("end", () => {
				try {
					const token = JSON.parse(body);
					resolve(token.access_token);
				} catch (error) {
					reject(error);
				}
			});
		});

		req.on("error", reject);
		req.write(data);
		req.end();
	});
}

async function addAuthorizedDomain(accessToken) {
	return new Promise((resolve, reject) => {
		const data = JSON.stringify({
			authorizedDomains: ["ar-lipstick.vercel.app"],
		});

		const options = {
			hostname: "firebase.googleapis.com",
			port: 443,
			path: "/v1beta1/projects/joannak-try-on/oauthIdpConfigs/firebase",
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
				"Content-Length": data.length,
			},
		};

		const req = https.request(options, (res) => {
			let body = "";
			res.on("data", (chunk) => (body += chunk));
			res.on("end", () => {
				console.log("Response:", body);
				resolve(body);
			});
		});

		req.on("error", reject);
		req.write(data);
		req.end();
	});
}

// Since getting the access token requires OAuth2 setup, let's provide manual instructions
console.log(
	"Unfortunately, adding authorized domains via CLI requires complex OAuth2 setup."
);
console.log("");
console.log("The easiest way is to do it manually:");
console.log("");
console.log(
	"1. Go to: https://console.firebase.google.com/project/joannak-try-on/authentication/settings"
);
console.log('2. Scroll down to "Authorized domains"');
console.log('3. Click "Add domain"');
console.log("4. Enter: ar-lipstick.vercel.app");
console.log('5. Click "Add"');
console.log("");
console.log("This will immediately authorize the domain for Google login.");
