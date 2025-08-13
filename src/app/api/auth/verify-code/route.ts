import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../firebaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
	try {
		const { email, code } = await req.json();

		if (!email || !code) {
			return NextResponse.json(
				{ message: "Email and code are required" },
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

		// Find the user
		const userDoc = await firebaseApp
			.firestore()
			.collection("users")
			.where("email", "==", email)
			.limit(1)
			.get();

		if (userDoc.empty) {
			return NextResponse.json({ message: "User not found" }, { status: 404 });
		}

		const userData = userDoc.docs[0].data();
		const userId = userDoc.docs[0].id;

		// Find the login code (most recent unused code with matching userId and code)
		const codeDoc = await firebaseApp
			.firestore()
			.collection("loginCodes")
			.where("userId", "==", userId)
			.where("code", "==", code)
			.where("used", "==", false)
			.limit(1)
			.get();

		if (codeDoc.empty) {
			return NextResponse.json(
				{ message: "Invalid or expired code" },
				{ status: 400 }
			);
		}

		const codeData = codeDoc.docs[0].data();
		const codeId = codeDoc.docs[0].id;

		// Check if code is expired
		const expiresAt = new Date(codeData.expiresAt);
		if (expiresAt < new Date()) {
			return NextResponse.json(
				{ message: "Code has expired" },
				{ status: 400 }
			);
		}

		// Mark code as used
		await firebaseApp
			.firestore()
			.collection("loginCodes")
			.doc(codeId)
			.update({ used: true });

		// Create a custom token for the user
		const customToken = await firebaseApp.auth().createCustomToken(userId);

		return NextResponse.json({
			message: "Login successful",
			user: {
				uid: userId,
				email: userData.email,
				displayName: userData.displayName,
				photoURL: userData.photoURL,
				role: userData.roleId,
			},
			customToken,
		});
	} catch (error) {
		console.error("Code verification error:", error);
		return NextResponse.json(
			{ message: "Failed to verify code", error: String(error) },
			{ status: 500 }
		);
	}
}
