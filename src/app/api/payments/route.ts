import { NextRequest, NextResponse } from "next/server";
import type { Payment } from "../../types/models";

// Prevent static generation of this API route
export const dynamic = "force-dynamic";

function isFirebaseConfigured() {
	return !!(
		process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
		process.env.FIREBASE_CLIENT_EMAIL &&
		process.env.FIREBASE_PRIVATE_KEY
	);
}

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

// GET: Fetch all payments (admin)
export async function GET() {
	if (!isFirebaseConfigured()) {
		return NextResponse.json(
			{ message: "Firebase credentials not configured" },
			{ status: 500 }
		);
	}

	try {
		const { getFirebaseAdmin } = await import("../../firebaseAdmin");
		const firebaseApp = getFirebaseAdmin();
		if (!firebaseApp) {
			return NextResponse.json(
				{ message: "Failed to initialize Firebase Admin" },
				{ status: 500 }
			);
		}

		const snapshot = await firebaseApp.firestore().collection("payments").get();
		const payments: Payment[] = snapshot.docs.map(
			(doc) => doc.data() as Payment
		);

		// Fetch order statuses for each payment
		const paymentsWithOrderStatus = await Promise.all(
			payments.map(async (payment) => {
				try {
					if (payment.orderId) {
						const orderDoc = await firebaseApp
							.firestore()
							.collection("orders")
							.doc(payment.orderId)
							.get();

						if (orderDoc.exists) {
							const orderData = orderDoc.data();
							return {
								...payment,
								orderStatus: orderData?.status || "unknown",
								deliveryLocation:
									orderData?.deliveryLocation ||
									payment.deliveryLocation ||
									null,
							};
						}
					}
					return {
						...payment,
						orderStatus: "unknown",
						deliveryLocation: payment.deliveryLocation || null,
					};
				} catch (error) {
					console.error(
						`Error fetching order status for payment ${payment.paymentId}:`,
						error
					);
					return {
						...payment,
						orderStatus: "unknown",
						deliveryLocation: payment.deliveryLocation || null,
					};
				}
			})
		);

		return NextResponse.json(paymentsWithOrderStatus);
	} catch (error) {
		return NextResponse.json(
			{ message: "Failed to fetch payments", error: (error as Error).message },
			{ status: 500 }
		);
	}
}

// POST: Create a new payment (user)
export async function POST(req: NextRequest) {
	if (!isFirebaseConfigured()) {
		return NextResponse.json(
			{ message: "Firebase credentials not configured" },
			{ status: 500 }
		);
	}

	try {
		const uid = await getUserFromRequest(req);
		if (uid && typeof uid === "object" && "status" in uid) {
			return uid;
		}
		const payment: Payment = await req.json();

		const { getFirebaseAdmin } = await import("../../firebaseAdmin");
		const firebaseApp = getFirebaseAdmin();
		if (!firebaseApp) {
			return NextResponse.json(
				{ message: "Failed to initialize Firebase Admin" },
				{ status: 500 }
			);
		}

		const paymentId = firebaseApp.firestore().collection("payments").doc().id;
		const globalPayment: Payment = { ...payment, paymentId, userId: uid };
		// Store in global payments
		await firebaseApp
			.firestore()
			.collection("payments")
			.doc(paymentId)
			.set(globalPayment);
		// Store in user subcollection
		await firebaseApp
			.firestore()
			.collection("users")
			.doc(uid)
			.collection("payments")
			.doc(paymentId)
			.set(payment);
		return NextResponse.json({ message: "Payment created", paymentId });
	} catch (error) {
		return NextResponse.json(
			{ message: "Failed to create payment", error: (error as Error).message },
			{ status: 500 }
		);
	}
}
