"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, Descriptions, Spin, Result } from "antd";
import { getAuth } from "firebase/auth";
import React from "react";

function formatLabel(key: string) {
	// Convert camelCase or snake_case to Title Case
	return key
		.replace(/([A-Z])/g, " $1")
		.replace(/_/g, " ")
		.replace(/^./, (str) => str.toUpperCase())
		.trim();
}

function formatValue(key: string, value: unknown): string | React.ReactNode {
	if (value === null || value === undefined || value === "") return "-";
	if (typeof value === "number" && key.toLowerCase().includes("amount"))
		return `Ksh ${value.toLocaleString()}`;
	if (typeof value === "number") return value.toLocaleString();
	if (typeof value === "string" && key.toLowerCase().includes("date")) {
		const d = new Date(value);
		if (!isNaN(d.getTime())) return d.toLocaleString();
	}
	if (typeof value === "object")
		return <pre>{JSON.stringify(value, null, 2)}</pre>;
	return String(value);
}

export default function PaymentDetailsPage() {
	const params = useParams();
	const paymentId =
		params && typeof params === "object" && "paymentId" in params
			? params.paymentId
			: undefined;
	const [loading, setLoading] = useState(true);
	const [payment, setPayment] = useState<unknown>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		async function fetchPayment() {
			setLoading(true);
			try {
				const auth = getAuth();
				const user = auth.currentUser;
				if (!user) {
					setError("Please login to view payment details.");
					setLoading(false);
					return;
				}
				const idToken = await user.getIdToken();
				const res = await fetch(`/api/payments?paymentId=${paymentId}`, {
					headers: { Authorization: `Bearer ${idToken}` },
				});
				if (!res.ok) {
					setError("Payment not found.");
					setLoading(false);
					return;
				}
				const data = await res.json();
				if (!data || (Array.isArray(data) && data.length === 0)) {
					setError("Payment not found.");
					setLoading(false);
					return;
				}
				setPayment(Array.isArray(data) ? data[0] : data);
			} catch {
				setError("Error loading payment details.");
			} finally {
				setLoading(false);
			}
		}
		if (paymentId) fetchPayment();
	}, [paymentId]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Spin size="large" />
			</div>
		);
	}
	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Result status="404" title="Not Found" subTitle={error} />
			</div>
		);
	}
	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 p-8">
			<Card className="max-w-xl w-full shadow-2xl border-pink-200 border-2 rounded-2xl">
				<h1 className="text-3xl font-extrabold text-pink-700 mb-6 text-center">
					Payment Details
				</h1>
				<Descriptions
					column={1}
					bordered
					labelStyle={{ fontWeight: 600, color: "#be185d" }}
				>
					{Object.entries(payment as Record<string, unknown>).map(
						([key, value]) => (
							<Descriptions.Item key={key} label={formatLabel(key)}>
								{formatValue(key, value)}
							</Descriptions.Item>
						)
					)}
				</Descriptions>
			</Card>
		</div>
	);
}
