"use client";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useEffect, useState } from "react";
import type { Product } from "../../types/models";
import ProductGrid from "../../components/ProductGrid";

export default function Shop() {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		async function fetchProducts() {
			try {
				const res = await fetch("/api/products");
				if (!res.ok) throw new Error("Failed to fetch products");
				const data = await res.json();
				// Map 'id' to 'productId' if needed for compatibility
				const normalized = data.map((p: any) => ({
					...p,
					productId: p.productId || p.id,
					imageUrl: p.imageUrl || "",
				}));
				setProducts(normalized);
			} catch (err: unknown) {
				if (err instanceof Error) {
					setError(err.message);
				} else {
					setError("Unknown error");
				}
			} finally {
				setLoading(false);
			}
		}
		fetchProducts();
	}, []);

	return (
		<div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 font-sans">
			<Header />
			<main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 py-8 sm:py-12 md:py-20">
				<h1 className="text-3xl sm:text-5xl font-extrabold text-pink-600 mb-8 sm:mb-12 text-center tracking-tight drop-shadow-xl">
					Shop Lipsticks
				</h1>
				{loading ? (
					<div className="flex justify-center items-center py-24">
						<span className="w-16 h-16 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></span>
					</div>
				) : error ? (
					<div className="text-red-500 text-center py-12 text-xl font-semibold">
						{error}
					</div>
				) : products.length === 0 ? (
					<div className="text-gray-500 text-center py-12 text-2xl">
						No products found.
					</div>
				) : (
					<ProductGrid products={products} />
				)}
			</main>
			<Footer />
		</div>
	);
}
