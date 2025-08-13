"use client";

import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import React, { useRef, useEffect, useState, Suspense } from "react";
import { startLipstickAR } from "../../../ar/arUtils";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { addToCart } from "../../utils/cart";
import { getAuth } from "firebase/auth";
import type { Product } from "../../types/models";

// Helper function to validate hex color
function isValidHexColor(color: string): boolean {
	return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

function ARLipstickTryOn({ color }: { color: string }) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [arError, setArError] = useState<string>("");
	const [isArLoading, setIsArLoading] = useState(true);

	// Ensure canvas size matches video stream resolution
	useEffect(() => {
		const video = videoRef.current;
		const canvas = canvasRef.current;
		if (!video || !canvas) return;

		function syncCanvasSize() {
			if (video && canvas && video.videoWidth && video.videoHeight) {
				canvas.width = video.videoWidth;
				canvas.height = video.videoHeight;
			}
		}

		video.addEventListener("loadedmetadata", syncCanvasSize);
		// In case metadata is already loaded
		syncCanvasSize();

		return () => {
			if (video) video.removeEventListener("loadedmetadata", syncCanvasSize);
		};
	}, []);

	useEffect(() => {
		let stop: (() => void) | undefined;

		async function startAR() {
			if (videoRef.current && canvasRef.current) {
				try {
					setIsArLoading(true);
					setArError("");

					const cleanup = await startLipstickAR(
						videoRef.current,
						canvasRef.current,
						color
					);
					stop = cleanup;
					setIsArLoading(false);
				} catch (error) {
					console.error("AR Error:", error);
					setArError("Failed to start AR. Please check camera permissions.");
					setIsArLoading(false);
				}
			}
		}

		startAR();

		return () => {
			if (stop) stop();
		};
	}, [color]);

	return (
		<div className="relative w-full max-w-3xl flex items-center justify-center bg-gradient-to-br from-pink-100 via-white to-purple-100 rounded-xl sm:rounded-2xl border border-pink-200 shadow-lg overflow-hidden mb-6 sm:mb-8 min-h-[220px] sm:min-h-[320px]">
			<video
				ref={videoRef}
				className="w-full h-full object-contain bg-black absolute inset-0 opacity-0 pointer-events-none"
				autoPlay
				muted
				playsInline
			/>
			<canvas
				ref={canvasRef}
				className="w-full h-full object-contain bg-black rounded-xl sm:rounded-2xl"
			/>

			{/* Loading overlay */}
			{isArLoading && (
				<div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl sm:rounded-2xl">
					<div className="text-white text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
						<p className="text-sm">Starting AR...</p>
					</div>
				</div>
			)}

			{/* Error overlay */}
			{arError && (
				<div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl sm:rounded-2xl">
					<div className="text-white text-center p-4">
						<p className="text-sm mb-2">{arError}</p>
						<button
							onClick={() => window.location.reload()}
							className="px-4 py-2 bg-pink-500 text-white rounded-full text-sm hover:bg-pink-600 transition"
						>
							Retry
						</button>
					</div>
				</div>
			)}

			<div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-white/70 text-pink-600 px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-semibold shadow">
				Live Camera
			</div>
		</div>
	);
}

