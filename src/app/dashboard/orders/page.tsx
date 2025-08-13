"use client";
import { Table, Modal, Card, Descriptions, Badge, message } from "antd";
import "antd/dist/reset.css";
import {
	FaBoxOpen,
	FaCheckCircle,
	FaClock,
	FaFileAlt,
	FaBox,
	FaEye,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import Image from "next/image";
import type { Order, Product } from "@/app/types/models";

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
					<FaBox className="w-6 h-6 text-gray-400" />
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

function getOrderItemsWithProductInfo(order: Order, products: Product[]) {
	return (order.items || []).map((item) => {
		const prod = products.find((p) => p.productId === item.productId);
		return {
			...item,
			productName: prod?.name || "Unknown Product",
			productImage: prod?.imageUrl || "/file.svg",
		};
	});
}

export default function OrdersPage() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [error, setError] = useState("");
	const [products, setProducts] = useState<Product[]>([]);
	const [viewModalOpen, setViewModalOpen] = useState(false);
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
	const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
		null
	);

	useEffect(() => {
		async function fetchOrders() {
			try {
				const auth = getAuth();
				const user = auth.currentUser;
				if (!user) {
					setError("Please login to view your orders.");
					return;
				}
				const idToken = await user.getIdToken();
				const res = await fetch("/api/orders?userOnly=1", {
					headers: { Authorization: `Bearer ${idToken}` },
				});
				if (!res.ok) {
					const data = await res.json();
					throw new Error(
						data.error || data.message || "Failed to fetch orders"
					);
				}
				const orders = await res.json();
				// Sort by createdAt descending
				orders.sort(
					(a: Order, b: Order) =>
						new Date(b.createdAt || new Date()).getTime() -
						new Date(a.createdAt || new Date()).getTime()
				);
				setOrders(orders);
				// Fetch products for item info
				const prodRes = await fetch("/api/products");
				if (prodRes.ok) {
					setProducts(await prodRes.json());
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "Error fetching orders");
			}
		}
		fetchOrders();
	}, []);

	async function handleCancelOrder(orderId: string) {
		try {
			setCancellingOrderId(orderId);
			const auth = getAuth();
			const user = auth.currentUser;
			if (!user) {
				setError("Please login to cancel orders.");
				return;
			}

			const idToken = await user.getIdToken();
			const res = await fetch(`/api/orders/${orderId}`, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${idToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ status: "cancelled" }),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.message || "Failed to cancel order");
			}

			// Update the order status in the local state
			setOrders((prevOrders) =>
				prevOrders.map((order) =>
					order.orderId === orderId ? { ...order, status: "cancelled" } : order
				)
			);

			// Show success message
			message.success(
				"Order cancelled successfully! Refund will be processed if payment was made."
			);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Error cancelling order";
			setError(errorMessage);
			message.error(errorMessage);
		} finally {
			setCancellingOrderId(null);
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
				if (status === "paid") {
					bg = "bg-green-100 text-green-800 border border-green-200";
					text = "Paid";
				} else if (status === "approved") {
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
						{/* Show cancel button for pending and approved orders */}
						{(record.status === "pending" || record.status === "approved") && (
							<button
								className={`px-3 py-2 rounded-lg font-medium text-white transition-colors text-sm ${
									cancellingOrderId === record.orderId
										? "bg-gray-400 cursor-not-allowed"
										: "bg-red-500 hover:bg-red-600"
								}`}
								onClick={(e) => {
									e.stopPropagation();
									handleCancelOrder(record.orderId);
								}}
								disabled={cancellingOrderId === record.orderId}
							>
								{cancellingOrderId === record.orderId
									? "Cancelling..."
									: "Cancel"}
							</button>
						)}
					</div>
				);
			},
		},
	];

	function renderOrderDetails(order: Order) {
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
						dataSource={getOrderItemsWithProductInfo(order, products)}
						pagination={false}
						rowKey="productId"
						size="small"
						className="rounded-lg overflow-hidden"
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen w-full bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
			<div className="w-full max-w-7xl mx-auto pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8">
				{/* Header Section */}
				<div className="mb-8">
					<h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
						Your Order History
					</h1>
					<p className="text-gray-600 text-lg">
						Track your orders and view order details
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
								<FaBoxOpen className="text-blue-600 text-xl" />
							</div>
						</div>
					</div>

					<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Completed</p>
								<p className="text-2xl font-bold text-green-600">
									{
										orders.filter(
											(o) => o.status === "delivered" || o.status === "paid"
										).length
									}
								</p>
							</div>
							<div className="p-3 bg-green-100 rounded-lg">
								<FaCheckCircle className="w-6 h-6 text-green-600" />
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
								<FaClock className="w-6 h-6 text-orange-600" />
							</div>
						</div>
					</div>

					<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Cancelled</p>
								<p className="text-2xl font-bold text-red-600">
									{
										orders.filter(
											(o) => o.status === "cancelled" || o.status === "canceled"
										).length
									}
								</p>
							</div>
							<div className="p-3 bg-red-100 rounded-lg">
								<svg
									className="w-6 h-6 text-red-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</div>
						</div>
					</div>
				</div>

				{/* Orders Table */}
				<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
					{error ? (
						<div className="text-center py-8 text-lg text-red-500 font-semibold">
							{error}
						</div>
					) : (
						<div className="w-full overflow-x-auto">
							<Table
								columns={columns}
								dataSource={orders}
								pagination={false}
								rowKey="orderId"
								scroll={{ x: 800 }}
								rowClassName="hover:bg-gray-50 transition-colors"
							/>
						</div>
					)}
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
		</div>
	);
}
