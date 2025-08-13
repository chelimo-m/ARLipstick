"use client";
import { Table } from "antd";
import "antd/dist/reset.css";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import type { User } from "../../../types/models";
import Image from "next/image";
import UserAvatar from "../../../components/UserAvatar";

const columns = [
	{
		title: "User",
		key: "user",
		render: (_: unknown, user: User) => (
			<span className="flex items-center gap-3">
				<UserAvatar
					photoURL={user.photoURL}
					displayName={user.displayName}
					email={user.email}
					size={32}
				/>
				<span>
					<span className="font-semibold text-black block">
						{user.displayName || "(No Name)"}
					</span>
					<span className="text-xs text-gray-500">{user.email || "-"}</span>
				</span>
			</span>
		),
	},
	{
		title: "Role",
		dataIndex: "roleId",
		key: "roleId",
		render: (roleId: string) => {
			if (!roleId) return <span className="text-gray-400">-</span>;

			const roleConfig = {
				admin: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Admin" },
				customer: {
					bg: "bg-pink-100",
					text: "text-pink-700",
					label: "Customer",
				},
			};

			const config = roleConfig[roleId as keyof typeof roleConfig] || {
				bg: "bg-gray-100",
				text: "text-gray-700",
				label: roleId,
			};

			return (
				<span
					className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${config.bg} ${config.text}`}
				>
					{config.label}
				</span>
			);
		},
	},
	{
		title: "Bio",
		dataIndex: "bio",
		key: "bio",
		render: (v: string) => v || "-",
	},
	{
		title: "Phone",
		dataIndex: "phone",
		key: "phone",
		render: (v: string) => v || "-",
	},
	{
		title: "Created At",
		dataIndex: "createdAt",
		key: "createdAt",
		render: (v: string) => {
			if (!v) return "-";

			const date = new Date(v);
			const day = date.getDate();
			const month = date.toLocaleDateString("en-US", { month: "long" });
			const year = date.getFullYear();

			// Add ordinal suffix to day
			const getOrdinalSuffix = (day: number) => {
				if (day > 3 && day < 21) return "th";
				switch (day % 10) {
					case 1:
						return "st";
					case 2:
						return "nd";
					case 3:
						return "rd";
					default:
						return "th";
				}
			};

			return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
		},
	},
	{
		title: "Last Login",
		dataIndex: "lastLoginAt",
		key: "lastLoginAt",
		render: (v: string) => {
			if (!v) return "-";

			const date = new Date(v);
			const now = new Date();
			const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

			// If less than 24 hours, show just the time
			if (diffInHours < 24) {
				return date.toLocaleTimeString("en-US", {
					hour: "2-digit",
					minute: "2-digit",
					hour12: true,
				});
			}

			// If more than 24 hours, show the full date
			const day = date.getDate();
			const month = date.toLocaleDateString("en-US", { month: "long" });
			const year = date.getFullYear();

			// Add ordinal suffix to day
			const getOrdinalSuffix = (day: number) => {
				if (day > 3 && day < 21) return "th";
				switch (day % 10) {
					case 1:
						return "st";
					case 2:
						return "nd";
					case 3:
						return "rd";
					default:
						return "th";
				}
			};

			return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
		},
	},
];

export default function AdminUsersPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		async function fetchUsers() {
			try {
				const auth = getAuth();
				const user = auth.currentUser;
				if (!user) {
					setError("Please login as admin.");
					setLoading(false);
					return;
				}
				const idToken = await user.getIdToken();
				const res = await fetch("/api/users", {
					headers: { Authorization: `Bearer ${idToken}` },
				});
				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.message || "Failed to fetch users");
				}
				const data = await res.json();
				setUsers(data);
			} catch (err: unknown) {
				if (err instanceof Error) setError(err.message);
				else setError("Error fetching users");
			} finally {
				setLoading(false);
			}
		}
		fetchUsers();
	}, []);

	return (
		<div className="min-h-screen w-full bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100">
			<div className="w-full max-w-7xl mx-auto pt-12 px-4">
				<h1 className="text-3xl font-extrabold text-pink-700 mb-8">
					User Management
				</h1>
				<div className="w-full bg-white/90 rounded-3xl shadow-2xl border border-pink-100 p-6">
					{loading ? (
						<div className="text-center py-8 text-lg text-pink-500 font-semibold">
							Loading users...
						</div>
					) : error ? (
						<div className="text-center py-8 text-lg text-red-500 font-semibold">
							{error}
						</div>
					) : (
						<div className="w-full overflow-x-auto">
							<Table
								columns={columns}
								dataSource={users}
								pagination={false}
								rowKey="userId"
								className="rounded-xl overflow-hidden min-w-[900px]"
								scroll={{ x: true }}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
