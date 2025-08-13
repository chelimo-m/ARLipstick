"use client";
import {
	Table,
	Empty,
	Space,
	message,
	Modal,
	Card,
	Descriptions,
	Badge,
} from "antd";
import "antd/dist/reset.css";
import { useEffect, useState } from "react";
import type { Order, User, Product } from "../../../types/models";
import { getAuth } from "firebase/auth";
import Image from "next/image";
import UserAvatar from "../../../components/UserAvatar";
import { FaEye } from "react-icons/fa";

function formatDate(dateString: string) {
	const date = new Date(dateString);
	const day = date.getDate();
	const month = date.toLocaleString("default", { month: "long" });
	const year = date.getFullYear();
	const j = day % 10,
		k = day % 100;
	let suffix = "th";
	if (j === 1 && k !== 11) suffix = "st";
	else if (j === 2 && k !== 12) suffix = "nd";
	else if (j === 3 && k !== 13) suffix = "rd";
	return `${day}${suffix} ${month}, ${year}`;
}

const getProductColumns = () => [
	{
		title: "Image",
		dataIndex: "imageUrl",
		key: "imageUrl",
		width: 100,
		render: (url: string, record: { name?: string }) =>
			url ? (
				<Image
					src={url}
					alt={record.name as string}
					width={48}
					height={48}
					className="rounded-lg border border-gray-200 object-cover"
				/>
			) : (
				<div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
					<svg
						className="w-6 h-6 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
						/>
					</svg>
				</div>
			),
	},
	{
		title: "Product Name",
		dataIndex: "name",
		key: "name",
		width: 250,
		render: (name: string) => (
			<div className="font-medium text-gray-900">{name}</div>
		),
	},
	{
		title: "Quantity",
		dataIndex: "quantity",
		key: "quantity",
		width: 80,
		render: (quantity: number) => (
			<div className="text-center">
				<span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
					{quantity}
				</span>
			</div>
		),
	},
	{
		title: "Price",
		dataIndex: "priceAtPurchase",
		key: "priceAtPurchase",
		width: 120,
		render: (v: number) => (
			<div className="font-semibold text-gray-900">
				Ksh {v.toLocaleString()}
			</div>
		),
	},
];

