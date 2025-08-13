import { NextResponse } from "next/server";
import type { Product } from "../../types/models";
import cloudinary from "cloudinary";

// Prevent static generation of this API route
export const dynamic = "force-dynamic";

cloudinary.v2.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

function isFirebaseConfigured() {
	return !!(
		process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
		process.env.FIREBASE_CLIENT_EMAIL &&
		process.env.FIREBASE_PRIVATE_KEY
	);
}

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

		const snapshot = await firebaseApp.firestore().collection("products").get();
		const products: Product[] = snapshot.docs.map((doc) => ({
			productId: doc.id,
			...(doc.data() as Omit<Product, "productId">),
		}));
		return NextResponse.json(products);
	} catch (error) {
		return NextResponse.json(
			{ message: "Failed to fetch products", error: (error as Error).message },
			{ status: 500 }
		);
	}
}

export async function POST(req: Request) {
	if (!isFirebaseConfigured()) {
		return NextResponse.json(
			{ message: "Firebase credentials not configured" },
			{ status: 500 }
		);
	}

	try {
		const body = await req.json();
		const {
			name,
			colorName,
			hexColor,
			price,
			imageUrl,
			stock,
			description,
			category,
			finish,
			oldPrice,
		} = body;
		if (
			!name ||
			!description ||
			!hexColor ||
			!price ||
			!imageUrl ||
			stock === undefined
		) {
			return NextResponse.json(
				{ message: "Missing required fields" },
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

		const numericStock = Number(stock);
		const docRef = firebaseApp.firestore().collection("products").doc();
		const productId = docRef.id;
		const createdAt = new Date().toISOString();
		const productData = {
			productId,
			name,
			description,
			price: Number(price),
			imageUrl,
			category: category || "Lipstick",
			stock: numericStock,
			colorName: colorName || "",
			hexColor,
			finish: finish || "matte",
			oldPrice: oldPrice ? Number(oldPrice) : undefined,
			createdAt,
			updatedAt: createdAt,
		};
		await docRef.set(productData);
		return NextResponse.json(productData);
	} catch (error) {
		return NextResponse.json(
			{ message: "Failed to add product", error: (error as Error).message },
			{ status: 500 }
		);
	}
}

export async function PATCH(req: Request) {
	try {
		const body = await req.json();
		const { id, ...fields } = body;
		if (!id) {
			return NextResponse.json(
				{ message: "Missing product ID" },
				{ status: 400 }
			);
		}
		if (fields.stock !== undefined) {
			const numericStock = Number(fields.stock);
			fields.stock = numericStock;
		}
		fields.updatedAt = new Date().toISOString();
		const { getFirebaseAdmin } = await import("../../firebaseAdmin");
		const firebaseApp = getFirebaseAdmin();
		if (!firebaseApp) {
			return NextResponse.json(
				{ message: "Failed to initialize Firebase Admin" },
				{ status: 500 }
			);
		}
		await firebaseApp.firestore().collection("products").doc(id).update(fields);
		return NextResponse.json({ message: "Product updated" });
	} catch (error) {
		return NextResponse.json(
			{ message: "Failed to update product", error: (error as Error).message },
			{ status: 500 }
		);
	}
}
