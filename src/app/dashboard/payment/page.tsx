"use client";
import { Table, Empty, Modal, Descriptions, Badge } from "antd";
import "antd/dist/reset.css";
import { FaCreditCard, FaEye } from "react-icons/fa";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

interface PaymentItem {
	paymentId: string;
	createdAt: string;
	amount: number;
	status: string;
	transactionRef?: string;
	subtotal?: number;
	vat?: number;
	deliveryFee?: number;
	phoneNumber?: string;
	deliveryLocation?: string;
	paystackRef?: string;
	orderStatus?: string;
}

export default function PaymentPage() {
	const [data, setData] = useState<PaymentItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [viewModalOpen, setViewModalOpen] = useState(false);
	const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(
		null
	);

	useEffect(() => {
		async function fetchPayments() {
			try {
				const auth = getAuth();
				const user = auth.currentUser;
				if (!user) {
					setError("Please login to view your payments.");
					setLoading(false);
					return;
				}
				const idToken = await user.getIdToken();
				const res = await fetch("/api/payments", {
					headers: { Authorization: `Bearer ${idToken}` },
				});
				if (!res.ok) {
					const data = await res.json();
					throw new Error(
						data.error || data.message || "Failed to fetch payments"
					);
				}
				const payments: PaymentItem[] = await res.json();
				// Sort by createdAt descending
				payments.sort(
					(a: PaymentItem, b: PaymentItem) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
				setData(payments);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Error fetching payments"
				);
			} finally {
				setLoading(false);
			}
		}
		fetchPayments();
	}, []);

	const columns = [
		{
			title: "Payment #",
			dataIndex: "paymentId",
			key: "paymentId",
		},
		{
			title: "Date",
			dataIndex: "createdAt",
			key: "createdAt",
			render: (value: string) => {
				if (!value) return "-";
				const date = new Date(value);
				const day = date.getDate();
				const month = date.toLocaleString("default", { month: "long" });
				const year = date.getFullYear();
				// Get ordinal suffix
				const j = day % 10,
					k = day % 100;
				let suffix = "th";
				if (j === 1 && k !== 11) suffix = "st";
				else if (j === 2 && k !== 12) suffix = "nd";
				else if (j === 3 && k !== 13) suffix = "rd";
				return `${day}${suffix} ${month}, ${year}`;
			},
		},

		{
			title: "Total",
			dataIndex: "amount",
			key: "amount",
			render: (value: number) =>
				value !== undefined ? `Ksh ${value.toLocaleString()}` : "-",
		},
		{
			title: "Status",
			dataIndex: "status",
			key: "status",
			render: (status: string, record: any) => {
				// Check if order is cancelled and show refund status
				if (
					record.orderStatus === "cancelled" ||
					record.orderStatus === "canceled"
				) {
					return (
						<span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200">
							Refund Pending
						</span>
					);
				}

				// Show original payment status
				if (status === "completed") {
					return (
						<span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
							Completed
						</span>
					);
				}

				return (
					<span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
						{status || "Pending"}
					</span>
				);
			},
		},
		{
			title: "Transaction Ref",
			dataIndex: "transactionRef",
			key: "transactionRef",
			width: 200,
			render: (value: string) => (
				<div className="font-mono text-xs text-gray-600 truncate" title={value}>
					{value || "-"}
				</div>
			),
		},
		{
			title: "Actions",
			key: "actions",
			width: 80,
			render: (_: unknown, record: PaymentItem) => (
				<button
					onClick={() => {
						setSelectedPayment(record);
						setViewModalOpen(true);
					}}
					className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
					title="View Details"
				>
					<FaEye className="w-4 h-4" />
				</button>
			),
		},
	];

	function formatDate(dateString: string) {
		if (!dateString) return "-";
		const date = new Date(dateString);
		const day = date.getDate();
		const month = date.toLocaleString("default", { month: "long" });
		const year = date.getFullYear();
		// Get ordinal suffix
		const j = day % 10,
			k = day % 100;
		let suffix = "th";
		if (j === 1 && k !== 11) suffix = "st";
		else if (j === 2 && k !== 12) suffix = "nd";
		else if (j === 3 && k !== 13) suffix = "rd";
		return `${day}${suffix} ${month}, ${year}`;
	}

	function renderPaymentDetails(payment: PaymentItem) {
		return (
			<div>
				<h2 className="text-2xl font-bold text-pink-600 mb-4">
					Payment Details
				</h2>
				<Descriptions
					column={1}
					labelStyle={{ fontWeight: 600, color: "#be185d" }}
					bordered
				>
					<Descriptions.Item label="Payment ID">
						<span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
							{payment.paymentId}
						</span>
					</Descriptions.Item>
					<Descriptions.Item label="Date">
						{formatDate(payment.createdAt)}
					</Descriptions.Item>
					<Descriptions.Item label="Status">
						{payment.orderStatus === "cancelled" ||
						payment.orderStatus === "canceled" ? (
							<Badge status="warning" text="Refund Pending" />
						) : payment.status === "completed" ? (
							<Badge status="success" text="Completed" />
						) : (
							<Badge status="default" text={payment.status || "Pending"} />
						)}
					</Descriptions.Item>
					<Descriptions.Item label="Subtotal">
						Ksh {payment.subtotal?.toLocaleString() || "0"}
					</Descriptions.Item>
					<Descriptions.Item label="VAT (16%)">
						Ksh {payment.vat?.toLocaleString() || "0"}
					</Descriptions.Item>
					<Descriptions.Item label="Delivery Fee">
						Ksh {payment.deliveryFee?.toLocaleString() || "0"}
					</Descriptions.Item>
					<Descriptions.Item label="Total Amount">
						<span className="font-bold text-lg text-pink-600">
							Ksh {payment.amount?.toLocaleString() || "0"}
						</span>
					</Descriptions.Item>
					<Descriptions.Item label="Transaction Reference">
						<span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
							{payment.transactionRef || "-"}
						</span>
					</Descriptions.Item>
					<Descriptions.Item label="Phone Number">
						{payment.phoneNumber || "-"}
					</Descriptions.Item>
					<Descriptions.Item label="Delivery Location">
						{payment.deliveryLocation || "-"}
					</Descriptions.Item>
					<Descriptions.Item label="Paystack Reference">
						<span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
							{payment.paystackRef || "-"}
						</span>
					</Descriptions.Item>
				</Descriptions>
			</div>
		);
	}

	return (
		<div className="min-h-screen w-full bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100">
			<div className="w-full container max-w-8xl mx-auto pt-12 px-4">
				<div className="flex flex-col items-center mb-8">
					<span className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-pink-200 via-pink-100 to-rose-100 shadow-lg mb-4">
						<FaCreditCard className="text-pink-400 text-4xl" />
					</span>
					<h2 className="text-3xl font-extrabold text-pink-600 mb-1 tracking-tight">
						Payments
					</h2>
				</div>
				<div className="w-full bg-white/90 rounded-3xl shadow-2xl border border-pink-100 p-6">
					{error ? (
						<div className="text-center py-8 text-lg text-red-500 font-semibold">
							{error}
						</div>
					) : (
						<div className="w-full overflow-x-auto">
							<Table
								columns={columns}
								dataSource={data}
								pagination={false}
								loading={loading}
								locale={{
									emptyText: (
										<Empty
											image={Empty.PRESENTED_IMAGE_SIMPLE}
											description={
												<span className="text-gray-500 text-lg">
													No payments yet. Payments will appear here!
												</span>
											}
										/>
									),
								}}
								rowKey="paymentId"
								className="rounded-xl overflow-hidden min-w-[900px]"
								scroll={{ x: true }}
							/>
						</div>
					)}
				</div>
			</div>

			{/* Payment Details Modal */}
			<Modal
				title="Payment Details"
				open={viewModalOpen}
				onCancel={() => {
					setViewModalOpen(false);
					setSelectedPayment(null);
				}}
				footer={null}
				width={800}
				centered
			>
				{selectedPayment && renderPaymentDetails(selectedPayment)}
			</Modal>
		</div>
	);
}
