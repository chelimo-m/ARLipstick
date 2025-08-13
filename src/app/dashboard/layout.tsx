"use client";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { app } from "../firebaseConfig";
import Sidebar from "./components/Sidebar";
import Image from "next/image";
import Breadcrumb from "./components/Breadcrumb";
import UserAvatar from "../components/UserAvatar";

type UserType = {
	uid: string;
	email: string;
	displayName: string;
	photoURL: string | null;
	roleId?: string;
};

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [user, setUser] = useState<UserType | null>(null);
	const [loading, setLoading] = useState(true);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		const auth = getAuth(app);
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			if (firebaseUser) {
				const idToken = await firebaseUser.getIdToken();
				const res = await fetch("/api/auth", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ idToken }),
				});
				const data = await res.json();
				setUser(data.user);
				setLoading(false);
			} else {
				router.replace("/login");
			}
		});
		return () => unsubscribe();
	}, [router]);

	const handleLogout = async () => {
		const auth = getAuth(app);
		await signOut(auth);
		router.replace("/login");
	};

	if (loading) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100">
				<Image
					src="/ar-lipstick-logo.svg"
					alt="Loading"
					width={64}
					height={64}
					className="mb-6 animate-bounce"
				/>
				<div className="w-12 h-12 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mb-4"></div>
				<p className="text-pink-600 font-bold text-lg animate-pulse">
					Loading your beauty dashboard...
				</p>
			</div>
		);
	}

	const isAdmin = !!user && user.roleId === "admin";

	// Centralized breadcrumb logic
	function getBreadcrumbItems(pathname: string) {
		const parts = pathname.split("/").filter(Boolean);
		const items = [];
		if (parts[0] === "dashboard") {
			items.push({ name: "Dashboard", href: "/dashboard" });
			if (parts[1] === "admin") {
				items.push({ name: "Admin", href: "/dashboard/admin" });
				if (parts[2] === "orders") {
					items.push({ name: "Orders", href: "/dashboard/admin/orders" });
				} else if (parts[2]) {
					const pretty = parts[2].charAt(0).toUpperCase() + parts[2].slice(1);
					items.push({ name: pretty });
				}
			} else if (parts[1]) {
				const pretty = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
				items.push({ name: pretty });
			}
		}
		return items.length ? items : [{ name: "Dashboard" }];
	}

	const breadcrumbItems = getBreadcrumbItems(pathname || "");

	return (
		<div className="min-h-screen flex bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 overflow-x-hidden">
			{/* Sidebar: hidden on mobile, toggled with sidebarOpen */}
			<Sidebar
				isAdmin={isAdmin}
				onLogout={handleLogout}
				current={pathname || ""}
				open={sidebarOpen}
			/>
			{/* Backdrop for mobile sidebar */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 z-20 bg-black/30 md:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}
			<main className="flex-1 flex flex-col min-h-screen relative md:ml-64 overflow-x-hidden">
				<div className="w-full z-20 sticky top-0 left-0">
					<Breadcrumb
						items={breadcrumbItems}
						rightContent={
							<div className="flex items-center gap-3">
								{/* Sidebar toggle button for mobile */}
								<button
									onClick={() => setSidebarOpen((v) => !v)}
									className="md:hidden p-2 rounded hover:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300"
								>
									<span className="sr-only">Open sidebar</span>
									<svg
										className="w-6 h-6 text-pink-600"
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
								{user && (
									<>
										<UserAvatar
											photoURL={user.photoURL}
											displayName={user.displayName}
											email={user.email}
											size={48}
											className="profile-avatar"
										/>
										<span className="hidden sm:flex flex-col">
											<span className="font-semibold text-pink-700">
												{user.displayName}
											</span>
											<span className="text-xs text-gray-500">
												{user.email}
											</span>
										</span>
									</>
								)}
							</div>
						}
					/>
				</div>
				<div className="">
					{/* Add padding to prevent content from hiding behind breadcrumb */}
					{children}
				</div>
			</main>
		</div>
	);
}
