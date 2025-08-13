#!/usr/bin/env node

/**
 * Admin Registration Script
 *
 * This script creates an admin user with proper role assignment and permissions.
 * Usage: node scripts/register-admin.js
 */

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const readline = require("readline");

// Initialize Firebase Admin
const serviceAccount = {
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
	privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

if (
	!serviceAccount.projectId ||
	!serviceAccount.clientEmail ||
	!serviceAccount.privateKey
) {
	console.error("❌ Firebase credentials not found in environment variables");
	console.error("Please ensure the following are set:");
	console.error("- NEXT_PUBLIC_FIREBASE_PROJECT_ID");
	console.error("- FIREBASE_CLIENT_EMAIL");
	console.error("- FIREBASE_PRIVATE_KEY");
	process.exit(1);
}

// Initialize Firebase Admin
let app;
try {
	app = initializeApp({
		credential: cert(serviceAccount),
	});
	console.log("✅ Firebase Admin initialized successfully");
} catch (error) {
	console.error("❌ Failed to initialize Firebase Admin:", error.message);
	process.exit(1);
}

const db = getFirestore(app);
const auth = getAuth(app);

// Create readline interface for user input
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

// Helper function to prompt for input
function askQuestion(question) {
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			resolve(answer.trim());
		});
	});
}

// Admin role configuration
const ADMIN_ROLE = {
	roleId: "admin",
	roleName: "Administrator",
	description: "Full system administrator with all permissions",
	permissions: [
		"manage_users",
		"manage_products",
		"manage_orders",
		"manage_payments",
		"view_analytics",
		"manage_inventory",
		"manage_settings",
		"view_reports",
	],
	createdAt: new Date().toISOString(),
};

// User role configuration
const USER_ROLE = {
	roleId: "user",
	roleName: "Customer",
	description: "Regular customer with basic permissions",
	permissions: [
		"view_products",
		"place_orders",
		"view_own_orders",
		"manage_own_profile",
	],
	createdAt: new Date().toISOString(),
};

async function createRole(roleData) {
	try {
		await db.collection("userRoles").doc(roleData.roleId).set(roleData);
		console.log(`✅ Role '${roleData.roleName}' created successfully`);
		return true;
	} catch (error) {
		console.error(
			`❌ Failed to create role '${roleData.roleName}':`,
			error.message
		);
		return false;
	}
}

async function checkRoleExists(roleId) {
	try {
		const doc = await db.collection("userRoles").doc(roleId).get();
		return doc.exists;
	} catch (error) {
		console.error(`❌ Error checking role '${roleId}':`, error.message);
		return false;
	}
}

async function createUserInAuth(email, password, displayName) {
	try {
		const userRecord = await auth.createUser({
			email,
			password,
			displayName,
			emailVerified: true,
		});
		console.log(`✅ User created in Firebase Auth: ${userRecord.uid}`);
		return userRecord;
	} catch (error) {
		console.error("❌ Failed to create user in Firebase Auth:", error.message);
		throw error;
	}
}

