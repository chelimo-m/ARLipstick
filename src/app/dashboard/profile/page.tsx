"use client";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { app } from "../../firebaseConfig";
import Image from "next/image";
import {
	FaEnvelope,
	FaUserShield,
	FaUser,
	FaCrown,
	FaEdit,
	FaIdBadge,
	FaPhone,
	FaCalendarAlt,
} from "react-icons/fa";

type UserType = {
	uid?: string;
	userId?: string;
	email: string;
	displayName: string;
	photoURL: string | null;
	roleId?: string;
	bio?: string;
	phone?: string;
	createdAt?: string;
	status?: string;
};

export default function ProfilePage() {
	const [user, setUser] = useState<UserType | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();
	const [bio, setBio] = useState("");
	const [isEditing, setIsEditing] = useState(false);
	const [editName, setEditName] = useState("");
	const [saveLoading, setSaveLoading] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
	const [editBio, setEditBio] = useState("");
	const [phone, setPhone] = useState("");
	const [editPhone, setEditPhone] = useState("");

	useEffect(() => {
		const auth = getAuth(app);
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			if (firebaseUser) {
				try {
					const idToken = await firebaseUser.getIdToken();
					const res = await fetch("/api/users", {
						method: "GET",
						headers: { Authorization: `Bearer ${idToken}` },
					});

					if (!res.ok) {
						throw new Error("Failed to fetch user data");
					}

					const data = await res.json();
					let userData = data;
					if (Array.isArray(data)) {
						// Admin: find the current user's profile in the array
						userData =
							data.find((u) => u.userId === firebaseUser.uid) || data[0];
					}

					setUser(userData);
					setEditName(userData.displayName || "");
					setBio(userData.bio || "");
					setEditBio(userData.bio || "");
					setPhone(userData.phone || "");
					setEditPhone(userData.phone || "");
				} catch (error) {
					console.error("Error fetching user data:", error);
					setSaveError("Failed to load profile data");
				} finally {
					setLoading(false);
				}
			} else {
				router.replace("/login");
			}
		});
		return () => unsubscribe();
	}, [router]);

	const getInitials = (name?: string) => {
		if (!name) return "?";
		const parts = name.split(" ");
		return parts
			.map((p) => p[0])
			.join("")
			.toUpperCase();
	};

	const formatDate = (dateString?: string) => {
		if (!dateString) return "Unknown";
		try {
			return new Date(dateString).toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			});
		} catch {
			return "Unknown";
		}
	};

	const handleEdit = () => {
		setIsEditing(true);
	};

	const handleSave = async () => {
		setSaveLoading(true);
		setSaveError(null);
		setSaveSuccess(null);
		try {
			const auth = getAuth(app);
			const currentUser = auth.currentUser;
			if (!currentUser) throw new Error("Not authenticated");
			const idToken = await currentUser.getIdToken();
			const res = await fetch("/api/users", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${idToken}`,
				},
				body: JSON.stringify({
					displayName: editName,
					bio: editBio,
					phone: editPhone,
				}),
			});
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.message || "Failed to update profile");
			}
			const updatedUser = await res.json();
			setUser(updatedUser);
			setBio(updatedUser.bio || "");
			setPhone(updatedUser.phone || "");
			setIsEditing(false);
			setSaveSuccess("Profile updated successfully!");

			// Clear success message after 3 seconds
			setTimeout(() => setSaveSuccess(null), 3000);
		} catch (err: unknown) {
			let message = "Failed to update profile";
			if (err instanceof Error) message = err.message;
			setSaveError(message);
		} finally {
			setSaveLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100">
				<div className="flex flex-col items-center">
					<div
						className="w-14 h-14 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mb-4"
						aria-label="Loading"
						role="status"
					></div>
					<span className="text-pink-600 font-bold text-lg animate-pulse">
						Loading profile...
					</span>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center px-4 py-12">
			<div className="relative w-full max-w-lg flex flex-col items-center">
				<div className="w-full bg-white/30 backdrop-blur-2xl rounded-3xl shadow-2xl border border-pink-100 flex flex-col items-center p-4 sm:p-10 pt-20 sm:pt-24 relative overflow-visible">
					<div className="absolute -top-16 sm:-top-20 left-1/2 -translate-x-1/2 z-10">
						<div className="relative flex items-center justify-center">
							<span className="absolute w-24 h-24 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-pink-400 via-purple-300 to-rose-300 blur-2xl opacity-70 animate-pulse"></span>
							{user?.photoURL ? (
								<Image
									src={user.photoURL}
									alt="User avatar"
									width={96}
									height={96}
									className="rounded-full border-4 border-pink-300 shadow-xl object-cover w-24 h-24 sm:w-32 sm:h-32 bg-white relative z-10"
								/>
							) : (
								<div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-r from-pink-200 via-pink-100 to-rose-100 flex items-center justify-center text-pink-600 text-3xl sm:text-5xl font-bold border-4 border-pink-300 shadow-xl relative z-10">
									{getInitials(user?.displayName)}
								</div>
							)}
						</div>
					</div>
					<div className="mt-10 text-center w-full flex flex-col gap-4">
						<div className="flex flex-col gap-2 items-center">
							<label className="flex items-center gap-2 text-pink-700 font-bold text-lg">
								<FaUser className="text-pink-400" />
								{isEditing ? (
									<input
										type="text"
										value={editName}
										onChange={(e) => setEditName(e.target.value)}
										className="rounded-lg px-2 py-1 border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white/80 text-pink-700 font-bold text-lg w-48"
									/>
								) : (
									<span>{user?.displayName}</span>
								)}
							</label>
							<label className="flex items-center gap-2 text-gray-600 text-base">
								<FaEnvelope className="text-pink-300" />
								<span>{user?.email}</span>
							</label>
							<label className="flex items-center gap-2 text-gray-600 text-base">
								<FaPhone className="text-pink-300" />
								{isEditing ? (
									<input
										type="tel"
										value={editPhone}
										onChange={(e) => setEditPhone(e.target.value)}
										className="rounded-lg px-2 py-1 border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white/80 text-gray-700 w-56"
										placeholder="Phone number"
									/>
								) : (
									<span>
										{phone || (
											<span className="text-gray-400 italic">
												No phone set yet.
											</span>
										)}
									</span>
								)}
							</label>
							<span className="text-xs text-gray-400 flex items-center gap-1">
								<FaIdBadge className="inline text-pink-200" />
								<span className="font-semibold">User ID:</span>{" "}
								{user?.userId || user?.uid}
							</span>
							<span className="text-xs text-gray-400 flex items-center gap-1">
								<FaCalendarAlt className="inline text-pink-200" />
								<span className="font-semibold">Joined:</span>{" "}
								{formatDate(user?.createdAt)}
							</span>
							<span
								className={`inline-flex items-center gap-1 px-4 py-1 rounded-full text-xs font-bold shadow ${
									user?.roleId === "admin"
										? "bg-yellow-100 text-yellow-700"
										: "bg-pink-100 text-pink-600"
								}`}
							>
								{user?.roleId === "admin" ? (
									<FaCrown className="text-yellow-400" />
								) : (
									<FaUserShield className="text-pink-400" />
								)}
								Role: {user?.roleId === "admin" ? "Administrator" : "Customer"}
							</span>
						</div>
						<div className="mb-2 flex flex-col items-center gap-2">
							<label className="w-full flex flex-col items-center">
								<span className="text-pink-700 font-semibold mb-1">Bio</span>
								{isEditing ? (
									<textarea
										value={editBio}
										onChange={(e) => setEditBio(e.target.value)}
										className="rounded-lg px-3 py-2 border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white/80 text-pink-800 w-full max-w-xs resize-none"
										rows={2}
										placeholder="Add a short bio about yourself..."
									/>
								) : (
									<p className="text-base text-pink-800 bg-white/60 rounded-xl px-4 py-2 shadow-inner inline-block max-w-xs mx-auto">
										{bio ? (
											bio
										) : (
											<span className="text-gray-400 italic">
												No bio set yet.
											</span>
										)}
									</p>
								)}
							</label>
						</div>

						<div className="flex justify-center gap-3 mt-4">
							{isEditing ? (
								<>
									<button
										onClick={handleSave}
										disabled={saveLoading}
										className="bg-pink-500 hover:bg-pink-600 focus:ring-4 focus:ring-pink-200 text-white font-semibold px-6 py-2 rounded-xl shadow transition text-base flex items-center gap-2 disabled:opacity-60"
									>
										{saveLoading ? (
											<span
												className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block align-middle"
												aria-label="Saving"
												role="status"
											></span>
										) : (
											<FaEdit className="text-white text-lg" />
										)}
										Save
									</button>
									<button
										onClick={() => {
											setIsEditing(false);
											setEditName(user?.displayName || "");
											setEditBio(user?.bio || "");
											setEditPhone(user?.phone || "");
											setSaveError(null);
											setSaveSuccess(null);
										}}
										className="bg-gray-500 hover:bg-gray-600 focus:ring-4 focus:ring-gray-200 text-white font-semibold px-6 py-2 rounded-xl shadow transition text-base"
									>
										Cancel
									</button>
								</>
							) : (
								<button
									onClick={handleEdit}
									className="bg-pink-500 hover:bg-pink-600 focus:ring-4 focus:ring-pink-200 text-white font-semibold px-6 py-2 rounded-xl shadow transition text-base flex items-center gap-2"
								>
									<FaEdit className="text-white text-lg" /> Edit Profile
								</button>
							)}
						</div>
						{saveError && (
							<div className="text-red-500 text-sm mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
								{saveError}
							</div>
						)}
						{saveSuccess && (
							<div className="text-green-600 text-sm mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
								{saveSuccess}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
