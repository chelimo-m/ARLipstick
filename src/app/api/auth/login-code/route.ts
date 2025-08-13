import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../firebaseAdmin";
import directEmailService from "../../../utils/directEmailService";

export const dynamic = "force-dynamic";

// Generate a random 6-digit code
function generateLoginCode(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
	try {
		const { email, resend = false } = await req.json();

		if (!email) {
			return NextResponse.json(
				{ message: "Email is required" },
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

		// Check if user exists
		const userDoc = await firebaseApp
			.firestore()
			.collection("users")
			.where("email", "==", email)
			.limit(1)
			.get();

		if (userDoc.empty) {
			return NextResponse.json(
				{ message: "User not found. Please register first." },
				{ status: 404 }
			);
		}

		const userData = userDoc.docs[0].data();
		const userId = userDoc.docs[0].id;

		// If resending, check for recent codes to prevent spam
		if (resend) {
			const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
			const recentCodes = await firebaseApp
				.firestore()
				.collection("loginCodes")
				.where("userId", "==", userId)
				.where("createdAt", ">", oneMinuteAgo)
				.limit(1)
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

		// Generate login code
		const code = generateLoginCode();
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

		// Store login code in Firestore
		await firebaseApp.firestore().collection("loginCodes").add({
			userId,
			code,
			expiresAt: expiresAt.toISOString(),
			used: false,
			createdAt: new Date().toISOString(),
		});

		// Send the code via direct email service
		const emailSent = await directEmailService.sendVerificationCode(
			email,
			code,
			"login"
		);

		if (!emailSent) {
			console.log(`Login code for ${email}: ${code}`);
		}

		return NextResponse.json({
			message: resend
				? "New login code sent to your email"
				: "Login code sent to your email",
			code: process.env.NODE_ENV === "development" ? code : undefined,
		});
	} catch (error) {
		console.error("Login code generation error:", error);
		return NextResponse.json(
			{ message: "Failed to generate login code", error: String(error) },
			{ status: 500 }
		);
	}
}
