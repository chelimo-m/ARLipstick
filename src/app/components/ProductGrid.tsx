"use client";
import Image from "next/image";
import { useState } from "react";
import { addToCart } from "../utils/cart";

export type Product = {
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

type ProductGridProps = {
	products: Product[];
};

export default function ProductGrid({ products }: ProductGridProps) {
	const [cartMessages, setCartMessages] = useState<{ [id: string]: string }>(
		{}
	);

	async function handleAddToCart(productId: string) {
		try {
			await addToCart(productId);
			setCartMessages((prev) => ({ ...prev, [productId]: "Added to cart!" }));
			setTimeout(
				() => setCartMessages((prev) => ({ ...prev, [productId]: "" })),
				1500
			);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Error adding to cart";
			setCartMessages((prev) => ({ ...prev, [productId]: msg }));
			setTimeout(
				() => setCartMessages((prev) => ({ ...prev, [productId]: "" })),
				2000
			);
		}
	}

	return (
		<div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full px-1 sm:px-0">
			{products.map((product) => {
				const isDiscount =
					product.oldPrice != null && product.oldPrice > product.price;
				const discountPercent =
					isDiscount && product.oldPrice != null
						? Math.round(
								((product.oldPrice - product.price) / product.oldPrice) * 100
						  )
						: 0;
				const soldOut = product.stock === 0;
				return (
					<div
						key={product.productId}
						className={`relative bg-white/80 rounded-3xl shadow-2xl p-3 xs:p-4 sm:p-6 md:p-8 flex flex-col items-center border border-pink-100 hover:shadow-pink-300 hover:scale-[1.03] transition-all duration-200 group overflow-hidden min-h-[380px] xs:min-h-[400px] sm:min-h-[420px] max-w-full xs:max-w-xs mx-auto w-full backdrop-blur-md ${
							soldOut ? "opacity-70" : ""
						}`}
						style={{ minHeight: 380 }}
					>
						{/* Discount badge */}
						{isDiscount && (
							<span className="absolute top-2 left-2 xs:top-4 xs:left-4 bg-pink-500 text-white text-xs font-bold px-2 xs:px-3 py-0.5 xs:py-1 rounded-full shadow-lg z-10">
								-{discountPercent}%
							</span>
						)}
						{/* Sold Out overlay */}
						{soldOut && (
							<div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
								<span className="text-xl xs:text-2xl font-extrabold text-pink-500 drop-shadow-lg">
									Sold Out
								</span>
							</div>
						)}
						<div
							className={`w-24 h-24 xs:w-28 xs:h-28 sm:w-32 sm:h-32 mb-4 xs:mb-6 rounded-full border-4 ${
								isDiscount ? "border-pink-400" : "border-pink-200"
							} overflow-hidden shadow-lg bg-white flex items-center justify-center`}
						>
							<Image
								src={product.imageUrl}
								alt={product.name}
								width={128}
								height={128}
								className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-200"
							/>
						</div>
						<h2 className="text-base xs:text-lg sm:text-xl font-bold text-gray-800 mb-1 text-center group-hover:text-pink-600 transition-colors">
							{product.name}
						</h2>
						{product.description && (
							<p className="text-gray-500 text-xs xs:text-sm mb-2 text-center line-clamp-2">
								{product.description}
							</p>
						)}
						<div className="flex flex-col items-center gap-1 mb-3 xs:mb-4">
							{isDiscount ? (
								<div className="flex flex-col items-center">
									<span className="text-gray-400 text-xs xs:text-base line-through">
										Ksh {(product.oldPrice ?? 0).toLocaleString()}
									</span>
									<span className="text-pink-600 text-lg xs:text-xl sm:text-2xl font-extrabold tracking-tight">
										Ksh {product.price.toLocaleString()}
									</span>
								</div>
							) : (
								<span className="text-pink-600 text-lg xs:text-xl sm:text-2xl font-extrabold tracking-tight">
									Ksh {product.price.toLocaleString()}
								</span>
							)}
						</div>
						<div className="flex flex-col gap-2 xs:gap-3 w-full mt-auto">
							<a
								href={`/virtual-tryon?id=${product.productId}`}
								className="px-4 xs:px-6 py-2 xs:py-3 bg-gradient-to-r from-pink-500 to-pink-400 text-white rounded-full shadow hover:from-pink-600 hover:to-pink-500 transition font-semibold text-base xs:text-lg w-full text-center flex items-center justify-center gap-2"
							>
								<span>Try in AR</span>
							</a>
							{cartMessages[product.productId] && (
								<div
									className={`font-semibold mb-2 text-center ${
										cartMessages[product.productId] === "Added to cart!"
											? "text-green-600"
											: "text-red-600"
									}`}
								>
									{cartMessages[product.productId]}
								</div>
							)}
							<button
								className={`px-4 xs:px-6 py-2 xs:py-3 rounded-full shadow font-semibold text-base xs:text-lg w-full transition-all duration-150 flex items-center justify-center gap-2 ${
									soldOut
										? "bg-gray-300 text-gray-400 cursor-not-allowed"
										: "bg-gradient-to-r from-pink-400 to-pink-500 text-white hover:from-pink-500 hover:to-pink-600"
								}`}
								type="button"
								disabled={soldOut}
								onClick={() => handleAddToCart(product.productId)}
							>
								<span>Add to Cart</span>
							</button>
						</div>
					</div>
				);
			})}
		</div>
	);
}
