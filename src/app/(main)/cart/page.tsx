"use client";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import type { CartItem } from "../../types/models";
import Image from "next/image";

export default function Cart() {
	const [cartItems, setCartItems] = useState<CartItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		async function fetchCart() {
			try {
				const auth = getAuth();
				const user = auth.currentUser;
				if (!user) {
					setError("Please login to view your cart.");
					setLoading(false);
					return;
				}
				const idToken = await user.getIdToken();
				const res = await fetch("/api/cart", {
					headers: { Authorization: `Bearer ${idToken}` },
				});
				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.message || "Failed to fetch cart");
				}
				const data = await res.json();
				setCartItems(data);
			} catch (err: unknown) {
				if (err instanceof Error) setError(err.message);
				else setError("Error fetching cart");
			} finally {
				setLoading(false);
			}
		}
		fetchCart();
	}, []);

	const total = cartItems
		.reduce(
			(sum, item) =>
				sum +
				(typeof item.price === "number"
					? item.price
					: parseFloat((item.price || "0").toString().replace("$", ""))) *
					(item.quantity || 1),
			0
		)
		.toFixed(2);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				Loading cart...
			</div>
		);
	}
	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center text-red-500">
				{error}
			</div>
		);
	}
	return (
		<div className="min-h-screen flex flex-col bg-gradient-to-b from-pink-50 to-white font-sans">
			<Header />
			<main className="flex-1 w-full max-w-8xl mx-auto px-4 py-16">
				<h1 className="text-4xl font-extrabold text-pink-600 mb-8 text-center">
					Your Cart
				</h1>
				{cartItems.length === 0 ? (
					<div className="text-center text-gray-500">Your cart is empty.</div>
				) : (
					<div className="bg-white rounded-2xl shadow-lg p-8 border border-pink-100">
						<ul>
							{cartItems.map((item) => (
								<li
									key={item.productId}
									className="flex items-center justify-between py-4 border-b last:border-b-0"
								>
									<div className="flex items-center gap-4">
										<Image
											src={item.imageUrl || "/ar-lipstick-logo.svg"}
											alt={item.name || "Product image"}
											width={64}
											height={64}
											className="w-16 h-16 rounded-full border-2 border-pink-200 object-cover"
										/>
										<div>
											<div className="font-bold text-lg text-gray-800">
												{item.name}
											</div>
											<div className="text-pink-500 font-semibold">
												{typeof item.price === "number"
													? `Ksh ${item.price}`
													: item.price}
											</div>
										</div>
									</div>
									<div className="text-gray-700">Qty: {item.quantity}</div>
								</li>
							))}
						</ul>
						<div className="flex justify-between items-center mt-8">
							<div className="text-xl font-bold">Total:</div>
							<div className="text-2xl font-extrabold text-pink-600">
								${total}
							</div>
						</div>
						<button className="mt-8 w-full px-8 py-4 bg-pink-500 text-white rounded-full shadow-xl hover:bg-pink-600 transition font-semibold text-lg">
							Checkout
						</button>
					</div>
				)}
				<div className="mt-8 text-center">
					<Link
						href="/shop"
						className="text-pink-500 hover:underline font-semibold"
					>
						Continue Shopping
					</Link>
				</div>
			</main>
			<Footer />
		</div>
	);
}