export default function AdminOrdersPage() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [approvingOrderId, setApprovingOrderId] = useState<string | null>(null);
	const [viewModalOpen, setViewModalOpen] = useState(false);
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

	useEffect(() => {
		async function fetchAll() {
			try {
				const auth = getAuth();
				const user = auth.currentUser;
				if (!user) {
					setError("Please login to view orders.");
					return;
				}

				const idToken = await user.getIdToken();
				const [ordersRes, usersRes, productsRes] = await Promise.all([
					fetch("/api/orders", {
						headers: { Authorization: `Bearer ${idToken}` },
					}),
					fetch("/api/users", {
						headers: { Authorization: `Bearer ${idToken}` },
					}),
					fetch("/api/products"),
				]);

				if (!ordersRes.ok) {
					throw new Error("Failed to fetch orders");
				}
				if (!usersRes.ok) {
					throw new Error("Failed to fetch users");
				}

				const [ordersData, usersData, productsData] = await Promise.all([
					ordersRes.json(),
					usersRes.json(),
					productsRes.ok ? productsRes.json() : [],
				]);

				// Sort orders by createdAt descending
				ordersData.sort(
					(a: Order, b: Order) =>
						new Date(b.createdAt || new Date()).getTime() -
						new Date(a.createdAt || new Date()).getTime()
				);

				setOrders(ordersData);
				setUsers(usersData);
				setProducts(productsData);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Error fetching data");
			} finally {
				setLoading(false);
			}
		}
		fetchAll();
	}, []);

	function getOrderItemsWithProductInfo(order: Order) {
		return (order.items || []).map((item) => {
			const prod = products.find((p) => p.productId === item.productId);
			return {
				...item,
				name: prod?.name || "Unknown Product",
				imageUrl: prod?.imageUrl || "/file.svg",
			};
		});
	}

	function renderOrderDetails(order: Order) {
		const user = users.find((u) => u.userId === order.userId);

		return (
			<div>
				<h2 className="text-2xl font-bold text-pink-600 mb-4">Order Details</h2>
				<Descriptions
					column={1}
					labelStyle={{ fontWeight: 600, color: "#be185d" }}
					bordered
				>
					<Descriptions.Item label="Order ID">
						<span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
							{order.orderId}
						</span>
					</Descriptions.Item>
					<Descriptions.Item label="Customer">
						{user ? (
							<div className="flex items-center gap-3">
								<UserAvatar
									photoURL={user.photoURL}
									displayName={user.displayName}
									email={user.email}
									size={40}
								/>
								<div>
									<div className="font-semibold text-black">
										{user.displayName || "(No Name)"}
									</div>
									<div className="text-sm text-gray-500">
										{user.email || "-"}
									</div>
								</div>
							</div>
						) : (
							"-"
						)}
					</Descriptions.Item>
					<Descriptions.Item label="Date">
						{formatDate(order.createdAt || new Date().toISOString())}
					</Descriptions.Item>
					<Descriptions.Item label="Status">
						{order.status === "cancelled" || order.status === "canceled" ? (
							<Badge status="error" text="Cancelled" />
						) : order.status === "approved" ? (
							<Badge status="processing" text="Approved" />
						) : order.status === "delivered" ? (
							<Badge status="success" text="Delivered" />
						) : order.status === "pending" ? (
							<Badge status="default" text="Pending" />
						) : (
							<Badge status="default" text={order.status || "Unknown"} />
						)}
					</Descriptions.Item>
					<Descriptions.Item label="Subtotal">
						Ksh {order.subtotal?.toLocaleString() || "0"}
					</Descriptions.Item>
					<Descriptions.Item label="VAT (16%)">
						Ksh {order.vat?.toLocaleString() || "0"}
					</Descriptions.Item>
					<Descriptions.Item label="Delivery Fee">
						Ksh {order.deliveryFee?.toLocaleString() || "0"}
					</Descriptions.Item>
					<Descriptions.Item label="Total Amount">
						<span className="font-bold text-lg text-pink-600">
							Ksh {order.total?.toLocaleString() || "0"}
						</span>
					</Descriptions.Item>
					<Descriptions.Item label="Delivery Location">
						{order.deliveryLocation || "-"}
					</Descriptions.Item>
					<Descriptions.Item label="Phone Number">
						{order.phoneNumber || "-"}
					</Descriptions.Item>
					<Descriptions.Item label="Paystack Reference">
						<span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
							{order.paystackRef || "-"}
						</span>
					</Descriptions.Item>
				</Descriptions>

				<div className="mt-6">
					<h3 className="text-lg font-semibold text-pink-600 mb-4">
						Order Items
					</h3>
					<Table
						columns={getProductColumns()}
						dataSource={getOrderItemsWithProductInfo(order)}
						pagination={false}
						rowKey="productId"
						size="small"
						className="rounded-lg overflow-hidden"
					/>
				</div>
			</div>
		);
	}

	async function handleApprove(orderId: string) {
		try {
			setApprovingOrderId(orderId);
			const auth = getAuth();
			const user = auth.currentUser;
			if (!user) {
				setError("Please login to approve orders.");
				return;
			}

			const idToken = await user.getIdToken();
			const res = await fetch(`/api/orders/${orderId}`, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${idToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ status: "approved" }),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.message || "Failed to approve order");
			}

			// Update the order status in the local state
			setOrders((prevOrders) =>
				prevOrders.map((order) =>
					order.orderId === orderId ? { ...order, status: "approved" } : order
				)
			);

			message.success("Order approved successfully!");
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Error approving order";
			setError(errorMessage);
			message.error(errorMessage);
		} finally {
			setApprovingOrderId(null);
		}
	}

	const columns = [
		{
			title: "Order #",
			dataIndex: "orderId",
			key: "orderId",
			width: 200,
			render: (orderId: string) => (
				<div className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-lg text-gray-800">
					{orderId}
				</div>
			),
		},
		{
			title: "User",
			dataIndex: "userId",
			key: "userId",
			width: 250,
			render: (userId: string) => {
				const user = users.find((u) => u.userId === userId);
				if (!user) return <span className="text-gray-400">Unknown</span>;
				return (
					<Space>
						<span className="inline-block w-12 h-12 relative">
							<UserAvatar
								photoURL={user.photoURL}
								displayName={user.displayName}
								email={user.email}
								size={48}
							/>
						</span>
						<div>
							<div className="font-semibold text-gray-900">
								{user.displayName || user.email}
							</div>
							<div className="text-xs text-gray-500">{user.email}</div>
						</div>
					</Space>
				);
			},
		},
		{
			title: "Date",
			dataIndex: "createdAt",
			key: "createdAt",
			width: 180,
			render: (value: string) => (
				<div className="text-gray-600">{formatDate(value)}</div>
			),
		},
		{
			title: "Status",
			dataIndex: "status",
			key: "status",
			width: 120,
			render: (status: string) => {
				let bg = "bg-gray-100 text-gray-800 border border-gray-200";
				let text = "Pending";
				if (status === "approved") {
					bg = "bg-blue-100 text-blue-800 border border-blue-200";
					text = "Approved";
				} else if (status === "pending") {
					bg = "bg-orange-100 text-orange-800 border border-orange-200";
					text = "Pending";
				} else if (status === "delivered") {
					bg = "bg-purple-100 text-purple-800 border border-purple-200";
					text = "Delivered";
				} else if (status === "cancelled" || status === "canceled") {
					bg = "bg-red-100 text-red-800 border border-red-200";
					text = "Cancelled";
				}
				return (
					<span className={`px-3 py-1 rounded-full text-sm font-medium ${bg}`}>
						{text}
					</span>
				);
			},
		},
		{
			title: "Total",
			dataIndex: "total",
			key: "total",
			width: 150,
			render: (value: number) => (
				<div className="font-semibold text-gray-900">
					Ksh {value.toLocaleString()}
				</div>
			),
		},
		{
			title: "Actions",
			key: "actions",
			width: 160,
			render: (_: unknown, record: Order) => {
				return (
					<div className="flex gap-2">
						<button
							onClick={() => {
								setSelectedOrder(record);
								setViewModalOpen(true);
							}}
							className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
							title="View Details"
						>
							<FaEye className="w-4 h-4" />
						</button>
						{/* Show approve button for pending orders */}
						{record.status === "pending" && (
							<button
								className={`px-3 py-2 rounded-lg font-medium text-white transition-colors text-sm ${
									approvingOrderId === record.orderId
										? "bg-gray-400 cursor-not-allowed"
										: "bg-green-500 hover:bg-green-600"
								}`}
								onClick={() => handleApprove(record.orderId)}
								disabled={approvingOrderId === record.orderId}
							>
								{approvingOrderId === record.orderId
									? "Approving..."
									: "Approve"}
							</button>
						)}
					</div>
				);
			},
		},
	];

	return (
		<div className="min-h-screen w-full bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
			<div className="w-full max-w-7xl mx-auto pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8">
				{/* Header Section */}
				<div className="mb-8">
					<h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
						Manage Orders
					</h1>
					<p className="text-gray-600 text-lg">
						View and manage all customer orders
					</p>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Total Orders
								</p>
								<p className="text-2xl font-bold text-gray-900">
									{orders.length}
								</p>
							</div>
							<div className="p-3 bg-blue-100 rounded-lg">
								<svg
									className="w-6 h-6 text-blue-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Pending</p>
								<p className="text-2xl font-bold text-orange-600">
									{orders.filter((o) => o.status === "pending").length}
								</p>
							</div>
							<div className="p-3 bg-orange-100 rounded-lg">
								<svg
									className="w-6 h-6 text-orange-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Approved</p>
								<p className="text-2xl font-bold text-green-600">
									{orders.filter((o) => o.status === "approved").length}
								</p>
							</div>
							<div className="p-3 bg-green-100 rounded-lg">
								<svg
									className="w-6 h-6 text-green-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Delivered</p>
								<p className="text-2xl font-bold text-purple-600">
									{orders.filter((o) => o.status === "delivered").length}
								</p>
							</div>
							<div className="p-3 bg-purple-100 rounded-lg">
								<svg
									className="w-6 h-6 text-purple-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
									/>
								</svg>
							</div>
						</div>
					</div>
				</div>

				{/* Orders Table */}
				<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
					{loading ? (
						<div className="flex justify-center items-center py-16">
							<div className="flex items-center space-x-3">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
								<span className="text-gray-600 text-lg">Loading orders...</span>
							</div>
						</div>
					) : error ? (
						<div className="text-center py-16">
							<div className="text-red-500 text-lg mb-2">
								Error loading orders
							</div>
							<div className="text-gray-500">{error}</div>
						</div>
					) : (
						<div className="w-full overflow-x-auto">
							<Table
								columns={columns}
								dataSource={orders}
								pagination={false}
								rowKey="orderId"
								locale={{
									emptyText: (
										<div className="py-16 text-center">
											<Empty
												image={Empty.PRESENTED_IMAGE_SIMPLE}
												description={
													<span className="text-gray-500 text-lg">
														No orders found
													</span>
												}
											/>
										</div>
									),
								}}
								scroll={{ x: 1200 }}
								rowClassName="hover:bg-gray-50 transition-colors"
							/>
						</div>
					)}
				</div>

				{/* Order Details Modal */}
				<Modal
					title="Order Details"
					open={viewModalOpen}
					onCancel={() => {
						setViewModalOpen(false);
						setSelectedOrder(null);
					}}
					footer={null}
					width={800}
					centered
				>
					{selectedOrder && renderOrderDetails(selectedOrder)}
				</Modal>
			</div>
		</div>
	);
}
