import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../firebaseAdmin";

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

		// Activate the user account
		await firebaseApp.firestore().collection("users").doc(userId).update({
			status: "active",
			profileCompleted: true,
		});

		// Get the updated user data
		const userDoc = await firebaseApp
			.firestore()
			.collection("users")
			.doc(userId)
			.get();

		const userData = userDoc.data();

		// Create a custom token for the user
		const customToken = await firebaseApp.auth().createCustomToken(userId);

		return NextResponse.json({
			message: "Registration successful",
			user: {
				uid: userId,
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
