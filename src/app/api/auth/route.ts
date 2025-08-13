import { NextRequest, NextResponse } from "next/server";
import type {
	DocumentReference,
	DocumentSnapshot,
} from "firebase-admin/firestore";

// Prevent static generation of this API route
export const dynamic = "force-dynamic";

function isFirebaseConfigured() {
	return !!(
		process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
		process.env.FIREBASE_CLIENT_EMAIL &&
		process.env.FIREBASE_PRIVATE_KEY
	);
}

export async function POST(req: NextRequest) {
	if (!isFirebaseConfigured()) {
		return NextResponse.json(
			{ message: "Firebase credentials not configured" },
			{ status: 500 }
		);
	}

	try {
		const { idToken } = await req.json();
		if (!idToken) {
			return NextResponse.json({ message: "Missing idToken" }, { status: 400 });
		}

		const { getFirebaseAdmin } = await import("../../firebaseAdmin");
		const firebaseApp = getFirebaseAdmin();
		if (!firebaseApp) {
			return NextResponse.json(
				{ message: "Failed to initialize Firebase Admin" },
				{ status: 500 }
			);
		}
		const decodedToken = await firebaseApp.auth().verifyIdToken(idToken);
		const userRecord = await firebaseApp.auth().getUser(decodedToken.uid);
		// Fallback: use decodedToken.picture if userRecord.photoURL is missing
		const photoURL = userRecord.photoURL || decodedToken.picture || null;

		// Check if a user with this email already exists
		const existingUserQuery = await firebaseApp
			.firestore()
			.collection("users")
			.where("email", "==", userRecord.email)
			.limit(1)
			.get();

		let userData;
		let userDocRef: DocumentReference;

		if (!existingUserQuery.empty) {
			// User with this email exists - link accounts
			const existingUserDoc = existingUserQuery.docs[0];
			const existingUserData = existingUserDoc.data();

			// Update the existing user document with Firebase Auth UID
			userDocRef = existingUserDoc.ref;
			userData = {
				...existingUserData,
				userId: userRecord.uid, // Link to Firebase Auth UID
				photoURL: photoURL || existingUserData.photoURL, // Use new photo if available
				displayName: userRecord.displayName || existingUserData.displayName, // Use new name if available
				phone: userRecord.phoneNumber || existingUserData.phone || "",
				lastLoginAt: new Date().toISOString(),
			};

			// Update the existing user document
			await userDocRef.set(userData, { merge: true });

			console.log(
				`Linked existing user ${existingUserData.email} to Firebase Auth UID ${userRecord.uid}`
			);
		} else {
			// No existing user with this email - create new user
			userDocRef = firebaseApp
				.firestore()
				.collection("users")
				.doc(userRecord.uid);

			const userDoc: DocumentSnapshot = await userDocRef.get();

			if (!userDoc.exists) {
				userData = {
					userId: userRecord.uid,
					email: userRecord.email,
					displayName: userRecord.displayName,
					photoURL,
					roleId: "customer", // Default roleId is 'customer'
					phone: userRecord.phoneNumber || "",
					bio: "",
					profileCompleted: false,
					status: "active",
					createdAt: new Date().toISOString(),
					lastLoginAt: new Date().toISOString(),
				};
				await userDocRef.set(userData, { merge: true });
			} else {
				userData = userDoc.data();
			}
		}
		return NextResponse.json({
			user: {
				userId: userRecord.uid,
				email: userRecord.email,
				displayName: userRecord.displayName,
				photoURL,
				roleId: userData?.roleId || "customer",
				phone: userData?.phone || "",
				bio: userData?.bio || "",
				profileCompleted: userData?.profileCompleted || false,
				status: userData?.status || "active",
				createdAt: userData?.createdAt || new Date().toISOString(),
				lastLoginAt: userData?.lastLoginAt || new Date().toISOString(),
			},
		});
	} catch (error: unknown) {
		console.error("/api/auth error:", error);
		const message =
			error instanceof Error && error.message ? error.message : String(error);
		return NextResponse.json(
			{ message: "Login failed", error: message },
			{ status: 500 }
		);
	}
}