function VirtualTryOnContent() {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const searchParams = useSearchParams();
	const selectedId = searchParams ? searchParams.get("id") : null;
	const [selectedIdx, setSelectedIdx] = useState<number>(0);
	const [cartMessage, setCartMessage] = useState("");

	async function handleAddToCart() {
		if (!selected) return;

		try {
			// Check if user is authenticated
			const auth = getAuth();
			const user = auth.currentUser;
			if (!user) {
				setCartMessage("Please login to add items to cart");
				setTimeout(() => setCartMessage(""), 2000);
				return;
			}

			// Add to cart using the proper API
			await addToCart(selected.productId);
			setCartMessage("Added to cart!");
			setTimeout(() => setCartMessage(""), 1500);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to add to cart";
			setCartMessage(errorMessage);
			setTimeout(() => setCartMessage(""), 2000);
		}
	}

	useEffect(() => {
		async function fetchProducts() {
			try {
				const res = await fetch("/api/products");
				if (!res.ok) throw new Error("Failed to fetch products");
				const data: Product[] = await res.json();

				// Filter only lipstick products
				const lipstickProducts = data.filter(
					(product) =>
						product.category?.toLowerCase().includes("lipstick") ||
						product.name?.toLowerCase().includes("lipstick")
				);

				console.log("Fetched products:", lipstickProducts.length);
				console.log("Selected ID from URL:", selectedId);

				setProducts(lipstickProducts);

				// Set selected product based on URL parameter
				if (selectedId && lipstickProducts.length > 0) {
					const foundIdx = lipstickProducts.findIndex(
						(p) => p.productId === selectedId
					);
					console.log("Found product at index:", foundIdx);
					if (foundIdx !== -1) {
						setSelectedIdx(foundIdx);
					} else {
						// If the selected product is not found, default to first product
						console.log("Product not found, defaulting to first product");
						setSelectedIdx(0);
					}
				} else if (lipstickProducts.length > 0) {
					// If no specific product selected, default to first product
					console.log("No product selected, defaulting to first product");
					setSelectedIdx(0);
				}
			} catch (err: unknown) {
				console.error("Error fetching products:", err);
				setError(err instanceof Error ? err.message : "Unknown error");
			} finally {
				setLoading(false);
			}
		}
		fetchProducts();
	}, [selectedId]);

	const selected = products[selectedIdx];

	// Debug: Log selected product changes
	useEffect(() => {
		if (selected) {
			console.log(
				"Selected product:",
				selected.name,
				"ID:",
				selected.productId,
				"Color:",
				selected.hexColor
			);
		}
	}, [selected]);

	return (
		<div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 font-sans">
			<Header />
			<main className="flex-1 w-full max-w-3xl mx-auto px-2 sm:px-4 py-6 sm:py-16 flex flex-col items-center justify-center">
				{loading ? (
					<div className="text-gray-600 text-center py-8">
						Loading products...
					</div>
				) : error ? (
					<div className="text-red-500 text-center py-8">{error}</div>
				) : products.length === 0 ? (
					<div className="text-gray-500 text-center py-12 text-lg sm:text-2xl">
						No lipstick products found.
					</div>
				) : (
					<div className="w-full container bg-white/90 rounded-xl sm:rounded-3xl shadow-2xl border border-pink-100 flex flex-col items-center p-4 sm:p-10">
						{selected && (
							<ARLipstickTryOn
								color={
									selected.hexColor && isValidHexColor(selected.hexColor)
										? selected.hexColor
										: "#dc3753"
								}
							/>
						)}

						{/* Product Info */}
						{selected && (
							<div className="text-center mb-4">
								<h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
									{selected.name}
								</h2>
								{selected.colorName && (
									<p className="text-gray-600 mb-2">{selected.colorName}</p>
								)}
								{selected.price && (
									<p className="text-pink-600 font-semibold text-lg">
										kes {selected.price.toLocaleString()}
									</p>
								)}
							</div>
						)}

						{/* Add to Cart button */}
						{selected && (
							<button
								onClick={handleAddToCart}
								className="mt-4 sm:mt-6 mb-2 w-full sm:w-auto px-6 sm:px-8 py-3 bg-pink-500 text-white rounded-full shadow hover:bg-pink-600 transition font-bold text-base sm:text-lg"
							>
								Add to Cart
							</button>
						)}
						{cartMessage && (
							<div
								className={`font-semibold mb-2 text-center text-base sm:text-lg ${
									cartMessage === "Added to cart!"
										? "text-green-600"
										: "text-red-600"
								}`}
							>
								{cartMessage}
							</div>
						)}

						{/* Carousel */}
						<div className="w-full mt-6 sm:mt-10">
							<div className="overflow-x-auto flex gap-4 sm:gap-6 py-3 sm:py-4 px-1 sm:px-2 scrollbar-thin scrollbar-thumb-pink-200">
								{products.map((product, idx) => (
									<button
										key={product.productId}
										onClick={() => setSelectedIdx(idx)}
										className={`flex flex-col items-center min-w-[70px] max-w-[70px] sm:min-w-[90px] sm:max-w-[90px] p-1 sm:p-2 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 ${
											selectedIdx === idx
												? "border-pink-500 bg-pink-50 shadow-lg"
												: "border-transparent bg-white/80 hover:bg-pink-100"
										}`}
									>
										<div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-pink-300 overflow-hidden mb-1 sm:mb-2">
											<Image
												src={product.imageUrl}
												alt={product.name}
												width={56}
												height={56}
												className="object-cover w-full h-full"
											/>
										</div>
										<div className="text-xs font-semibold text-gray-700 text-center truncate w-full">
											{product.name}
										</div>
										<div
											className="w-6 h-6 rounded-full border-2 border-pink-400 mt-1"
											style={{
												background:
													product.hexColor && isValidHexColor(product.hexColor)
														? product.hexColor
														: "#dc3753",
											}}
										/>
									</button>
								))}
							</div>
						</div>
					</div>
				)}
				<Link
					href="/shop"
					className="mt-6 sm:mt-8 w-full sm:w-auto px-6 sm:px-8 py-3 bg-pink-500 text-white rounded-full shadow hover:bg-pink-600 transition font-bold text-base sm:text-lg text-center"
				>
					Back to Shop
				</Link>
			</main>
			<Footer />
		</div>
	);
}

export default function VirtualTryOnPage() {
	return (
		<Suspense>
			<VirtualTryOnContent />
		</Suspense>
	);
}
