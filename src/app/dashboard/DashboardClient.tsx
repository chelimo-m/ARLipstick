"use client";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { app } from "../firebaseConfig";
import {
	FaBoxOpen,
	FaCreditCard,
	FaUsers,
	FaBoxes,
	FaPlus,
	FaCheckCircle,
	FaUser,
	FaShoppingCart,
	FaHeart,
	FaHistory,
	FaChartBar,
	FaTrophy,
	FaUserPlus,
	FaClock,
	FaChartLine,
} from "react-icons/fa";
import { Table } from "antd";
import "antd/dist/reset.css";
import {
	AreaChart,
	Area,
	PieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import Image from "next/image";
import UserAvatar from "../components/UserAvatar";

function formatKES(value: any) {
	if (typeof value !== "number") return value;
	return value.toLocaleString("en-KE", { style: "currency", currency: "KES" });
}
function formatPrettyDate(dateString: any) {
	if (!dateString) return "-";
	const date = new Date(dateString);
	const day = date.getDate();
	const month = date.toLocaleString("en-US", { month: "long" });
	const year = date.getFullYear();
	const j = day % 10,
		k = day % 100;
	let suffix = "th";
	if (j === 1 && k !== 11) suffix = "st";
	else if (j === 2 && k !== 12) suffix = "nd";
	else if (j === 3 && k !== 13) suffix = "rd";
	return `${day}${suffix} ${month}, ${year}`;
}

export default function DashboardClient() {
	const [loading, setLoading] = useState(true);
	const [isAdmin, setIsAdmin] = useState(false);
	const router = useRouter();
	// Add state for profile, orders, payments, cart, stats
	const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
	const [payments, setPayments] = useState<Array<Record<string, unknown>>>([]);
	const [userProfile, setUserProfile] = useState<Record<
		string,
		unknown
	> | null>(null);
	const [stats, setStats] = useState<{
		totalUsers?: number;
		totalOrders?: number;
		totalSales?: number;
		pendingOrders?: number;
	}>({});
	const [comprehensiveStats, setComprehensiveStats] = useState<Record<
		string,
		unknown
	> | null>(null);

	useEffect(() => {
		const auth = getAuth(app);
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			if (firebaseUser) {
				const idToken = await firebaseUser.getIdToken();
				// Fetch profile
				const resProfile = await fetch("/api/users", {
					headers: { Authorization: `Bearer ${idToken}` },
				});
				let dataProfile = await resProfile.json();
				if (Array.isArray(dataProfile)) {
					// If it's an array (admin), find the current user
					dataProfile =
						(dataProfile as Array<Record<string, unknown>>).find(
							(u) => (u.uid || u.userId) === firebaseUser.uid
						) || dataProfile[0];
				}
				// If it's not an array, it's already the user profile

				setUserProfile(dataProfile);
				const userIsAdmin = dataProfile.roleId === "admin";
				console.log("Dashboard: User profile:", dataProfile);
				console.log("Dashboard: roleId:", dataProfile.roleId);
				console.log("Dashboard: userIsAdmin:", userIsAdmin);
				setIsAdmin(userIsAdmin);

				// Fetch orders
				const resOrders = await fetch("/api/orders?userOnly=1", {
					headers: { Authorization: `Bearer ${idToken}` },
				});
				let userOrders = [];
				if (resOrders.ok) userOrders = await resOrders.json();

				// If admin, fetch stats and all orders
				if (userIsAdmin) {
					const resAllUsers = await fetch("/api/users", {
						headers: { Authorization: `Bearer ${idToken}` },
					});
					const allUsers = await resAllUsers.json();
					const resAllOrders = await fetch("/api/orders", {
						headers: { Authorization: `Bearer ${idToken}` },
					});
					const allOrders = await resAllOrders.json();
					const resAllPayments = await fetch("/api/payments", {
						headers: { Authorization: `Bearer ${idToken}` },
					});
					const allPayments = await resAllPayments.json();

					// Fetch comprehensive stats
					try {
						const resStats = await fetch("/api/stats", {
							headers: { Authorization: `Bearer ${idToken}` },
						});
						if (resStats.ok) {
							const comprehensiveData = await resStats.json();
							setComprehensiveStats(comprehensiveData);
						}
					} catch (error) {
						console.error("Failed to fetch comprehensive stats:", error);
					}

					setStats({
						totalUsers: allUsers.length,
						totalOrders: allOrders.length,
						totalSales: (allPayments as Array<Record<string, unknown>>).reduce(
							(sum, p) => sum + (typeof p.amount === "number" ? p.amount : 0),
							0
						),
						pendingOrders: (allOrders as Array<Record<string, unknown>>).filter(
							(o) => o.status === "pending"
						).length,
					});
					setOrders(allOrders);
				} else {
					setOrders(userOrders);
					// Fetch comprehensive stats for non-admins
					try {
						const resStats = await fetch("/api/stats", {
							headers: { Authorization: `Bearer ${idToken}` },
						});
						if (resStats.ok) {
							const comprehensiveData = await resStats.json();
							setComprehensiveStats(comprehensiveData);
						}
					} catch (error) {
						console.error("Failed to fetch user stats:", error);
					}
				}
				// Fetch payments
				const resPayments = await fetch("/api/payments", {
					headers: { Authorization: `Bearer ${idToken}` },
				});
				if (resPayments.ok) setPayments(await resPayments.json());
				setLoading(false);
			} else {
				router.replace("/login");
			}
		});
		return () => unsubscribe();
	}, [router]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				Loading dashboard...
			</div>
		);
	}

	// User Dashboard
	if (!isAdmin) {
		// Extract user stats if available
		const userStats = (comprehensiveStats as any) || {};
		const orderStats = userStats.orders || {};
		const paymentStats = userStats.payments || {};
		const recentOrders = userStats.recentOrders || [];
		const recentPayments = userStats.recentPayments || [];
		const monthlySpending = userStats.monthlySpending || [];

		return (
			<main className="flex-1 min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					{/* User Dashboard Title */}
					<div className="text-center mb-12">
						<h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
							Welcome back!
						</h1>
						<p className="text-lg text-gray-600 max-w-2xl mx-auto">
							Track your orders, manage your profile, and discover new lipstick
							shades
						</p>
					</div>

					{/* User Stats Cards */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
						<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-600">
										Total Orders
									</p>
									<p className="text-2xl font-bold text-gray-900">
										{orderStats.total ?? 0}
									</p>
								</div>
								<div className="p-3 bg-pink-100 rounded-lg">
									<FaBoxOpen className="text-pink-600 text-xl" />
								</div>
							</div>
						</div>
						<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-600">
										Total Spent
									</p>
									<p className="text-2xl font-bold text-gray-900">
										{(orderStats.totalSpent ?? 0).toLocaleString("en-KE", {
											style: "currency",
											currency: "KES",
										})}
									</p>
								</div>
								<div className="p-3 bg-green-100 rounded-lg">
									<FaCreditCard className="text-green-600 text-xl" />
								</div>
							</div>
						</div>
						<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-600">Payments</p>
									<p className="text-2xl font-bold text-gray-900">
										{paymentStats.total ?? 0}
									</p>
								</div>
								<div className="p-3 bg-blue-100 rounded-lg">
									<FaCreditCard className="text-blue-600 text-xl" />
								</div>
							</div>
						</div>
					</div>

					{/* Analytics Section */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
						{/* Order Status Pie Chart */}
						<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
							<h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
								<div className="p-2 bg-blue-100 rounded-lg">
									<FaChartBar className="text-blue-600" />
								</div>
								Order Status Distribution
							</h2>
							{(() => {
								const completed = orderStats.completed || 0;
								const pending = orderStats.pending || 0;
								const cancelled = orderStats.cancelled || 0;
								const approved = orderStats.approved || 0;
								const paid = orderStats.paid || 0;
								const hasData =
									completed > 0 ||
									pending > 0 ||
									cancelled > 0 ||
									approved > 0 ||
									paid > 0;
								if (!hasData) {
									return (
										<div className="flex items-center justify-center h-48 text-gray-400 text-lg font-semibold">
											No order data available
										</div>
									);
								}
								const pieData = [
									{ name: "Completed", value: completed, color: "#10b981" },
									{ name: "Pending", value: pending, color: "#f59e0b" },
									{ name: "Cancelled", value: cancelled, color: "#ef4444" },
									{ name: "Approved", value: approved, color: "#3b82f6" },
									{ name: "Paid", value: paid, color: "#ec4899" },
								].filter((d) => d.value > 0);
								return (
									<ResponsiveContainer width="100%" height={250}>
										<PieChart>
											<Pie
												data={pieData}
												cx="50%"
												cy="50%"
												labelLine={false}
												label={({ name, percent }) =>
													`${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`
												}
												outerRadius={80}
												fill="#8884d8"
												dataKey="value"
											>
												{pieData.map((entry, index) => (
													<Cell key={`cell-${index}`} fill={entry.color} />
												))}
											</Pie>
											<Tooltip />
										</PieChart>
									</ResponsiveContainer>
								);
							})()}
						</div>
						{/* Monthly Spending Area Chart */}
						<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
							<h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
								<div className="p-2 bg-green-100 rounded-lg">
									<FaChartLine className="text-green-600" />
								</div>
								Monthly Spending Trend
							</h2>
							<ResponsiveContainer width="100%" height={250}>
								<AreaChart data={monthlySpending}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="month" />
									<YAxis />
									<Tooltip
										formatter={(value) => [
											`Ksh ${(value as number)?.toLocaleString()}`,
											"Spent",
										]}
									/>
									<Area
										type="monotone"
										dataKey="amount"
										stroke="#ec4899"
										fill="#fce7f3"
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
					</div>

					{/* User Quick Actions */}
					<div className="mb-12">
						<h2 className="text-2xl font-bold text-gray-900 mb-6">
							Quick Actions
						</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
							<a
								href="/shop"
								className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:border-pink-200"
							>
								<div className="flex flex-col items-center text-center">
									<div className="p-3 bg-pink-100 rounded-lg mb-4 group-hover:bg-pink-200 transition-colors">
										<FaShoppingCart className="text-pink-600 text-2xl" />
									</div>
									<h3 className="text-lg font-semibold text-gray-900 mb-2">
										Shop Now
									</h3>
									<p className="text-gray-600 text-sm">
										Browse our premium lipstick collection
									</p>
								</div>
							</a>
							<a
								href="/virtual-tryon"
								className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:border-purple-200"
							>
								<div className="flex flex-col items-center text-center">
									<div className="p-3 bg-purple-100 rounded-lg mb-4 group-hover:bg-purple-200 transition-colors">
										<FaUser className="text-purple-600 text-2xl" />
									</div>
									<h3 className="text-lg font-semibold text-gray-900 mb-2">
										Virtual Try-On
									</h3>
									<p className="text-gray-600 text-sm">
										Try on lipsticks virtually with AR
									</p>
								</div>
							</a>
							<a
								href="/dashboard/orders"
								className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:border-blue-200"
							>
								<div className="flex flex-col items-center text-center">
									<div className="p-3 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200 transition-colors">
										<FaHistory className="text-blue-600 text-2xl" />
									</div>
									<h3 className="text-lg font-semibold text-gray-900 mb-2">
										Order History
									</h3>
									<p className="text-gray-600 text-sm">
										View your past orders and track current ones
									</p>
								</div>
							</a>
							<a
								href="/dashboard/profile"
								className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:border-green-200"
							>
								<div className="flex flex-col items-center text-center">
									<div className="p-3 bg-green-100 rounded-lg mb-4 group-hover:bg-green-200 transition-colors">
										<FaUser className="text-green-600 text-2xl" />
									</div>
									<h3 className="text-lg font-semibold text-gray-900 mb-2">
										My Profile
									</h3>
									<p className="text-gray-600 text-sm">
										Update your profile and preferences
									</p>
								</div>
							</a>
						</div>
					</div>

					{/* Recent Orders Table */}
					<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
						<h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
							<div className="p-2 bg-orange-100 rounded-lg">
								<FaBoxOpen className="text-orange-600" />
							</div>
							Recent Orders
						</h2>
						{recentOrders.length > 0 ? (
							<div className="w-full overflow-x-auto">
								<Table
									columns={[
										{
											title: (
												<span className="text-pink-700 font-bold">Order #</span>
											),
											dataIndex: "orderId",
											key: "orderId",
											render: (v: string | number | undefined) => (
												<span className="font-semibold text-black">
													{v ? v : "-"}
												</span>
											),
										},
										{
											title: (
												<span className="text-pink-700 font-bold">Total</span>
											),
											dataIndex: "total",
											key: "total",
											render: (v: string | number | undefined) => (
												<span className="font-bold text-black">
													{typeof v === "number" ? formatKES(v) : "-"}
												</span>
											),
										},
										{
											title: (
												<span className="text-pink-700 font-bold">Status</span>
											),
											dataIndex: "status",
											key: "status",
											render: (v: string | undefined) => (
												<span
													className={`px-2 py-1 rounded-full text-xs font-bold ${
														v === "completed"
															? "bg-green-100 text-green-700"
															: v === "pending"
															? "bg-yellow-100 text-yellow-700"
															: v === "approved"
															? "bg-blue-100 text-blue-700"
															: v === "paid"
															? "bg-pink-100 text-pink-700"
															: v === "cancelled"
															? "bg-red-100 text-red-700"
															: "bg-gray-100 text-gray-700"
													}`}
												>
													{v || "Unknown"}
												</span>
											),
										},
										{
											title: (
												<span className="text-pink-700 font-bold">Date</span>
											),
											dataIndex: "createdAt",
											key: "createdAt",
											render: (v: string | undefined) => {
												if (!v) return <span className="text-gray-600">-</span>;
												const date = new Date(v);
												const day = date.getDate();
												const month = date.toLocaleString("en-US", {
													month: "long",
												});
												const year = date.getFullYear();
												// Get ordinal suffix
												const j = day % 10,
													k = day % 100;
												let suffix = "th";
												if (j === 1 && k !== 11) suffix = "st";
												else if (j === 2 && k !== 12) suffix = "nd";
												else if (j === 3 && k !== 13) suffix = "rd";
												return (
													<span className="text-gray-600">
														{day}
														{suffix} {month}, {year}
													</span>
												);
											},
										},
									]}
									dataSource={recentOrders}
									pagination={false}
									rowKey="id"
									className="custom-table min-w-[600px]"
									scroll={{ x: true }}
								/>
							</div>
						) : (
							<div className="text-center py-8 text-gray-500">
								<p className="text-lg">No recent orders.</p>
								<p className="text-sm">
									Start shopping to see your orders here!
								</p>
							</div>
						)}
					</div>

					{/* Recent Payments Table */}
					<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
						<h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
							<div className="p-2 bg-green-100 rounded-lg">
								<FaCreditCard className="text-green-600" />
							</div>
							Recent Payments
						</h2>
						{recentPayments.length > 0 ? (
							<div className="w-full overflow-x-auto">
								<Table
									columns={[
										{
											title: (
												<span className="text-pink-700 font-bold">
													Payment ID
												</span>
											),
											dataIndex: "paymentId",
											key: "paymentId",
											render: (v: string | number | undefined) => (
												<span className="font-semibold text-black">
													{v ? v : "-"}
												</span>
											),
										},
										{
											title: (
												<span className="text-pink-700 font-bold">Amount</span>
											),
											dataIndex: "amount",
											key: "amount",
											render: (v: string | number | undefined) => (
												<span className="font-bold text-pink-800">
													{typeof v === "number" ? formatKES(v) : "-"}
												</span>
											),
										},
										{
											title: (
												<span className="text-pink-700 font-bold">Status</span>
											),
											dataIndex: "status",
											key: "status",
											render: (v: string | undefined) => {
												let colorClass = "bg-gray-100 text-gray-700";
												if (v === "completed" || v === "success")
													colorClass = "bg-green-100 text-green-700";
												else if (v === "pending")
													colorClass = "bg-yellow-100 text-yellow-700";
												else if (
													v === "failed" ||
													v === "cancelled" ||
													v === "canceled"
												)
													colorClass = "bg-red-100 text-red-700";
												return (
													<span
														className={`px-3 py-0.5 rounded-full text-xs font-bold capitalize ${colorClass}`}
													>
														{v ? v.charAt(0).toUpperCase() + v.slice(1) : "-"}
													</span>
												);
											},
										},
										{
											title: (
												<span className="text-pink-700 font-bold">Date</span>
											),
											dataIndex: "createdAt",
											key: "createdAt",
											render: (v: string | undefined) => {
												if (!v) return <span className="text-gray-600">-</span>;
												const date = new Date(v);
												const day = date.getDate();
												const month = date.toLocaleString("en-US", {
													month: "long",
												});
												const year = date.getFullYear();
												// Get ordinal suffix
												const j = day % 10,
													k = day % 100;
												let suffix = "th";
												if (j === 1 && k !== 11) suffix = "st";
												else if (j === 2 && k !== 12) suffix = "nd";
												else if (j === 3 && k !== 13) suffix = "rd";
												return (
													<span className="text-gray-600">
														{day}
														{suffix} {month}, {year}
													</span>
												);
											},
										},
									]}
									dataSource={recentPayments}
									pagination={false}
									rowKey="id"
									className="custom-table min-w-[600px]"
									scroll={{ x: true }}
								/>
							</div>
						) : (
							<div className="text-center py-8 text-gray-500">
								<p className="text-lg">No recent payments.</p>
								<p className="text-sm">
									Payments will appear here after your first purchase.
								</p>
							</div>
						)}
					</div>
				</div>
			</main>
		);
	}

	// Admin Dashboard
	if (isAdmin) {
		return (
			<main className="flex-1 min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					{/* Dashboard Title */}
					<div className="text-center mb-12">
						<h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
							Admin Dashboard
						</h1>
						<p className="text-lg text-gray-600 max-w-2xl mx-auto">
							Monitor sales, manage products, and oversee your beauty business
						</p>
					</div>

					{/* Stats Cards */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
						<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-600">
										Total Users
									</p>
									<p className="text-2xl font-bold text-gray-900">
										{stats.totalUsers ?? "-"}
									</p>
								</div>
								<div className="p-3 bg-blue-100 rounded-lg">
									<FaUsers className="text-blue-600 text-xl" />
								</div>
							</div>
						</div>
						<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-600">
										Total Orders
									</p>
									<p className="text-2xl font-bold text-gray-900">
										{stats.totalOrders ?? "-"}
									</p>
								</div>
								<div className="p-3 bg-orange-100 rounded-lg">
									<FaBoxOpen className="text-orange-600 text-xl" />
								</div>
							</div>
						</div>
						<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-600">
										Total Sales
									</p>
									<p className="text-2xl font-bold text-gray-900">
										{stats.totalSales?.toLocaleString("en-KE", {
											style: "currency",
											currency: "KES",
										}) ?? "-"}
									</p>
								</div>
								<div className="p-3 bg-green-100 rounded-lg">
									<FaCreditCard className="text-green-600 text-xl" />
								</div>
							</div>
						</div>
						<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-600">
										Pending Orders
									</p>
									<p className="text-2xl font-bold text-gray-900">
										{stats.pendingOrders ?? "-"}
									</p>
								</div>
								<div className="p-3 bg-yellow-100 rounded-lg">
									<FaCheckCircle className="text-yellow-600 text-xl" />
								</div>
							</div>
						</div>
					</div>

					{/* Quick Actions */}
					<div className="mb-12">
						<h2 className="text-2xl font-bold text-gray-900 mb-6">
							Quick Actions
						</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
							<a
								href="/dashboard/admin/add-product"
								className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:border-green-200"
							>
								<div className="flex flex-col items-center text-center">
									<div className="p-3 bg-green-100 rounded-lg mb-4 group-hover:bg-green-200 transition-colors">
										<FaPlus className="text-green-600 text-2xl" />
									</div>
									<h3 className="text-lg font-semibold text-gray-900 mb-2">
										Add Product
									</h3>
									<p className="text-gray-600 text-sm">
										Add new lipstick or beauty products
									</p>
								</div>
							</a>
							<a
								href="/dashboard/admin/approve-orders"
								className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:border-blue-200"
							>
								<div className="flex flex-col items-center text-center">
									<div className="p-3 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200 transition-colors">
										<FaCheckCircle className="text-blue-600 text-2xl" />
									</div>
									<h3 className="text-lg font-semibold text-gray-900 mb-2">
										Approve Orders
									</h3>
									<p className="text-gray-600 text-sm">
										Review and approve pending orders
									</p>
								</div>
							</a>
							<a
								href="/dashboard/admin/products"
								className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:border-orange-200"
							>
								<div className="flex flex-col items-center text-center">
									<div className="p-3 bg-orange-100 rounded-lg mb-4 group-hover:bg-orange-200 transition-colors">
										<FaBoxes className="text-orange-600 text-2xl" />
									</div>
									<h3 className="text-lg font-semibold text-gray-900 mb-2">
										Manage Products
									</h3>
									<p className="text-gray-600 text-sm">
										Edit or remove existing products
									</p>
								</div>
							</a>
							<a
								href="/dashboard/admin/users"
								className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:border-purple-200"
							>
								<div className="flex flex-col items-center text-center">
									<div className="p-3 bg-purple-100 rounded-lg mb-4 group-hover:bg-purple-200 transition-colors">
										<FaUsers className="text-purple-600 text-2xl" />
									</div>
									<h3 className="text-lg font-semibold text-gray-900 mb-2">
										User Management
									</h3>
									<p className="text-gray-600 text-sm">
										View and manage all users
									</p>
								</div>
							</a>
							<a
								href="/dashboard/admin/payments"
								className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:border-green-200"
							>
								<div className="flex flex-col items-center text-center">
									<div className="p-3 bg-green-100 rounded-lg mb-4 group-hover:bg-green-200 transition-colors">
										<FaCreditCard className="text-green-600 text-2xl" />
									</div>
									<h3 className="text-lg font-semibold text-gray-900 mb-2">
										Payments
									</h3>
									<p className="text-gray-600 text-sm">
										View and manage all payments
									</p>
								</div>
							</a>
						</div>
					</div>

					{/* Analytics Section */}
					{comprehensiveStats && (
						<div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
							{/* Left Column: Performance + Revenue Chart */}
							<div className="flex flex-col gap-8">
								{/* Monthly Revenue Trend Chart */}
								<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
									<h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
										<div className="p-2 bg-green-100 rounded-lg">
											<FaChartLine className="text-green-600" />
										</div>
										Monthly Revenue Trend
									</h2>
									<ResponsiveContainer width="100%" height={250}>
										<AreaChart
											data={
												(comprehensiveStats.analytics as any)?.monthlyRevenue ||
												[]
											}
										>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="month" />
											<YAxis />
											<Tooltip
												formatter={(value) => [
													`Ksh ${value?.toLocaleString()}`,
													"Revenue",
												]}
											/>
											<Area
												type="monotone"
												dataKey="revenue"
												stroke="#ec4899"
												fill="#fce7f3"
											/>
										</AreaChart>
									</ResponsiveContainer>
								</div>
								{/* Order Status Pie Chart */}
								<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
									<h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
										<div className="p-2 bg-blue-100 rounded-lg">
											<FaChartBar className="text-blue-600" />
										</div>
										Order Status Distribution
									</h2>
									{(() => {
										const completed =
											(comprehensiveStats.orders as any)?.completed || 0;
										const pending =
											(comprehensiveStats.orders as any)?.pending || 0;
										const cancelled =
											(comprehensiveStats.orders as any)?.cancelled || 0;
										const approved =
											(comprehensiveStats.orders as any)?.approved || 0;
										const paid = (comprehensiveStats.orders as any)?.paid || 0;
										const hasData =
											completed > 0 ||
											pending > 0 ||
											cancelled > 0 ||
											approved > 0 ||
											paid > 0;
										if (!hasData) {
											return (
												<div className="flex items-center justify-center h-48 text-gray-400 text-lg font-semibold">
													No order data available
												</div>
											);
										}
										const pieData = [
											{ name: "Completed", value: completed, color: "#10b981" },
											{ name: "Pending", value: pending, color: "#f59e0b" },
											{ name: "Cancelled", value: cancelled, color: "#ef4444" },
											{ name: "Approved", value: approved, color: "#3b82f6" },
											{ name: "Paid", value: paid, color: "#ec4899" },
										].filter((d) => d.value > 0);
										return (
											<ResponsiveContainer width="100%" height={250}>
												<PieChart>
													<Pie
														data={pieData}
														cx="50%"
														cy="50%"
														labelLine={false}
														label={({ name, percent }) =>
															`${name} ${((percent || 0) * 100).toFixed(0)}%`
														}
														outerRadius={80}
														fill="#8884d8"
														dataKey="value"
													>
														{pieData.map((entry, index) => (
															<Cell key={`cell-${index}`} fill={entry.color} />
														))}
													</Pie>
													<Tooltip />
												</PieChart>
											</ResponsiveContainer>
										);
									})()}
								</div>
							</div>
							{/* Right Column: Top Products + Order Status Pie */}
							<div className="flex flex-col gap-8">
								{/* Top Products */}
								<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
									<h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
										<div className="p-2 bg-yellow-100 rounded-lg">
											<FaTrophy className="text-yellow-600" />
										</div>
										Top Products
									</h2>
									<div className="space-y-3">
										{(comprehensiveStats.topProducts as any[])
											?.slice(0, 5)
											.map((product: any, index: number) => {
												let rankColor = "text-pink-600";
												if (index === 1) rankColor = "text-purple-600";
												else if (index === 2) rankColor = "text-yellow-500";
												return (
													<div
														key={product.id}
														className="flex items-center justify-between p-3 bg-pink-50 rounded-xl shadow-sm"
													>
														<div className="flex items-center gap-3">
															<span
																className={`font-bold text-lg ${rankColor}`}
															>
																#{index + 1}
															</span>
															<span className="inline-block w-10 h-10 relative">
																<Image
																	src={
																		product.imageUrl || "/ar-lipstick-logo.svg"
																	}
																	alt={product.name || "Product"}
																	width={40}
																	height={40}
																	className="rounded-full object-cover border border-pink-200 bg-white"
																/>
															</span>
															<div>
																<p className="font-semibold text-gray-800 mb-0.5">
																	{product.name || "Unknown Product"}
																</p>
																<p className="text-xs text-gray-500 mb-0.5">
																	Stock: {product.stock || 0}
																</p>
																<p className="font-bold text-pink-800 text-base">
																	Sold: {product.totalSold || 0}
																</p>
															</div>
														</div>
														<div className="flex flex-col items-end">
															{product.oldPrice &&
															product.oldPrice > product.price ? (
																<p className="text-xs text-gray-400 line-through mb-0.5">
																	{formatKES(product.oldPrice)}
																</p>
															) : null}
															{product.oldPrice &&
															product.oldPrice > product.price ? (
																<span className="inline-block bg-pink-100 text-pink-600 text-xs font-bold px-2 py-0.5 rounded-full mb-1 ml-1 align-middle">
																	{Math.round(
																		((product.oldPrice - product.price) /
																			product.oldPrice) *
																			100
																	)}
																	% OFF
																</span>
															) : null}
															<p className="text-pink-800 font-bold text-base mb-0.5">
																{formatKES(product.price || 0)}
															</p>
														</div>
													</div>
												);
											})}
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Recent Activity Section */}
					{comprehensiveStats && (
						<>
							{/* Recent Orders Table - full width row */}
							<div className="mb-8">
								<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full">
									<h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
										<div className="p-2 bg-orange-100 rounded-lg">
											<FaClock className="text-orange-600" />
										</div>
										Recent Orders
									</h2>
									<div className="w-full overflow-x-auto">
										<Table
											columns={[
												{
													title: (
														<span className="text-pink-700 font-bold">
															Order #
														</span>
													),
													dataIndex: "orderId",
													key: "orderId",
													render: (v) => (
														<span className="font-semibold text-black">
															{v}
														</span>
													),
												},
												{
													title: (
														<span className="text-pink-700 font-bold">
															Customer
														</span>
													),
													dataIndex: "customerName",
													key: "customerName",
													render: (v: any, record: any) => (
														<span className="flex items-center gap-3">
															<span className="inline-block w-10 h-10 relative">
																<UserAvatar
																	photoURL={record.customerPhotoURL}
																	displayName={record.customerName}
																	email={record.customerEmail}
																	size={40}
																/>
															</span>
															<div>
																<div className="font-semibold text-gray-800">
																	{record.customerName || "Unknown"}
																</div>
																<div className="text-xs text-gray-500">
																	{record.customerEmail || "-"}
																</div>
															</div>
														</span>
													),
												},
												{
													title: (
														<span className="text-pink-700 font-bold">
															Total
														</span>
													),
													dataIndex: "total",
													key: "total",
													render: (v) => (
														<span className="font-bold text-pink-800">
															{formatKES(v)}
														</span>
													),
												},
												{
													title: (
														<span className="text-pink-700 font-bold">
															Status
														</span>
													),
													dataIndex: "status",
													key: "status",
													render: (v) => (
														<span
															className={`px-2 py-1 rounded-full text-xs font-bold ${
																v === "completed"
																	? "bg-green-100 text-green-700"
																	: v === "pending"
																	? "bg-yellow-100 text-yellow-700"
																	: v === "approved"
																	? "bg-blue-100 text-blue-700"
																	: v === "paid"
																	? "bg-pink-100 text-pink-700"
																	: v === "cancelled"
																	? "bg-red-100 text-red-700"
																	: "bg-gray-100 text-gray-700"
															}`}
														>
															{v}
														</span>
													),
												},
												{
													title: (
														<span className="text-pink-700 font-bold">
															Date
														</span>
													),
													dataIndex: "createdAt",
													key: "createdAt",
													render: (v) => {
														if (!v)
															return <span className="text-gray-600">-</span>;
														const date = new Date(v);
														const day = date.getDate();
														const month = date.toLocaleString("en-US", {
															month: "long",
														});
														const year = date.getFullYear();
														// Get ordinal suffix
														const j = day % 10,
															k = day % 100;
														let suffix = "th";
														if (j === 1 && k !== 11) suffix = "st";
														else if (j === 2 && k !== 12) suffix = "nd";
														else if (j === 3 && k !== 13) suffix = "rd";
														return (
															<span className="text-gray-600">
																{day}
																{suffix} {month}, {year}
															</span>
														);
													},
												},
												{
													title: (
														<span className="text-pink-700 font-bold">
															Payment Status
														</span>
													),
													dataIndex: "paymentStatus",
													key: "paymentStatus",
													render: () => (
														<span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
															completed
														</span>
													),
												},
											]}
											dataSource={(
												comprehensiveStats.recentActivity as any
											)?.recentOrders?.map((order: any) => {
												// Find the user for this order
												const user = (
													comprehensiveStats.recentActivity as any
												)?.users?.find(
													(u: any) =>
														u.uid === order.userId ||
														u.id === order.userId ||
														u.email === order.customerEmail
												);
												const payment = (
													comprehensiveStats.recentActivity as any
												)?.recentPayments?.find(
													(p: any) =>
														p.orderId === order.orderId ||
														p.paymentId === order.orderId ||
														(order.paymentId && p.paymentId === order.paymentId)
												);
												return {
													key: order.id,
													orderId: order.orderId,
													customerName:
														user?.displayName ||
														order.customerName ||
														"Unknown",
													customerEmail:
														user?.email || order.customerEmail || "-",
													customerPhotoURL:
														user?.photoURL ||
														order.customerPhotoURL ||
														undefined,
													total: order.total,
													status: order.status,
													createdAt: order.createdAt,
													paymentStatus: payment ? payment.status : "",
												};
											})}
											pagination={false}
											className="custom-table min-w-[800px]"
											scroll={{ x: true }}
										/>
									</div>
								</div>
							</div>
							{/* Recent Payments and New Users - side by side */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
								{/* Recent Payments */}
								<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
									<h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
										<div className="p-2 bg-green-100 rounded-lg">
											<FaCreditCard className="text-green-600" />
										</div>
										Recent Payments
									</h2>
									<div className="w-full overflow-x-auto">
										<Table
											columns={[
												{
													title: (
														<span className="text-pink-700 font-bold">
															Payment ID
														</span>
													),
													dataIndex: "paymentId",
													key: "paymentId",
													render: (v: any, record: any) => (
														<div>
															<span className="font-semibold text-black block">
																#{v}
															</span>
															<span className="text-xs text-gray-400 block mt-0.5">
																{formatPrettyDate(record.createdAt)}
															</span>
														</div>
													),
												},
												{
													title: (
														<span className="text-pink-700 font-bold">
															Amount
														</span>
													),
													dataIndex: "amount",
													key: "amount",
													align: "right",
													render: (v) => (
														<span className="font-bold text-pink-800">
															{formatKES(v)}
														</span>
													),
												},
												{
													title: (
														<span className="text-pink-700 font-bold">
															Status
														</span>
													),
													dataIndex: "status",
													key: "status",
													render: (v) => {
														let colorClass = "bg-gray-100 text-gray-700";
														if (v === "completed" || v === "success")
															colorClass = "bg-green-100 text-green-700";
														else if (v === "pending")
															colorClass = "bg-yellow-100 text-yellow-700";
														else if (
															v === "failed" ||
															v === "cancelled" ||
															v === "canceled"
														)
															colorClass = "bg-red-100 text-red-700";
														return (
															<span
																className={`px-3 py-0.5 rounded-full text-xs font-bold capitalize ${colorClass}`}
															>
																{v.charAt(0).toUpperCase() + v.slice(1)}
															</span>
														);
													},
												},
											]}
											dataSource={
												(comprehensiveStats.recentActivity as any)
													?.recentPayments
											}
											pagination={false}
											rowKey="id"
											className="custom-table min-w-[500px]"
											scroll={{ x: true }}
										/>
									</div>
								</div>
								{/* New Users */}
								<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
									<h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
										<div className="p-2 bg-purple-100 rounded-lg">
											<FaUserPlus className="text-purple-600" />
										</div>
										New Users
									</h2>
									<div className="w-full overflow-x-auto">
										<Table
											columns={[
												{
													title: (
														<span className="text-pink-700 font-bold">
															User
														</span>
													),
													dataIndex: "displayName",
													key: "displayName",
													render: (v: any, record: any) => (
														<span className="flex items-center gap-3">
															<span className="inline-block w-10 h-10 relative">
																<UserAvatar
																	photoURL={record.photoURL}
																	displayName={
																		record.displayName || record.name
																	}
																	email={record.email}
																	size={40}
																/>
															</span>
															<div>
																<div className="font-semibold text-gray-800">
																	{record.displayName ||
																		record.name ||
																		"Unknown"}
																</div>
																<div className="text-xs text-gray-500">
																	{record.email || "-"}
																</div>
															</div>
														</span>
													),
												},
												{
													title: (
														<span className="text-pink-700 font-bold">
															Role
														</span>
													),
													dataIndex: "roleId",
													key: "roleId",
													render: (roleId: any) => (
														<span
															className={`px-3 py-0.5 rounded-full text-xs font-bold capitalize ${
																roleId === "admin"
																	? "bg-yellow-100 text-yellow-800"
																	: "bg-pink-100 text-pink-700"
															}`}
														>
															{roleId}
														</span>
													),
												},
												{
													title: (
														<span className="text-pink-700 font-bold">
															Date
														</span>
													),
													dataIndex: "createdAt",
													key: "createdAt",
													render: (v: any) => (
														<span className="text-xs text-gray-400">
															{formatPrettyDate(v)}
														</span>
													),
												},
											]}
											dataSource={
												(comprehensiveStats.recentActivity as any)?.newUsers
											}
											pagination={false}
											rowKey="id"
											className="custom-table min-w-[500px]"
											scroll={{ x: true }}
										/>
									</div>
								</div>
							</div>
						</>
					)}
				</div>
			</main>
		);
	}
}
