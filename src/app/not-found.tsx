"use client";
import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 text-center px-4">
			<Image
				src="/ar-lipstick-logo.svg"
				alt="Lipstick Logo"
				width={80}
				height={80}
				className="mb-6 drop-shadow-lg"
			/>
			<h1 className="text-6xl font-extrabold text-pink-600 mb-4">404</h1>
			<h2 className="text-2xl font-bold text-pink-500 mb-2">Page Not Found</h2>
			<p className="text-gray-600 mb-6 max-w-md mx-auto">
				Oops! The page you’re looking for doesn’t exist. Maybe you took a wrong
				turn at the beauty aisle?
			</p>
			<Link
				href="/dashboard"
				className="inline-block bg-pink-500 text-white px-6 py-3 rounded-full font-bold shadow hover:bg-pink-600 transition"
			>
				Go to Dashboard
			</Link>
		</div>
	);
}
