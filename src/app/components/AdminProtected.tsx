"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "../firebaseConfig";
import Image from "next/image";

interface AdminProtectedProps {
	children: React.ReactNode;
}

export default function AdminProtected({ children }: AdminProtectedProps) {
	const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const auth = getAuth(app);
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			if (firebaseUser) {
				try {
					const idToken = await firebaseUser.getIdToken();
					const res = await fetch("/api/auth", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ idToken }),
					});
					const data = await res.json();

					if (data.user && data.user.roleId === "admin") {
						setIsAdmin(true);
					} else {
						setIsAdmin(false);
					}
				} catch (error) {
					console.error("Error checking admin status:", error);
					setIsAdmin(false);
				}
			} else {
				setIsAdmin(false);
			}
			setLoading(false);
		});

		return () => unsubscribe();
	}, []);

	useEffect(() => {
		if (isAdmin === false && !loading) {
			router.replace("/dashboard");
		}
	}, [isAdmin, loading, router]);

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
					Verifying admin access...
				</p>
			</div>
		);
	}

	if (!isAdmin) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100">
				<Image
					src="/ar-lipstick-logo.svg"
					alt="Access Denied"
					width={64}
					height={64}
					className="mb-6"
				/>
				<div className="text-center">
					<h1 className="text-2xl font-bold text-pink-700 mb-4">
						Access Denied
					</h1>
					<p className="text-pink-600 mb-6">
						You don&apos;t have permission to access this page.
					</p>
					<button
						onClick={() => router.push("/dashboard")}
						className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 py-2 rounded-lg transition"
					>
						Go to Dashboard
					</button>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}
