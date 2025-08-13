import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../firebaseAdmin";
import directEmailService from "../../../utils/directEmailService";
import { createUserCart } from "../../../utils/cartUtils";

export const dynamic = "force-dynamic";

// Generate a random 6-digit code
function generateRegistrationCode(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
	try {
		const { email, displayName, resend = false, userId } = await req.json();

		if (!email || !displayName) {
			return NextResponse.json(
				{ message: "Email and display name are required" },
				{ status: 400 }
			);
		}

		const firebaseApp = getFirebaseAdmin();

		if (!firebaseApp) {
			return NextResponse.json(
				{ message: "Failed to initialize Firebase Admin" },
				{ status: 500 }
			);
		}

		let userRef;
		let existingUserId;
		let authUserId;

		if (resend && userId) {
			// For resend, use existing user ID
			existingUserId = userId;
			userRef = { id: userId };
		} else {
			// Check if user already exists in Firestore
			const existingUser = await firebaseApp
				.firestore()
				.collection("users")
				.where("email", "==", email)
				.limit(1)
				.get();

			if (!existingUser.empty) {
				return NextResponse.json(
					{ message: "User already exists. Please sign in instead." },
					{ status: 409 }
				);
			}

			// Check if user exists in Firebase Auth
			try {
				const authUser = await firebaseApp.auth().getUserByEmail(email);
				authUserId = authUser.uid;
			} catch (error) {
				// User doesn't exist in Auth, create them
				const authUserRecord = await firebaseApp.auth().createUser({
					email,
					displayName,
					emailVerified: false,
				});
				authUserId = authUserRecord.uid;
			}

			// Create a new user document in Firestore
			userRef = await firebaseApp.firestore().collection("users").add({
				userId: authUserId,
				email,
				displayName,
				roleId: "customer", // Default role is 'customer', not 'user'
				profileCompleted: false,
				status: "pending",
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});

			// Create a cart for the new user
			await createUserCart(authUserId, firebaseApp);
		}

		// If resending, check for recent codes to prevent spam
		if (resend) {
			const recentCodes = await firebaseApp
				.firestore()
				.collection("registrationCodes")
				.where("userId", "==", userRef.id)
				.where("createdAt", ">", new Date(Date.now() - 60 * 1000).toISOString()) // Last 1 minute
				.get();

			if (!recentCodes.empty) {
				return NextResponse.json(
					{
						message:
							"Please wait at least 1 minute before requesting another code",
					},
					{ status: 429 }
				);
			}
		}

		// Generate registration code
		const code = generateRegistrationCode();
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

		// Store registration code
		await firebaseApp.firestore().collection("registrationCodes").add({
			userId: userRef.id,
			code,
			expiresAt: expiresAt.toISOString(),
			used: false,
			createdAt: new Date().toISOString(),
		});

		// Send the code via direct email service
		const emailSent = await directEmailService.sendVerificationCode(
			email,
			code,
			"registration"
		);

		if (!emailSent) {
			console.log(`Registration code for ${email}: ${code}`);
		}

		return NextResponse.json({
			message: resend
				? "New registration code sent to your email"
				: "Registration code sent to your email",
			userId: userRef.id,
			code: process.env.NODE_ENV === "development" ? code : undefined,
		});
	} catch (error) {
		console.error("Registration error:", error);
		return NextResponse.json(
			{ message: "Failed to register user", error: String(error) },
			{ status: 500 }
		);
	}
}
