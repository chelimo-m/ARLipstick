"use client";
import {
	Table,
	Button,
	InputNumber,
	Card,
	Empty,
	Modal,
	message,
	Input,
	Tooltip,
} from "antd";
import "antd/dist/reset.css";
import {
	FaShoppingCart,
	FaTrash,
	FaCreditCard,
	FaMapMarkerAlt,
	FaLocationArrow,
	FaSpinner,
	FaPhoneAlt,
} from "react-icons/fa";
import { useEffect, useState, useRef } from "react";
import { getAuth } from "firebase/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { handlePaystackPayment } from "@/app/paystackHandler";
import type { CartItem, Product } from "@/app/types/models";

const { confirm } = Modal;

export default function CartPage() {
	const [cartItems, setCartItems] = useState<CartItem[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [updatingItem, setUpdatingItem] = useState<string | null>(null);
	const [checkoutLoading, setCheckoutLoading] = useState(false);
	const [checkoutMessage, setCheckoutMessage] = useState("");
	const [deliveryLocation, setDeliveryLocation] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [locating, setLocating] = useState(false);
	const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
	const router = useRouter();

	useEffect(() => {
		fetchCart();
		fetchProducts();
	}, []);

	async function fetchCart() {
		try {
			const auth = getAuth();
			const user = auth.currentUser;
			if (!user) {
				setError("Please login to view your cart.");
				return;
			}
			const idToken = await user.getIdToken();
			const res = await fetch("/api/cart", {
				headers: { Authorization: `Bearer ${idToken}` },
			});
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || data.message || "Failed to fetch cart");
			}
			const cart = await res.json();
			setCartItems(cart);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error fetching cart");
		} finally {
			setLoading(false);
		}
	}

	async function fetchProducts() {
		try {
			const res = await fetch("/api/products");
			if (res.ok) {
				setProducts(await res.json());
			}
		} catch (err) {
			console.error("Error fetching products:", err);
		}
	}

	async function updateQuantity(productId: string, quantity: number) {
		if (quantity < 1) return;

		setUpdatingItem(productId);
		try {
			const auth = getAuth();
			const user = auth.currentUser;
			if (!user) throw new Error("Please login to update cart.");

			const idToken = await user.getIdToken();
			const res = await fetch("/api/cart", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${idToken}`,
				},
				body: JSON.stringify({ productId, quantity }),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || data.message || "Failed to update cart");
			}

			// Update local state
			setCartItems((prev) =>
				prev.map((item) =>
					item.productId === productId ? { ...item, quantity } : item
				)
			);
			message.success("Cart updated successfully");
		} catch (err) {
			message.error(
				err instanceof Error ? err.message : "Failed to update cart"
			);
		} finally {
			setUpdatingItem(null);
		}
	}

	async function removeItem(productId: string) {
		confirm({
			title: "Remove Item",
			content: "Are you sure you want to remove this item from your cart?",
			okText: "Remove",
			okType: "danger",
			cancelText: "Cancel",
			async onOk() {
				try {
					const auth = getAuth();
					const user = auth.currentUser;
					if (!user) throw new Error("Please login to remove item.");

					const idToken = await user.getIdToken();
					const res = await fetch(`/api/cart/${productId}`, {
						method: "DELETE",
						headers: { Authorization: `Bearer ${idToken}` },
					});

					if (!res.ok) {
						const data = await res.json();
						throw new Error(
							data.error || data.message || "Failed to remove item"
						);
					}

					// Update local state
					setCartItems((prev) =>
						prev.filter((item) => item.productId !== productId)
					);
					message.success("Item removed from cart");
				} catch (err) {
					message.error(
						err instanceof Error ? err.message : "Failed to remove item"
					);
				}
			},
		});
	}

	async function clearCart() {
		confirm({
			title: "Clear Cart",
			content: "Are you sure you want to clear your entire cart?",
			okText: "Clear",
			okType: "danger",
			cancelText: "Cancel",
			async onOk() {
				try {
					const auth = getAuth();
					const user = auth.currentUser;
					if (!user) throw new Error("Please login to clear cart.");

					const idToken = await user.getIdToken();
					const res = await fetch("/api/cart", {
						method: "DELETE",
						headers: { Authorization: `Bearer ${idToken}` },
					});

					if (!res.ok) {
						const data = await res.json();
						throw new Error(
							data.error || data.message || "Failed to clear cart"
						);
					}

					setCartItems([]);
					message.success("Cart cleared successfully");
				} catch (err) {
					message.error(
						err instanceof Error ? err.message : "Failed to clear cart"
					);
				}
			},
		});
	}

	function getProductInfo(productId: string): Product | undefined {
		return products.find((p) => p.productId === productId);
	}

	function calculateSubtotal(): number {
		return cartItems.reduce((total, item) => {
			const product = getProductInfo(item.productId);
			const price = product?.price || item.price || 0;
			return total + price * item.quantity;
		}, 0);
	}

	function calculateVAT(): number {
		return calculateSubtotal() * 0.16; // 16% VAT
	}

	function calculateDeliveryFee(): number {
		return calculateSubtotal() > 5000 ? 0 : 500; // Free delivery over Ksh 5,000
	}

	function calculateTotal(): number {
		return calculateSubtotal() + calculateVAT() + calculateDeliveryFee();
	}

	async function handleCheckout() {
		setCheckoutLoading(true);
		setCheckoutMessage("");
		try {
			const auth = getAuth();
			const user = auth.currentUser;
			if (!user) {
				setCheckoutMessage("Please login to checkout.");
				setCheckoutLoading(false);
				return;
			}
			if (!deliveryLocation || !phoneNumber) {
				setCheckoutMessage(
					"Please provide delivery location and phone number."
				);
				setCheckoutLoading(false);
				return;
			}
			if (!user.email) {
				setCheckoutMessage("User email is required for payment.");
				setCheckoutLoading(false);
				return;
			}
			const idToken = await user.getIdToken();
			const orderItems = cartItems.map((item) => {
				const product = getProductInfo(item.productId);
				return {
					productId: item.productId,
					quantity: item.quantity,
					priceAtPurchase: product?.price || item.price || 0,
					name: product?.name || item.name,
					imageUrl: product?.imageUrl || item.imageUrl,
				};
			});
			const subtotal = calculateSubtotal();
			const vat = calculateVAT();
			const deliveryFee = calculateDeliveryFee();
			const total = calculateTotal();

			// Call Paystack handler
			await handlePaystackPayment({
				amount: total,
				phoneNumber,
				deliveryLocation,
				orderItems,
				user: { email: user.email! },
				idToken,
				subtotal,
				vat,
				deliveryFee,
			});

			// Clear cart in backend after successful order
			await fetch("/api/cart", {
				method: "DELETE",
				headers: { Authorization: `Bearer ${idToken}` },
			});

			// Success message and reset
			setCheckoutMessage("Order placed successfully!");
			setCartItems([]);
			setDeliveryLocation("");
			setPhoneNumber("");
			setTimeout(() => {
				setCheckoutMessage("");
				router.push("/dashboard/orders");
			}, 1500);
		} catch (err: unknown) {
			if (err instanceof Error) setCheckoutMessage(err.message);
			else setCheckoutMessage("Checkout failed");
		} finally {
			setCheckoutLoading(false);
		}
	}

	async function handleUseMyLocation() {
		if (!navigator.geolocation) {
			setCheckoutMessage("Geolocation is not supported by your browser.");
			return;
		}
		setLocating(true);
		setCheckoutMessage("");
		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const { latitude, longitude } = position.coords;
				try {
					const res = await fetch(
						`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
					);
					const data = await res.json();
					if (data && data.display_name) {
						setDeliveryLocation(data.display_name);
					} else {
						setCheckoutMessage("Could not determine address from location.");
					}
				} catch {
					setCheckoutMessage("Failed to fetch address from location.");
				} finally {
					setLocating(false);
				}
			},
			() => {
				setCheckoutMessage("Unable to retrieve your location.");
				setLocating(false);
			}
		);
	}

	async function fetchLocationSuggestions(query: string) {
		if (!query || query.length < 3) {
			setLocationSuggestions([]);
			return;
		}
		try {
			const res = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
					query
				)}&addressdetails=1&limit=5`
			);
			const data = await res.json();
			if (Array.isArray(data)) {
				setLocationSuggestions(
					data.map((item: { display_name: string }) => item.display_name)
				);
			} else {
				setLocationSuggestions([]);
			}
		} catch {
			setLocationSuggestions([]);
		}
	}

	function handleLocationInputChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = e.target.value;
		setDeliveryLocation(value);
		setShowSuggestions(true);
		if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
		debounceTimeout.current = setTimeout(() => {
			fetchLocationSuggestions(value);
		}, 350);
	}

	function handleSuggestionClick(suggestion: string) {
		setDeliveryLocation(suggestion);
		setShowSuggestions(false);
		setLocationSuggestions([]);
	}

	function handleLocationBlur() {
		setTimeout(() => setShowSuggestions(false), 150); // allow click
	}

	const columns = [
		{
			title: "Product",
			key: "product",
			width: 200,
			render: (record: CartItem) => {
				const product = getProductInfo(record.productId);
				return (
					<div className="flex items-center space-x-2 sm:space-x-3">
						<Image
							src={product?.imageUrl || record.imageUrl || "/placeholder.png"}
							alt={product?.name || record.name || "Product"}
							width={40}
							height={40}
							className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg border border-pink-200 object-cover"
						/>
						<div className="min-w-0 flex-1">
							<div className="font-semibold text-gray-800 text-xs sm:text-sm md:text-base truncate">
								{product?.name || record.name || "Product"}
							</div>
							{product?.colorName && (
								<div className="text-xs sm:text-xs md:text-sm text-gray-500 truncate">
									Color: {product.colorName}
								</div>
							)}
						</div>
					</div>
				);
			},
		},
		{
			title: "Price",
			key: "price",
			width: 100,
			render: (record: CartItem) => {
				const product = getProductInfo(record.productId);
				const price = product?.price || record.price || 0;
				return (
					<div className="text-right">
						<div className="font-semibold text-pink-600 text-xs sm:text-sm md:text-base">
							Ksh {price.toLocaleString()}
						</div>
						{product?.oldPrice && product.oldPrice > price && (
							<div className="text-xs sm:text-xs md:text-sm text-gray-400 line-through">
								Ksh {product.oldPrice.toLocaleString()}
							</div>
						)}
					</div>
				);
			},
		},
		{
			title: "Qty",
			key: "quantity",
			width: 80,
			render: (record: CartItem) => (
				<div className="flex items-center space-x-1 sm:space-x-2">
					<InputNumber
						min={1}
						max={99}
						value={record.quantity}
						onChange={(value) => updateQuantity(record.productId, value || 1)}
						disabled={updatingItem === record.productId}
						className="w-12 sm:w-16 md:w-20 text-xs sm:text-sm"
						size="small"
					/>
					{updatingItem === record.productId && (
						<FaSpinner className="animate-spin text-pink-500 text-xs sm:text-sm" />
					)}
				</div>
			),
		},
		{
			title: "Total",
			key: "subtotal",
			width: 100,
			render: (record: CartItem) => {
				const product = getProductInfo(record.productId);
				const price = product?.price || record.price || 0;
				const subtotal = price * record.quantity;
				return (
					<div className="text-right font-semibold text-gray-800 text-xs sm:text-sm md:text-base">
						Ksh {subtotal.toLocaleString()}
					</div>
				);
			},
		},
		{
			title: "",
			key: "actions",
			width: 60,
			render: (record: CartItem) => (
				<Button
					type="text"
					danger
					icon={<FaTrash />}
					onClick={() => removeItem(record.productId)}
					className="text-red-500 hover:text-red-700 p-1 sm:p-2"
					size="small"
				/>
			),
		},
	];

	if (loading) {
		return (
			<div className="min-h-screen w-full bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
					<div className="text-pink-600 font-semibold">
						Loading your cart...
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen w-full bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100">
			<div className="w-full max-w-7xl mx-auto pt-6 sm:pt-8 md:pt-12 px-3 sm:px-4 md:px-6">
				{/* Header Section */}
				<div className="flex flex-col items-center mb-6 sm:mb-8">
					<span className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-pink-200 via-pink-100 to-rose-100 shadow-lg mb-3 sm:mb-4">
						<FaShoppingCart className="text-pink-400 text-2xl sm:text-3xl md:text-4xl" />
					</span>
					<h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-pink-600 mb-1 tracking-tight text-center">
						Your Shopping Cart
					</h2>
					<p className="text-gray-600 text-base sm:text-lg text-center">
						{cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in your
						cart
					</p>
				</div>

				{/* Mobile Layout: Order Summary First */}
				<div className="block lg:hidden mb-6">
					<Card
						title={<span className="text-lg sm:text-xl font-bold text-pink-600">Order Summary</span>}
						className="rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-pink-100"
						headStyle={{
							backgroundColor: "#fdf2f8",
							borderBottom: "1px solid #fce7f3",
							borderRadius: "16px 16px 0 0",
							padding: "16px 20px",
						}}
					>
						<div className="space-y-3 sm:space-y-4">
							<div className="flex justify-between text-sm sm:text-base text-gray-600">
								<span>Subtotal ({cartItems.length} items)</span>
								<span>Ksh {calculateSubtotal().toLocaleString()}</span>
							</div>
							<div className="flex justify-between text-sm sm:text-base text-gray-600">
								<span>VAT (16%)</span>
								<span>Ksh {calculateVAT().toLocaleString()}</span>
							</div>
							<div className="flex justify-between text-sm sm:text-base text-gray-600">
								<span>Delivery Fee</span>
								<span>
									{calculateDeliveryFee() === 0 ? (
										<span className="text-green-600 font-semibold">FREE</span>
									) : (
										`Ksh ${calculateDeliveryFee().toLocaleString()}`
									)}
								</span>
							</div>
							{calculateDeliveryFee() > 0 && (
								<div className="text-xs sm:text-sm text-green-600 bg-green-50 p-2 rounded-lg">
									Free delivery on orders over Ksh 5,000
								</div>
							)}
							<div className="border-t border-gray-200 pt-3">
								<div className="flex justify-between text-base sm:text-lg font-bold text-pink-600">
									<span>Total</span>
									<span>Ksh {calculateTotal().toLocaleString()}</span>
								</div>
							</div>
							
							{/* Mobile Delivery Location */}
							<div className="space-y-2">
								<label className="font-semibold text-pink-500 text-xs sm:text-sm">
									Delivery Location
								</label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400 pointer-events-none">
										<FaMapMarkerAlt />
									</span>
									<Input
										placeholder="Enter delivery location"
										value={deliveryLocation}
										onChange={handleLocationInputChange}
										onFocus={() =>
											deliveryLocation.length > 2 && setShowSuggestions(true)
										}
										onBlur={handleLocationBlur}
										className="pl-10 rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-sm"
									/>
									{showSuggestions && locationSuggestions.length > 0 && (
										<ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-pink-200 rounded-xl shadow-lg max-h-32 overflow-y-auto">
											{locationSuggestions.map((suggestion, idx) => (
												<li
													key={idx}
													onMouseDown={() =>
														handleSuggestionClick(suggestion)
													}
													className="px-3 py-2 cursor-pointer hover:bg-pink-100 text-xs sm:text-sm"
												>
													{suggestion}
												</li>
											))}
										</ul>
									)}
								</div>
								<div className="flex items-center gap-2">
									<Tooltip title="Use My Location" placement="top">
										<Button
											type="text"
											size="small"
											disabled={locating}
											onClick={handleUseMyLocation}
											icon={locating ? <FaSpinner className="animate-spin" /> : <FaLocationArrow />}
											className="text-pink-500 hover:text-pink-600 text-xs"
										>
											{locating ? "Locating..." : "Use My Location"}
										</Button>
									</Tooltip>
								</div>
							</div>

							{/* Mobile Phone Number */}
							<div className="space-y-2">
								<label className="font-semibold text-pink-500 text-xs sm:text-sm">
									Phone Number
								</label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400 pointer-events-none">
										<FaPhoneAlt />
									</span>
									<Input
										placeholder="Enter phone number"
										value={phoneNumber}
										onChange={(e) => setPhoneNumber(e.target.value)}
										className="pl-10 rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-sm"
									/>
								</div>
							</div>

							{/* Mobile Checkout Message */}
							{checkoutMessage && (
								<div
									className={`text-center font-semibold text-xs sm:text-sm p-2 rounded-lg ${
										checkoutMessage.includes("success")
											? "text-green-600 bg-green-50"
											: "text-red-500 bg-red-50"
									}`}
								>
									{checkoutMessage}
								</div>
							)}

							<Button
								type="primary"
								size="large"
								block
								icon={<FaCreditCard />}
								disabled={cartItems.length === 0 || checkoutLoading}
								onClick={handleCheckout}
								className="bg-pink-500 hover:bg-pink-600 h-10 sm:h-12 text-sm sm:text-base font-semibold"
								loading={checkoutLoading}
							>
								{checkoutLoading ? "Processing..." : "Proceed to Checkout"}
							</Button>
							<Button
								size="large"
								block
								onClick={() => router.push("/shop")}
								className="h-10 sm:h-12 text-sm sm:text-base"
							>
								Continue Shopping
							</Button>
						</div>
					</Card>
				</div>

				{/* Main Content Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
					{/* Cart Items */}
					<div className="lg:col-span-2">
						<div className="bg-white/90 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-pink-100 p-3 sm:p-4 md:p-6">
							{error ? (
								<div className="text-center py-6 sm:py-8 text-base sm:text-lg text-red-500 font-semibold">
									{error}
								</div>
							) : cartItems.length === 0 ? (
								<Empty
									image={Empty.PRESENTED_IMAGE_SIMPLE}
									description={
										<span className="text-gray-500 text-sm sm:text-base">
											Your cart is empty
										</span>
									}
									className="py-8 sm:py-12"
								>
									<Button
										type="primary"
										size="large"
										onClick={() => router.push("/shop")}
										className="bg-pink-500 hover:bg-pink-600"
									>
										Continue Shopping
									</Button>
								</Empty>
							) : (
								<div className="w-full overflow-x-auto">
									<Table
										columns={columns}
										dataSource={cartItems}
										pagination={false}
										rowKey="productId"
										className="rounded-xl overflow-hidden"
										size="small"
										scroll={{ x: 600 }}
									/>
									<div className="mt-4 sm:mt-6 flex justify-end">
										<Button 
											danger 
											onClick={clearCart} 
											icon={<FaTrash />}
											size="small"
											className="text-xs sm:text-sm"
										>
											Clear Cart
										</Button>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Desktop Order Summary */}
					<div className="hidden lg:block lg:col-span-1">
						<Card
							title={<span className="text-xl font-bold text-pink-600">Order Summary</span>}
							className="rounded-3xl shadow-2xl border border-pink-100"
							headStyle={{
								backgroundColor: "#fdf2f8",
								borderBottom: "1px solid #fce7f3",
								borderRadius: "24px 24px 0 0",
								padding: "20px 24px",
							}}
						>
							<div className="space-y-4">
								<div className="flex justify-between text-gray-600">
									<span>Subtotal ({cartItems.length} items)</span>
									<span>Ksh {calculateSubtotal().toLocaleString()}</span>
								</div>
								<div className="flex justify-between text-gray-600">
									<span>VAT (16%)</span>
									<span>Ksh {calculateVAT().toLocaleString()}</span>
								</div>
								<div className="flex justify-between text-gray-600">
									<span>Delivery Fee</span>
									<span>
										{calculateDeliveryFee() === 0 ? (
											<span className="text-green-600 font-semibold">FREE</span>
										) : (
											`Ksh ${calculateDeliveryFee().toLocaleString()}`
										)}
									</span>
								</div>
								{calculateDeliveryFee() > 0 && (
									<div className="text-sm text-green-600 bg-green-50 p-2 rounded-lg">
										Free delivery on orders over Ksh 5,000
									</div>
								)}
								<div className="border-t border-gray-200 pt-4">
									<div className="flex justify-between text-lg font-bold text-pink-600">
										<span>Total</span>
										<span>Ksh {calculateTotal().toLocaleString()}</span>
									</div>
								</div>
								
								{/* Desktop Delivery Location */}
								<div className="space-y-2">
									<label className="font-semibold text-pink-500 text-sm">
										Delivery Location
									</label>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400 pointer-events-none">
											<FaMapMarkerAlt />
										</span>
										<Input
											placeholder="Enter delivery location"
											value={deliveryLocation}
											onChange={handleLocationInputChange}
											onFocus={() =>
												deliveryLocation.length > 2 && setShowSuggestions(true)
											}
											onBlur={handleLocationBlur}
											className="pl-10 rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
										/>
										{showSuggestions && locationSuggestions.length > 0 && (
											<ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-pink-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
												{locationSuggestions.map((suggestion, idx) => (
													<li
														key={idx}
														onMouseDown={() =>
															handleSuggestionClick(suggestion)
														}
														className="px-3 py-2 cursor-pointer hover:bg-pink-100 text-sm"
													>
														{suggestion}
													</li>
												))}
											</ul>
										)}
									</div>
									<Tooltip title="Use My Location" placement="top">
										<Button
											type="text"
											size="small"
											disabled={locating}
											onClick={handleUseMyLocation}
											icon={locating ? <FaSpinner className="animate-spin" /> : <FaLocationArrow />}
											className="text-pink-500 hover:text-pink-600"
										>
											{locating ? "Locating..." : "Use My Location"}
										</Button>
									</Tooltip>
								</div>

								{/* Desktop Phone Number */}
								<div className="space-y-2">
									<label className="font-semibold text-pink-500 text-sm">
										Phone Number
									</label>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400 pointer-events-none">
											<FaPhoneAlt />
										</span>
										<Input
											placeholder="Enter phone number"
											value={phoneNumber}
											onChange={(e) => setPhoneNumber(e.target.value)}
											className="pl-10 rounded-xl border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
										/>
									</div>
								</div>

								{/* Desktop Checkout Message */}
								{checkoutMessage && (
									<div
										className={`text-center font-semibold text-sm p-2 rounded-lg ${
											checkoutMessage.includes("success")
												? "text-green-600 bg-green-50"
												: "text-red-500 bg-red-50"
										}`}
									>
										{checkoutMessage}
									</div>
								)}

								<Button
									type="primary"
									size="large"
									block
									icon={<FaCreditCard />}
									disabled={cartItems.length === 0 || checkoutLoading}
									onClick={handleCheckout}
									className="bg-pink-500 hover:bg-pink-600 h-12 text-lg font-semibold"
									loading={checkoutLoading}
								>
									{checkoutLoading ? "Processing..." : "Proceed to Checkout"}
								</Button>
								<Button
									size="large"
									block
									onClick={() => router.push("/shop")}
									className="h-12 text-lg"
								>
									Continue Shopping
								</Button>
							</div>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
