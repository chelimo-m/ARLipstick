"use client";
import { Table, Button, Spin, Empty } from "antd";
import "antd/dist/reset.css";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Product = {
	productId: string;
	name: string;
	price: number;
	oldPrice?: number;
	imageUrl: string;
	description?: string;
	stock?: number;
	colorName?: string;
	hexColor?: string;
	finish?: string;
	category?: string;
	createdAt?: string;
	updatedAt?: string;
};

export default function AdminProductsPage() {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		async function fetchProducts() {
			try {
				const res = await fetch("/api/products");
				if (!res.ok) throw new Error("Failed to fetch products");
				const data = await res.json();
				setProducts(data);
			} catch (err: unknown) {
				if (err instanceof Error) {
					setError(err.message || "Unknown error");
				}
			} finally {
				setLoading(false);
			}
		}
		fetchProducts();
	}, []);

	const columns = [
		{
			title: "Image",
			dataIndex: "imageUrl",
			key: "imageUrl",
			render: (url: string, record: Product) => (
				<Image
					src={url}
					alt={record.name}
					width={48}
					height={48}
					className="rounded-full border border-pink-200"
				/>
			),
		},
		{ title: "Product Name", dataIndex: "name", key: "name" },
		{
			title: "Color",
			dataIndex: "hexColor",
			key: "hexColor",
			render: (_: string, record: Product) =>
				record.hexColor ? (
					<span className="flex items-center justify-center">
						<span
							className="inline-block w-6 h-6 rounded-full border border-gray-200"
							style={{ backgroundColor: record.hexColor }}
						/>
					</span>
				) : (
					<span className="text-gray-400">-</span>
				),
		},
		{
			title: "Color Name",
			dataIndex: "colorName",
			key: "colorName",
			render: (colorName: string) =>
				colorName || <span className="text-gray-400">-</span>,
		},
		{
			title: "Stock",
			dataIndex: "stock",
			key: "stock",
			render: (stock: number) =>
				stock !== undefined ? stock : <span className="text-gray-400">-</span>,
		},
		{
			title: "Status",
			dataIndex: "status",
			key: "status",
			render: (_: string, record: Product) =>
				record.stock === 0 ? (
					<span className="text-red-500 font-bold">Sold Out</span>
				) : (
					<span className="text-green-600 font-semibold">On Sale</span>
				),
		},
		{
			title: "Price",
			dataIndex: "price",
			key: "price",
			render: (v: number) => `Ksh ${v}`,
		},
		{
			title: "Old Price",
			dataIndex: "oldPrice",
			key: "oldPrice",
			render: (v?: number) =>
				v ? (
					<span className="line-through text-gray-400">Ksh {v}</span>
				) : (
					<span className="text-gray-400">-</span>
				),
		},
		{
			title: "Actions",
			key: "actions",
			render: (_: unknown, record: Product) => (
				<Link href={`/dashboard/admin/products/${record.productId}/edit`}>
					<Button type="link">Edit</Button>
				</Link>
			),
		},
	];

	return (
		<div className="min-h-screen w-full bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100">
			<div className="w-full max-w-7xl mx-auto pt-6 sm:pt-8 md:pt-12 px-2 sm:px-4 md:px-6">
				<h1 className="text-2xl sm:text-3xl font-extrabold text-pink-700 mb-4 sm:mb-6 md:mb-8">
					Manage Products
				</h1>
				<div className="w-full bg-white/90 rounded-3xl shadow-2xl border border-pink-100 p-3 sm:p-4 md:p-6">
					{loading ? (
						<div className="flex justify-center items-center py-8 sm:py-12">
							<Spin size="large" />
						</div>
					) : error ? (
						<div className="text-red-500 text-center py-6 sm:py-8">{error}</div>
					) : (
						<div className="w-full overflow-x-auto">
							<Table
								columns={columns}
								dataSource={products}
								pagination={false}
								rowKey="productId"
								locale={{
									emptyText: (
										<Empty
											image={Empty.PRESENTED_IMAGE_SIMPLE}
											description={
												<span className="text-gray-500 text-base sm:text-lg">
													No products found.
												</span>
											}
										/>
									),
								}}
								className="rounded-xl overflow-hidden min-w-[800px]"
								scroll={{ x: true }}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
