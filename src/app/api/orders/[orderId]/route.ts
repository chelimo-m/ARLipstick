import { NextRequest, NextResponse } from "next/server";
import type { Order } from "../../../types/models";

// Prevent static generation of this API route
export const dynamic = "force-dynamic";

function isFirebaseConfigured() {
	return !!(
		process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
		process.env.FIREBASE_CLIENT_EMAIL &&
		process.env.FIREBASE_PRIVATE_KEY
	);
}

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ orderId: string }> }
) {
	if (!isFirebaseConfigured()) {
		return NextResponse.json(
			{ message: "Firebase credentials not configured" },
			{ status: 500 }
		);
	}

	const { orderId } = await params;
	try {
		if (!orderId) {
			return NextResponse.json({ message: "Missing orderId" }, { status: 400 });
		}
		const { status } = await req.json();
		if (!status) {
			return NextResponse.json({ message: "Missing status" }, { status: 400 });
		}

		// Get user and check if admin
		const authHeader = req.headers.get("authorization");
		if (!authHeader) {
			return NextResponse.json(
				{ message: "Missing Authorization header" },
				{ status: 401 }
			);
		}
		const idToken = authHeader.replace("Bearer ", "");

		const { getFirebaseAdmin } = await import("../../../firebaseAdmin");
		const firebaseApp = getFirebaseAdmin();
		if (!firebaseApp) {
			return NextResponse.json(
				{ message: "Failed to initialize Firebase Admin" },
				{ status: 500 }
			);
		}

		const decoded = await firebaseApp.auth().verifyIdToken(idToken);
		const uid = decoded.uid;

		// Get user info
		const userDoc = await firebaseApp
			.firestore()
			.collection("users")
			.doc(uid)
			.get();
		const user = userDoc.data();
		if (!user) {
			return NextResponse.json({ message: "User not found" }, { status: 404 });
		}

		// Get the order to check ownership and current status
		const orderRef = firebaseApp.firestore().collection("orders").doc(orderId);
		const orderSnap = await orderRef.get();
		if (!orderSnap.exists) {
			return NextResponse.json({ message: "Order not found" }, { status: 404 });
		}

		const order = orderSnap.data() as Order;

		// Check if user is admin OR if user owns the order
		const isAdmin = user.roleId === "admin";
		const isOwner = order.userId === uid;

		if (!isAdmin && !isOwner) {
			return NextResponse.json(
				{ message: "Unauthorized: You can only update your own orders" },
				{ status: 403 }
			);
		}

		// If user is not admin, they can only cancel orders (not approve/deliver)
		if (!isAdmin && status !== "cancelled") {
			return NextResponse.json(
				{ message: "Customers can only cancel orders" },
				{ status: 403 }
			);
		}

		// Check if order can be cancelled (pending and approved orders can be cancelled)
		if (
			status === "cancelled" &&
			!["pending", "approved"].includes(order.status || "")
		) {
			return NextResponse.json(
				{ message: "Only pending and approved orders can be cancelled" },
				{ status: 400 }
			);
		}

		// Update global order
		await orderRef.update({ status });
		const updatedOrder = (await orderRef.get()).data() as Order;
		// Also update in user subcollection
		if (updatedOrder && updatedOrder.userId) {
			const userOrderRef = firebaseApp
				.firestore()
				.collection("users")
				.doc(updatedOrder.userId)
				.collection("orders")
				.doc(orderId);
			await userOrderRef.update({ status });
		}
		return NextResponse.json(updatedOrder);
	} catch (error) {
		return NextResponse.json(
			{ message: "Failed to update order", error: (error as Error).message },
			{ status: 500 }
		);
	}
}

// Add similar isFirebaseConfigured check to any other handlers here if present
