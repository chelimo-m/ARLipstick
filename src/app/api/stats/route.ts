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

export async function GET(req: NextRequest) {
	if (!isFirebaseConfigured()) {
		return NextResponse.json(
			{ message: "Firebase credentials not configured" },
			{ status: 500 }
		);
	}

	console.log("STATS: /api/stats route called");
	const authHeader = req.headers.get("authorization");
	console.log("STATS: Authorization header:", authHeader);

	try {
		const uid = await getUserFromRequest(req);
		if (uid && typeof uid === "object" && "status" in uid) {
			return uid;
		}
		console.log("STATS: User UID:", uid);

		const { getFirebaseAdmin } = await import("../../firebaseAdmin");
		// @ts-ignore: firebaseApp is checked for null immediately after
		const firebaseApp = getFirebaseAdmin();
		if (!firebaseApp) throw new Error("Firebase Admin not initialized");
		// Type assertion for linter
		const app = firebaseApp as NonNullable<typeof firebaseApp>;

		// Fetch user profile
		const userDoc = await app.firestore().collection("users").doc(uid).get();
		const user = userDoc.data();
		console.log("STATS: User profile:", user);
		const isAdmin = user && user.roleId === "admin";
		console.log("STATS: isAdmin:", isAdmin);

		if (isAdmin) {
			// Fetch all data
			const [
				usersSnapshot,
				ordersSnapshot,
				productsSnapshot,
				paymentsSnapshot,
			] = await Promise.all([
				app.firestore().collection("users").get(),
				app.firestore().collection("orders").get(),
				app.firestore().collection("products").get(),
				app.firestore().collection("payments").get(),
			]);

			const users: any[] = usersSnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));
			const orders = ordersSnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as Array<Record<string, any>>;
			console.log("STATS: Total orders found:", orders.length);
			console.log("STATS: Sample order:", orders[0]);
			const products = productsSnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as Array<Record<string, any>>;
			const payments = paymentsSnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as Array<Record<string, any>>;

			// Compute user stats
			const now = new Date();
			const usersStats = {
				total: users.length,
				active: users.length, // Placeholder: all users are active
				newThisMonth: users.filter((u) => {
					if (!u.createdAt) return false;
					const d = new Date(u.createdAt);
					return (
						d.getFullYear() === now.getFullYear() &&
						d.getMonth() === now.getMonth()
					);
				}).length,
				roles: {
					admin: users.filter((u) => u.roleId === "admin").length,
					user: users.filter((u) => u.roleId === "user").length,
				},
			};
			// Compute product stats
			const categories: Record<string, number> = {};
			products.forEach((p) => {
				if (p.category)
					categories[p.category] = (categories[p.category] || 0) + 1;
			});
			const productsStats = {
				total: products.length,
				active: products.length, // Placeholder
				categories,
				lowStock: products.filter((p) => p.stock !== undefined && p.stock <= 10)
					.length,
				outOfStock: products.filter((p) => p.stock === 0).length,
			};
			// Compute order stats
			const ordersStats = {
				total: orders.length,
				pending: orders.filter((o) => o.status === "pending").length,
				completed: orders.filter((o) => o.status === "completed").length,
				cancelled: orders.filter((o) => o.status === "cancelled").length,
				approved: orders.filter((o) => o.status === "approved").length,
				paid: orders.filter((o) => o.status === "paid").length,
				delivered: orders.filter((o) => o.status === "delivered").length,
				thisMonth: orders.filter((o) => {
					if (!o.createdAt) return false;
					const d = new Date(o.createdAt);
					return (
						d.getFullYear() === now.getFullYear() &&
						d.getMonth() === now.getMonth()
					);
				}).length,
				totalRevenue: orders.reduce(
					(sum, o) => sum + (typeof o.total === "number" ? o.total : 0),
					0
				),
				averageOrderValue:
					orders.length > 0
						? Math.round(
								orders.reduce(
									(sum, o) => sum + (typeof o.total === "number" ? o.total : 0),
									0
								) / orders.length
						  )
						: 0,
			};
			// Compute payment stats
			const paymentsStats = {
				total: payments.length,
				successful: payments.filter((p) => p.status === "completed").length,
				failed: payments.filter((p) => p.status === "failed").length,
				pending: payments.filter((p) => p.status === "pending").length,
				totalAmount: payments.reduce(
					(sum, p) => sum + (typeof p.amount === "number" ? p.amount : 0),
					0
				),
				thisMonth: payments.filter((p) => {
					if (!p.createdAt) return false;
					const d = new Date(p.createdAt);
					return (
						d.getFullYear() === now.getFullYear() &&
						d.getMonth() === now.getMonth()
					);
				}).length,
				thisMonthAmount: payments
					.filter((p) => {
						if (!p.createdAt) return false;
						const d = new Date(p.createdAt);
						return (
							d.getFullYear() === now.getFullYear() &&
							d.getMonth() === now.getMonth()
						);
					})
					.reduce(
						(sum, p) => sum + (typeof p.amount === "number" ? p.amount : 0),
						0
					),
			};
			// Compute revenue stats
			const revenueStats = {
				total: ordersStats.totalRevenue,
				thisMonth: orders
					.filter((o) => {
						if (!o.createdAt) return false;
						const d = new Date(o.createdAt);
						return (
							d.getFullYear() === now.getFullYear() &&
							d.getMonth() === now.getMonth()
						);
					})
					.reduce(
						(sum, o) => sum + (typeof o.total === "number" ? o.total : 0),
						0
					),
				thisWeek: orders
					.filter((o) => {
						if (!o.createdAt) return false;
						const d = new Date(o.createdAt);
						const weekStart = new Date(now);
						weekStart.setDate(now.getDate() - now.getDay());
						return d >= weekStart;
					})
					.reduce(
						(sum, o) => sum + (typeof o.total === "number" ? o.total : 0),
						0
					),
				today: orders
					.filter((o) => {
						if (!o.createdAt) return false;
						const d = new Date(o.createdAt);
						return d.toDateString() === now.toDateString();
					})
					.reduce(
						(sum, o) => sum + (typeof o.total === "number" ? o.total : 0),
						0
					),
			};
			// Compute performance stats
			const conversionRate =
				ordersStats.total > 0
					? (ordersStats.completed / ordersStats.total) * 100
					: 0;
			const paymentSuccessRate =
				paymentsStats.total > 0
					? (paymentsStats.successful / paymentsStats.total) * 100
					: 0;
			const orderCompletionRate =
				ordersStats.total > 0
					? (ordersStats.completed / ordersStats.total) * 100
					: 0;
			const performanceStats = {
				conversionRate: Number(conversionRate.toFixed(1)),
				averageOrderValue: ordersStats.averageOrderValue,
				paymentSuccessRate: Number(paymentSuccessRate.toFixed(1)),
				orderCompletionRate: Number(orderCompletionRate.toFixed(1)),
			};
			// Compute inventory stats (placeholders)
			const inventoryStats = {
				totalProducts: products.length,
				lowStock: productsStats.lowStock,
				outOfStock: productsStats.outOfStock,
				wellStocked: products.filter((p) => p.stock && p.stock > 10).length,
				totalStockValue: products.reduce(
					(sum, p) =>
						sum +
						(typeof p.price === "number" && typeof p.stock === "number"
							? p.price * p.stock
							: 0),
					0
				),
			};
			// Monthly revenue (group by month)
			const monthlyRevenueMap = new Map();
			orders.forEach((o) => {
				if (o.createdAt && o.total) {
					const date = new Date(o.createdAt);
					const month = `${date.getFullYear()}-${(date.getMonth() + 1)
						.toString()
						.padStart(2, "0")}`;
					monthlyRevenueMap.set(
						month,
						(monthlyRevenueMap.get(month) || 0) +
							(typeof o.total === "number" ? o.total : 0)
					);
				}
			});
			const monthlyRevenue = Array.from(monthlyRevenueMap.entries()).map(
				([month, revenue]) => ({
					month: month, // already 'YYYY-MM'
					revenue: Number(revenue),
					orders: orders.filter(
						(o) =>
							o.createdAt &&
							`${new Date(o.createdAt).getFullYear()}-${(
								new Date(o.createdAt).getMonth() + 1
							)
								.toString()
								.padStart(2, "0")}` === month
					).length,
				})
			);
			monthlyRevenue.sort((a, b) => a.month.localeCompare(b.month));
			// Analytics (for chart)
			const analytics = { monthlyRevenue };
			// Top products (by totalSold or total revenue)
			const productSalesMap = new Map();
			orders.forEach((o) => {
				if (Array.isArray(o.items)) {
					o.items.forEach((item: any) => {
						const id = item.productId || item.id;
						if (!id) return;
						const prev = productSalesMap.get(id) || {
							totalSold: 0,
							revenue: 0,
						};
						const qty = item.quantity || 1;
						const price = item.priceAtPurchase || item.price || 0;
						productSalesMap.set(id, {
							totalSold: prev.totalSold + qty,
							revenue: prev.revenue + qty * price,
						});
					});
				}
			});
			const topProducts = products
				.map((p) => {
					let price =
						typeof p.price === "number"
							? p.price
							: typeof p.price === "string"
							? Number(p.price)
							: 0;
					let oldPrice =
						typeof p.oldPrice === "number"
							? p.oldPrice
							: typeof p.oldPrice === "string"
							? Number(p.oldPrice)
							: undefined;
					// If price is missing or 0 but oldPrice exists, use oldPrice as price
					if ((!price || price === 0) && oldPrice && oldPrice > 0)
						price = oldPrice;
					if (oldPrice === undefined || oldPrice === 0) oldPrice = price;
					return {
						id: p.id,
						name: p.name,
						totalSold: Number(productSalesMap.get(p.id)?.totalSold || 0),
						revenue: Number(productSalesMap.get(p.id)?.revenue || 0),
						stock: Number(p.stock || 0),
						imageUrl: p.imageUrl || null,
						price,
						oldPrice,
					};
				})
				.sort((a, b) => b.totalSold - a.totalSold)
				.slice(0, 5);
			// Recent activity
			const recentOrders = [...orders]
				.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				)
				.slice(0, 5)
				.map((o) => ({
					id: o.id,
					orderId: o.orderId || o.id,
					total: Number(o.total),
					status: o.status,
					createdAt: o.createdAt,
					customerName: (() => {
						const user = users.find((u) => (u.uid || u.id) === o.userId);
						return user ? user.displayName || user.email : "Unknown";
					})(),
					customerEmail: (() => {
						const user = users.find((u) => (u.uid || u.id) === o.userId);
						return user ? user.email : "Unknown";
					})(),
					customerPhotoURL: (() => {
						const user = users.find((u) => (u.uid || u.id) === o.userId);
						return user ? user.photoURL : null;
					})(),
				}));
			console.log("STATS: Recent orders count:", recentOrders.length);
			console.log("STATS: Recent orders sample:", recentOrders[0]);
			const recentPayments = [...payments]
				.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				)
				.slice(0, 5)
				.map((p) => ({
					id: p.id,
					paymentId: p.paymentId || p.id,
					amount: Number(p.amount),
					status: p.status,
					createdAt: p.createdAt,
					orderId: p.orderId,
					transactionRef: p.transactionRef || p.paystackRef,
				}));
			const newUsers = [...users]
				.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				)
				.slice(0, 5)
				.map((u) => ({
					id: u.uid || u.id,
					displayName: u.displayName,
					email: u.email,
					createdAt: u.createdAt,
					roleId: u.roleId,
					photoURL: u.photoURL,
				}));
			const recentActivity = { recentOrders, recentPayments, newUsers };
			// Compute order status distribution
			const statusCounts: Record<string, number> = {};
			orders.forEach((o) => {
				const status = o.status || "unknown";
				statusCounts[status] = (statusCounts[status] || 0) + 1;
			});
			// Compose response
			return NextResponse.json({
				users: usersStats,
				orders: ordersStats,
				products: productsStats,
				payments: paymentsStats,
				revenue: revenueStats,
				topProducts,
				recentActivity,
				performance: performanceStats,
				inventory: inventoryStats,
				analytics: { monthlyRevenue },
				orderStatusDistribution: statusCounts,
			});
		} else {
			// Fetch only this user's orders and payments
			const userOrdersSnap = await app
				.firestore()
				.collection("users")
				.doc(uid)
				.collection("orders")
				.get();
			const userPaymentsSnap = await app
				.firestore()
				.collection("users")
				.doc(uid)
				.collection("payments")
				.get();
			const orders = userOrdersSnap.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as Array<Record<string, any>>;
			const payments = userPaymentsSnap.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as Array<Record<string, any>>;

			// Compute order stats
			const orderStats = {
				total: orders.length,
				completed: orders.filter((o) => o.status === "completed").length,
				pending: orders.filter((o) => o.status === "pending").length,
				cancelled: orders.filter((o) => o.status === "cancelled").length,
				approved: orders.filter((o) => o.status === "approved").length,
				paid: orders.filter((o) => o.status === "paid").length,
				totalSpent: orders.reduce(
					(sum, o) => sum + (typeof o.total === "number" ? o.total : 0),
					0
				),
			};
			// Compute payment stats
			const paymentStats = {
				total: payments.length,
				successful: payments.filter((p) => p.status === "completed").length,
				failed: payments.filter((p) => p.status === "failed").length,
				pending: payments.filter((p) => p.status === "pending").length,
				totalAmount: payments.reduce(
					(sum, p) => sum + (typeof p.amount === "number" ? p.amount : 0),
					0
				),
			};
			// Recent orders/payments (sorted by createdAt desc)
			const recentOrders = [...orders]
				.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				)
				.slice(0, 5);
			const recentPayments = [...payments]
				.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				)
				.slice(0, 5);
			// Monthly spending (group by month)
			const monthlySpendingMap = new Map();
			orders.forEach((o) => {
				if (o.createdAt && o.total) {
					const date = new Date(o.createdAt);
					const month = `${date.getFullYear()}-${(date.getMonth() + 1)
						.toString()
						.padStart(2, "0")}`;
					monthlySpendingMap.set(
						month,
						(monthlySpendingMap.get(month) || 0) +
							(typeof o.total === "number" ? o.total : 0)
					);
				}
			});
			const monthlySpending = Array.from(monthlySpendingMap.entries()).map(
				([month, amount]) => ({ month, amount })
			);
			monthlySpending.sort((a, b) => a.month.localeCompare(b.month));
			// Analytics (for chart)
			const analytics = {
				monthlyRevenue: monthlySpending.map((m) => ({
					month: m.month,
					revenue: m.amount,
				})),
			};
			// Top products (optional, empty for user)
			const topProducts: any[] = [];
			// Compose response
			return NextResponse.json({
				orders: orderStats,
				payments: paymentStats,
				recentOrders,
				recentPayments,
				monthlySpending,
				topProducts,
				analytics,
			});
		}
	} catch (error) {
		return NextResponse.json(
			{ message: "Failed to fetch stats", error: (error as Error).message },
			{ status: 500 }
		);
	}
}
