import { NextRequest, NextResponse } from "next/server";

// Prevent static generation of this API route
export const dynamic = "force-dynamic";

function isFirebaseConfigured() {
	return !!(
		process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
		process.env.FIREBASE_CLIENT_EMAIL &&
		process.env.FIREBASE_PRIVATE_KEY
	);
}

// Helper to get user from idToken
async function getUserFromRequest(req: NextRequest) {
	const authHeader = req.headers.get("authorization");
	if (!authHeader) throw new Error("Missing Authorization header");
	const idToken = authHeader.replace("Bearer ", "");

	const { getFirebaseAdmin } = await import("../../../firebaseAdmin");
	const firebaseApp = getFirebaseAdmin();
	if (!firebaseApp) {
		throw new Error("Failed to initialize Firebase Admin");
	}
	const decoded = await firebaseApp.auth().verifyIdToken(idToken);
	return decoded.uid;
}

// DELETE: Remove specific item from cart
export async function DELETE(
	req: NextRequest,
	{ params }: { params: { productId: string } }
) {
	if (!isFirebaseConfigured()) {
		return NextResponse.json(
			{ message: "Firebase credentials not configured" },
			{ status: 500 }
		);
	}

	try {
		const uid = await getUserFromRequest(req);
		const { productId } = params;

		if (!productId) {
			return NextResponse.json(
				{ message: "Missing productId" },
				{ status: 400 }
			);
		}

		const { getFirebaseAdmin } = await import("../../../firebaseAdmin");
		const firebaseApp = getFirebaseAdmin();
		if (!firebaseApp) {
			return NextResponse.json(
				{ message: "Failed to initialize Firebase Admin" },
				{ status: 500 }
			);
		}

		// Remove the specific cart item
		await firebaseApp
			.firestore()
			.collection("users")
			.doc(uid)
			.collection("cart")
			.doc(productId)
			.delete();

		return NextResponse.json({ message: "Item removed from cart" });
	} catch (error: unknown) {
		console.error(
			"API /api/cart/[productId] DELETE error:",
			error,
			error instanceof Error ? error.stack : ""
		);
		return NextResponse.json(
			{
				message: "Failed to remove item from cart",
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
