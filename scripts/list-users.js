const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("../src/secret/firebase-service-account.json");
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function listUsers() {
	console.log("Current users in the system:");
	console.log("=".repeat(50));

	try {
		const usersSnapshot = await db.collection("users").get();

		if (usersSnapshot.empty) {
			console.log("No users found in the system.");
			return;
		}

		const users = [];
		usersSnapshot.forEach((doc) => {
			users.push({
				id: doc.id,
				...doc.data(),
			});
		});

		// Sort by creation date
		users.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

		users.forEach((user, index) => {
			console.log(`${index + 1}. ${user.displayName || "No Name"}`);
			console.log(`   Email: ${user.email}`);
			console.log(`   Role: ${user.roleId}`);
			console.log(`   Created: ${user.createdAt}`);

			// Format last login
			let lastLoginDisplay = "Never";
			if (user.lastLoginAt) {
				const date = new Date(user.lastLoginAt);
				const now = new Date();
				const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

				if (diffInHours < 24) {
					lastLoginDisplay = date.toLocaleTimeString("en-US", {
						hour: "2-digit",
						minute: "2-digit",
						hour12: true,
					});
				} else {
					const day = date.getDate();
					const month = date.toLocaleDateString("en-US", { month: "long" });
					const year = date.getFullYear();

					const getOrdinalSuffix = (day) => {
						if (day > 3 && day < 21) return "th";
						switch (day % 10) {
							case 1:
								return "st";
							case 2:
								return "nd";
							case 3:
								return "rd";
							default:
								return "th";
						}
					};

					lastLoginDisplay = `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
				}
			}

			console.log(`   Last Login: ${lastLoginDisplay}`);
			console.log(`   ID: ${user.id}`);
			console.log("");
		});

		console.log(`Total users: ${users.length}`);
	} catch (error) {
		console.error("Error listing users:", error);
	} finally {
		process.exit(0);
	}
}

listUsers();