async function createUserInFirestore(userRecord, userData) {
	try {
		const userDoc = {
			userId: userRecord.uid,
			email: userRecord.email,
			displayName: userRecord.displayName,
			photoURL: userRecord.photoURL || null,
			roleId: userData.roleId,
			phone: userData.phone || null,
			bio: userData.bio || null,
			profileCompleted: true,
			status: "active",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await db.collection("users").doc(userRecord.uid).set(userDoc);
		console.log(`✅ User document created in Firestore`);
		return userDoc;
	} catch (error) {
		console.error(
			"❌ Failed to create user document in Firestore:",
			error.message
		);
		throw error;
	}
}

async function createCartForUser(userId) {
	try {
		const cartData = {
			cartId: userId, // Use userId as cartId for simplicity
			userId,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await db.collection("carts").doc(userId).set(cartData);
		console.log(`✅ Cart created for user`);
		return cartData;
	} catch (error) {
		console.error("❌ Failed to create cart:", error.message);
		throw error;
	}
}

async function checkUserExists(email) {
	try {
		// Check in Firestore first
		const snapshot = await db
			.collection("users")
			.where("email", "==", email)
			.limit(1)
			.get();

		if (!snapshot.empty) {
			return { exists: true, location: "firestore" };
		}

		// Check in Firebase Auth
		try {
			const userRecord = await auth.getUserByEmail(email);
			return { exists: true, location: "auth", uid: userRecord.uid };
		} catch (error) {
			if (error.code === "auth/user-not-found") {
				return { exists: false };
			}
			throw error;
		}
	} catch (error) {
		console.error("❌ Error checking if user exists:", error.message);
		return { exists: false, error: error.message };
	}
}

async function registerAdmin() {
	console.log("\n🎯 Admin Registration Script");
	console.log("============================\n");

	try {
		// Check and create roles if they don't exist
		console.log("📋 Checking roles...");

		const adminRoleExists = await checkRoleExists("admin");
		const userRoleExists = await checkRoleExists("user");

		if (!adminRoleExists) {
			console.log("Creating admin role...");
			await createRole(ADMIN_ROLE);
		} else {
			console.log("✅ Admin role already exists");
		}

		if (!userRoleExists) {
			console.log("Creating user role...");
			await createRole(USER_ROLE);
		} else {
			console.log("✅ User role already exists");
		}

		// Admin users to create
		const adminUsers = [
			{
				email: "Mercykitur84@gmail.com",
				displayName: "Mercy Kitur",
				phone: "+254700000001",
				bio: "System Administrator for AR Lipstick",
			},
		];

		// Process each admin user
		for (const adminData of adminUsers) {
			console.log(
				`\n🔍 Processing admin: ${adminData.displayName} (${adminData.email})`
			);

			// Check if user already exists
			const userCheck = await checkUserExists(adminData.email);

			if (userCheck.exists) {
				if (userCheck.location === "firestore") {
					console.log(
						`✅ Admin user ${adminData.displayName} already exists in Firestore`
					);
					continue;
				} else if (userCheck.location === "auth") {
					console.log(
						`⚠️  Admin user ${adminData.displayName} exists in Auth but not in Firestore`
					);
					console.log(`📄 Creating missing Firestore document...`);

					try {
						// Get the existing user record from Auth
						const userRecord = await auth.getUserByEmail(adminData.email);

						// Create user document in Firestore
						const userData = {
							roleId: "admin",
							phone: adminData.phone,
							bio: adminData.bio,
						};

						await createUserInFirestore(userRecord, userData);

						// Create cart for user
						console.log(`🛒 Creating admin cart...`);
						await createCartForUser(userRecord.uid);

						console.log(
							`✅ Successfully completed admin setup: ${adminData.displayName}`
						);
						continue;
					} catch (error) {
						console.error(
							`❌ Failed to complete admin setup: ${error.message}`
						);
						continue;
					}
				}
			}

			// Create new user in Firebase Auth (without password - using email verification)
			console.log(`👤 Creating admin user in Firebase Auth...`);
			const userRecord = await auth.createUser({
				email: adminData.email,
				displayName: adminData.displayName,
				emailVerified: true,
			});
			console.log(`✅ Admin user created in Firebase Auth: ${userRecord.uid}`);

			// Create user document in Firestore
			console.log(`📄 Creating admin document in Firestore...`);
			const userData = {
				roleId: "admin",
				phone: adminData.phone,
				bio: adminData.bio,
			};

			const userDoc = await createUserInFirestore(userRecord, userData);

			// Create cart for user
			console.log(`🛒 Creating admin cart...`);
			await createCartForUser(userRecord.uid);

			console.log(`✅ Successfully registered admin: ${adminData.displayName}`);
		}

		// Success message
		console.log("\n🎉 Admin Registration Completed!");
		console.log("================================");
		console.log("Registered Admin Users:");
		adminUsers.forEach((admin) => {
			console.log(`- ${admin.displayName} (${admin.email})`);
		});
		console.log("\n✅ All admins can now log in using email verification");
		console.log("📧 Use the login page and request a verification code");
	} catch (error) {
		console.error("\n❌ Registration failed:", error.message);
	} finally {
		rl.close();
	}
}

// Handle script execution
if (require.main === module) {
	registerAdmin().catch((error) => {
		console.error("❌ Script execution failed:", error.message);
		process.exit(1);
	});
}

module.exports = { registerAdmin };
