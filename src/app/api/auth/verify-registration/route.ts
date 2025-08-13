import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../firebaseAdmin";
import { createUserCart } from "../../../utils/cartUtils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
	try {
		const { userId, code } = await req.json();

		if (!userId || !code) {
			return NextResponse.json(
				{ message: "User ID and code are required" },
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

		// Find the registration code (unused code with matching userId and code)
		const codeDoc = await firebaseApp
			.firestore()
			.collection("registrationCodes")
			.where("userId", "==", userId)
			.where("code", "==", code)
			.where("used", "==", false)
			.limit(1)
			.get();

		if (codeDoc.empty) {
			return NextResponse.json(
				{ message: "Invalid or expired registration code" },
				{ status: 400 }
			);
		}

		const codeData = codeDoc.docs[0].data();
		const codeId = codeDoc.docs[0].id;

		// Check if code is expired
		const expiresAt = new Date(codeData.expiresAt);
		if (expiresAt < new Date()) {
			return NextResponse.json(
				{ message: "Registration code has expired" },
				{ status: 400 }
			);
		}

		// Mark code as used
		await firebaseApp
			.firestore()
			.collection("registrationCodes")
			.doc(codeId)
			.update({ used: true });

		// Get user data to check if we need to link with Auth
		const userDoc = await firebaseApp
			.firestore()
			.collection("users")
			.doc(userId)
			.get();

		const userData = userDoc.data();

		// Update user status and link with Auth if needed
		const updateData: any = {
			status: "active",
			profileCompleted: true,
			updatedAt: new Date().toISOString(),
		};

		// If user doesn't have userId field, try to find the Auth user
		if (!userData?.userId) {
			try {
				const authUser = await firebaseApp.auth().getUserByEmail(userData?.email);
				updateData.userId = authUser.uid;
			} catch (error) {
				console.log("Could not find Auth user for email:", userData?.email);
			}
		}

		// Activate the user account
		await firebaseApp.firestore().collection("users").doc(userId).update(updateData);

		// Create cart for user if it doesn't exist
		const authUserId = updateData.userId || userData?.userId;
		if (authUserId) {
			try {
				await createUserCart(authUserId, firebaseApp);
			} catch (error) {
				console.log("Cart might already exist for user:", authUserId);
			}
		}

		// Get the updated user data
		const userDoc = await firebaseApp
			.firestore()
			.collection("users")
			.doc(userId)
			.get();

		const userData = userDoc.data();

		// Use the Auth user ID if available, otherwise use Firestore document ID
		const authUserId = userData?.userId || userId;

		// Create a custom token for the user
		const customToken = await firebaseApp.auth().createCustomToken(authUserId);

		return NextResponse.json({
			message: "Registration successful",
			user: {
				uid: authUserId,
				email: userData?.email,
				displayName: userData?.displayName,
				photoURL: userData?.photoURL,
				role: userData?.roleId,
			},
			customToken,
		});
	} catch (error) {
		console.error("Registration verification error:", error);
		return NextResponse.json(
			{ message: "Failed to verify registration", error: String(error) },
			{ status: 500 }
		);
	}
}
