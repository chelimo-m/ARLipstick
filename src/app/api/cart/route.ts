import { NextRequest, NextResponse } from "next/server";
import type { CartItem } from "../../types/models";

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

	const { getFirebaseAdmin } = await import("../../firebaseAdmin");
	const firebaseApp = getFirebaseAdmin();
	if (!firebaseApp) {
		throw new Error("Failed to initialize Firebase Admin");
	}
	const decoded = await firebaseApp.auth().verifyIdToken(idToken);
	return decoded.uid;
}

// POST: Add item to cart
export async function POST(req: NextRequest) {
	if (!isFirebaseConfigured()) {
		return NextResponse.json(
			{ message: "Firebase credentials not configured" },
			{ status: 500 }
		);
	}

	try {
		let body;
		try {
			body = await req.json();
		} catch (err) {
			return NextResponse.json(
				{
					message: "Invalid JSON body",
					error: err instanceof Error ? err.message : String(err),
				},
				{ status: 400 }
			);
		}
		const uid = await getUserFromRequest(req);
		const { productId, quantity = 1, name, price, imageUrl } = body;
		if (!productId) {
			return NextResponse.json(
				{ message: "Missing productId" },
				{ status: 400 }
			);
		}
		if (!quantity || typeof quantity !== "number" || quantity < 1) {
			return NextResponse.json(
				{ message: "Invalid quantity" },
				{ status: 400 }
			);
		}

		const { getFirebaseAdmin } = await import("../../firebaseAdmin");
		const firebaseApp = getFirebaseAdmin();
		if (!firebaseApp) {
			return NextResponse.json(
				{ message: "Failed to initialize Firebase Admin" },
				{ status: 500 }
			);
		}
		// Add or update cart item
		const cartRef = firebaseApp
			.firestore()
			.collection("users")
			.doc(uid)
			.collection("cart")
			.doc(productId);
		const cartItem: CartItem = {
			cartItemId: productId,
			cartId: uid,
			productId,
			quantity,
			addedAt: new Date().toISOString(),
			name: name || "",
			price: price || 0,
			imageUrl: imageUrl || "",
		};
		await cartRef.set(cartItem, { merge: true });
		return NextResponse.json({ message: "Added to cart" });
	} catch (error: unknown) {
		console.error(
			"API /api/cart error:",
			error,
			error instanceof Error ? error.stack : ""
		);
		return NextResponse.json(
			{
				message: "Failed to add to cart",
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}

// GET: Fetch user's cart
export async function GET(req: NextRequest) {
	if (!isFirebaseConfigured()) {
		return NextResponse.json(
			{ message: "Firebase credentials not configured" },
			{ status: 500 }
		);
	}

	try {
		const uid = await getUserFromRequest(req);
		const { getFirebaseAdmin } = await import("../../firebaseAdmin");
		const firebaseApp = getFirebaseAdmin();
		if (!firebaseApp) {
			return NextResponse.json(
				{ message: "Failed to initialize Firebase Admin" },
				{ status: 500 }
			);
		}

		const cartSnap = await firebaseApp
			.firestore()
			.collection("users")
			.doc(uid)
			.collection("cart")
			.get();
		const cart = cartSnap.docs.map((doc) => doc.data());
		return NextResponse.json(cart);
	} catch (error: unknown) {
		console.error(
			"API /api/cart error:",
			error,
			error instanceof Error ? error.stack : ""
		);
		return NextResponse.json(
			{
				message: "Failed to fetch cart",
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}

// DELETE: Clear user's cart
export async function DELETE(req: NextRequest) {
	if (!isFirebaseConfigured()) {
		return NextResponse.json(
			{ message: "Firebase credentials not configured" },
			{ status: 500 }
		);
	}

	try {
		const uid = await getUserFromRequest(req);
		const { getFirebaseAdmin } = await import("../../firebaseAdmin");
		const firebaseApp = getFirebaseAdmin();
		if (!firebaseApp) {
			return NextResponse.json(
				{ message: "Failed to initialize Firebase Admin" },
				{ status: 500 }
			);
		}

		const cartRef = firebaseApp
			.firestore()
			.collection("users")
			.doc(uid)
			.collection("cart");
		const cartSnap = await cartRef.get();
		const batch = firebaseApp.firestore().batch();
		cartSnap.docs.forEach((doc) => batch.delete(doc.ref));
		await batch.commit();
		return NextResponse.json({ message: "Cart cleared" });
	} catch (error: unknown) {
		console.error(
			"API /api/cart DELETE error:",
			error,
			error instanceof Error ? error.stack : ""
		);
		return NextResponse.json(
			{
				message: "Failed to clear cart",
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
