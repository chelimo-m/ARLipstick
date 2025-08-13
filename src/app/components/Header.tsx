"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { app, auth } from "../firebaseConfig";
import {
	AiOutlineHome,
	AiOutlineUser,
	AiOutlineShoppingCart,
	AiOutlineLogout,
} from "react-icons/ai";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import UserAvatar from "./UserAvatar";

export default function Header() {
	const [user, setUser] = useState<null | {
		displayName: string;
		photoURL: string | null;
	}>(null);
	const [cartOpen, setCartOpen] = useState(false);
	const [cartCount, setCartCount] = useState<number>(0);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const router = useRouter();

	const handleLogout = async () => {
		if (!auth) {
			console.warn("Firebase auth not initialized");
			setUser(null);
			router.push("/login");
			return;
		}

		try {
			await auth.signOut();
			setUser(null);
			router.push("/login");
		} catch (error) {
			console.error("Logout error:", error);
			setUser(null);
			router.push("/login");
		}
	};

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!app || !auth) {
			console.warn("Firebase not initialized, skipping auth state listener");
			return;
		}

		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			if (firebaseUser) {
				setUser({
					displayName: firebaseUser.displayName || "User",
					photoURL: firebaseUser.photoURL || null,
				});
				// Fetch cart count
				try {
					const idToken = await firebaseUser.getIdToken();
					const res = await fetch("/api/cart", {
						headers: { Authorization: `Bearer ${idToken}` },
					});
					if (res.ok) {
						const data = await res.json();
						setCartCount(Array.isArray(data) ? data.length : 0);
					} else {
						setCartCount(0);
					}
				} catch {
					setCartCount(0);
				}
			} else {
				setUser(null);
				setCartCount(0);
			}
		});
		return () => unsubscribe();
	}, []);

	return (
		<header className="w-full sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-pink-100 shadow-sm">
			<div className="container mx-auto flex items-center justify-between px-2 sm:px-4 py-3 sm:py-4">
				<Link href="/" className="flex items-center gap-2 select-none">
					{/* Lipstick SVG Icon */}
					<svg
						width="28"
						height="28"
						viewBox="0 0 36 36"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect x="15" y="8" width="6" height="14" rx="3" fill="#dc3753" />
						<rect x="13" y="22" width="10" height="6" rx="2" fill="#fbb6ce" />
						<rect x="15" y="28" width="6" height="3" rx="1.5" fill="#e11d48" />
						<rect x="16.5" y="5" width="3" height="5" rx="1.5" fill="#f472b6" />
					</svg>
					<span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-pink-600 tracking-tight">
						Joanna K Cosmetics
					</span>
				</Link>
				<nav className="hidden md:flex space-x-8 ml-4 sm:ml-6">
					<Link
						href="/"
						className="nav-link font-bold text-gray-800 hover:text-pink-600 focus:text-pink-600 transition"
					>
						Home
					</Link>
					<Link
						href="/shop"
						className="nav-link font-bold text-gray-800 hover:text-pink-600 focus:text-pink-600 transition"
					>
						Shop
					</Link>
					<Link
						href="/virtual-tryon"
						className="nav-link font-bold text-gray-800 hover:text-pink-600 focus:text-pink-600 transition"
					>
						Virtual Try-On
					</Link>
				</nav>
				<div className="flex items-center gap-1 sm:gap-2 ml-auto relative">
					<Link
						href="/shop"
						className="hidden md:inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-pink-500 to-pink-400 text-white rounded-full shadow hover:from-pink-600 hover:to-pink-500 focus:ring-2 focus:ring-pink-300 transition font-bold text-sm sm:text-base"
					>
						Shop Now
					</Link>
					{user ? (
						<div className="relative">
							<button
								type="button"
								className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-pink-200 hover:bg-pink-50 focus:bg-pink-100 transition"
								onClick={() => setCartOpen((open) => !open)}
							>
								<UserAvatar
									photoURL={user.photoURL}
									displayName={user.displayName}
									size={32}
									className="w-8 h-8 border-2 border-pink-200"
								/>
								<span className="hidden md:inline font-semibold text-gray-700">
									{user.displayName}
								</span>
							</button>
							{cartOpen && (
								<div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-pink-100 z-50 p-4">
									<Link
										href="/dashboard"
										className="flex items-center gap-2 px-4 py-2 rounded hover:bg-pink-50 font-semibold text-gray-700 mb-1"
									>
										<AiOutlineHome className="text-pink-500" size={20} />{" "}
										Dashboard
									</Link>
									<Link
										href="/dashboard/profile"
										className="flex items-center gap-2 px-4 py-2 rounded hover:bg-pink-50 font-semibold text-gray-700 mb-1"
									>
										<AiOutlineUser className="text-pink-500" size={20} />{" "}
										Profile
									</Link>
									<Link
										href="/dashboard/cart"
										className="flex items-center gap-2 px-4 py-2 rounded hover:bg-pink-50 font-semibold text-gray-700 mb-1 relative"
									>
										<AiOutlineShoppingCart
											className="text-pink-500"
											size={20}
										/>
										Cart
										{cartCount > 0 && (
											<span className="absolute top-2 right-4 bg-pink-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 shadow">
												{cartCount}
											</span>
										)}
									</Link>
									<button
										className="flex items-center gap-2 w-full text-left px-4 py-2 rounded font-semibold mt-2 bg-red-500 text-white hover:bg-red-600 transition"
										onClick={handleLogout}
									>
										<AiOutlineLogout className="text-red-200" size={20} />{" "}
										Logout
									</button>
								</div>
							)}
						</div>
					) : (
						<Link
							href="/login"
							className="px-5 py-2 bg-white border-2 border-pink-500 text-pink-600 rounded-full shadow hover:bg-pink-50 focus:ring-2 focus:ring-pink-300 transition font-bold text-base"
						>
							Login
						</Link>
					)}
				</div>
				<button
					className="md:hidden p-2 rounded hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-300 ml-1"
					onClick={() => setMobileMenuOpen(true)}
				>
					<span className="sr-only">Open menu</span>
					<svg
						className="w-8 h-8 text-pink-600"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</button>
				{/* Mobile menu overlay */}
				{mobileMenuOpen && mounted && typeof window !== "undefined"
					? createPortal(
							<div className="fixed inset-0 w-full h-full z-[99999] bg-white/98 backdrop-blur shadow-2xl overflow-y-auto flex flex-col p-4 sm:p-6">
								<div className="flex flex-col w-full mb-6">
									<div className="flex items-center justify-between w-full mb-4">
										<Link
											href="/"
											className="flex items-center gap-2 select-none"
											onClick={() => setMobileMenuOpen(false)}
										>
											<svg
												width="28"
												height="28"
												viewBox="0 0 36 36"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
											>
												<rect
													x="15"
													y="8"
													width="6"
													height="14"
													rx="3"
													fill="#dc3753"
												/>
												<rect
													x="13"
													y="22"
													width="10"
													height="6"
													rx="2"
													fill="#fbb6ce"
												/>
												<rect
													x="15"
													y="28"
													width="6"
													height="3"
													rx="1.5"
													fill="#e11d48"
												/>
												<rect
													x="16.5"
													y="5"
													width="3"
													height="5"
													rx="1.5"
													fill="#f472b6"
												/>
											</svg>
											<span className="text-xl font-extrabold text-pink-600 tracking-tight">
												LushLips
											</span>
										</Link>
										<button
											className="p-2 rounded hover:bg-pink-100"
											onClick={() => setMobileMenuOpen(false)}
										>
											<span className="sr-only">Close menu</span>
											<svg
												className="w-8 h-8 text-pink-600"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</button>
									</div>
									<hr className="border-pink-100 mb-4" />
								</div>
								<div className="flex-1 flex flex-col gap-4">
									<nav className="flex flex-col gap-4 mb-8">
										<Link
											href="/"
											className="text-base font-bold text-gray-800 hover:text-pink-600 px-2 py-2 rounded"
											onClick={() => setMobileMenuOpen(false)}
										>
											Home
										</Link>
										<Link
											href="/shop"
											className="text-base font-bold text-gray-800 hover:text-pink-600 px-2 py-2 rounded"
											onClick={() => setMobileMenuOpen(false)}
										>
											Shop
										</Link>
										<Link
											href="/virtual-tryon"
											className="text-base font-bold text-gray-800 hover:text-pink-600 px-2 py-2 rounded"
											onClick={() => setMobileMenuOpen(false)}
										>
											Virtual Try-On
										</Link>
									</nav>
									<div className="flex flex-col gap-3">
										{user ? (
											<>
												<Link
													href="/dashboard"
													className="font-semibold text-gray-700 flex items-center gap-2 px-2 py-2 rounded hover:bg-pink-50"
													onClick={() => setMobileMenuOpen(false)}
												>
													<AiOutlineHome className="text-pink-500" size={20} />{" "}
													Dashboard
												</Link>
												<Link
													href="/dashboard/profile"
													className="font-semibold text-gray-700 flex items-center gap-2 px-2 py-2 rounded hover:bg-pink-50"
													onClick={() => setMobileMenuOpen(false)}
												>
													<AiOutlineUser className="text-pink-500" size={20} />{" "}
													Profile
												</Link>
												<Link
													href="/dashboard/cart"
													className="font-semibold text-gray-700 flex items-center gap-2 px-2 py-2 rounded hover:bg-pink-50 relative"
													onClick={() => setMobileMenuOpen(false)}
												>
													<AiOutlineShoppingCart
														className="text-pink-500"
														size={20}
													/>{" "}
													Cart
													{cartCount > 0 && (
														<span className="absolute top-1 right-2 bg-pink-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 shadow">
															{cartCount}
														</span>
													)}
												</Link>
												<button
													className="font-semibold text-white bg-red-500 rounded px-4 py-2 mt-2"
													onClick={() => {
														handleLogout();
														setMobileMenuOpen(false);
													}}
												>
													<AiOutlineLogout className="text-red-200" size={20} />{" "}
													Logout
												</button>
											</>
										) : (
											<Link
												href="/login"
												className="px-5 py-2 bg-white border-2 border-pink-500 text-pink-600 rounded-full shadow hover:bg-pink-50 font-bold text-base"
												onClick={() => setMobileMenuOpen(false)}
											>
												Login
											</Link>
										)}
									</div>
								</div>
							</div>,
							document.body
					  )
					: null}
			</div>
		</header>
	);
}

// Tailwind nav-link style
// Add this to your global CSS if not present:
// .nav-link { @apply text-gray-700 hover:text-pink-500 font-semibold transition px-2 py-1 rounded; }
