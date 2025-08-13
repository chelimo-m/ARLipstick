"use client";
import Link from "next/link";
import {
	FaPlus,
	FaCheckCircle,
	FaBoxes,
	FaUsers,
	FaCreditCard,
} from "react-icons/fa";
import AdminProtected from "../../components/AdminProtected";

function AdminDashboardContent() {
	return (
		<div className="min-h-screen w-full bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100">
			<div className="w-full max-w-7xl mx-auto pt-12 px-4">
				<h1 className="text-4xl font-extrabold text-pink-700 mb-8 text-center">
					Admin Dashboard
				</h1>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					<Link
						href="/dashboard/admin/add-product"
						className="bg-white/90 rounded-2xl shadow-xl border border-pink-100 p-4 sm:p-8 flex flex-col items-center hover:shadow-2xl transition"
					>
						<FaPlus className="text-pink-500 text-3xl sm:text-4xl mb-4" />
						<span className="text-lg sm:text-xl font-bold text-pink-700 mb-2">
							Add Product
						</span>
						<span className="text-gray-500 text-center text-sm sm:text-base">
							Add new lipstick or beauty products to the shop.
						</span>
					</Link>
					<Link
						href="/dashboard/admin/approve-orders"
						className="bg-white/90 rounded-2xl shadow-xl border border-pink-100 p-8 flex flex-col items-center hover:shadow-2xl transition"
					>
						<FaCheckCircle className="text-pink-500 text-4xl mb-4" />
						<span className="text-xl font-bold text-pink-700 mb-2">
							Approve Orders
						</span>
						<span className="text-gray-500 text-center">
							Review and approve pending customer orders.
						</span>
					</Link>
					<Link
						href="/dashboard/admin/products"
						className="bg-white/90 rounded-2xl shadow-xl border border-pink-100 p-8 flex flex-col items-center hover:shadow-2xl transition"
					>
						<FaBoxes className="text-pink-500 text-4xl mb-4" />
						<span className="text-xl font-bold text-pink-700 mb-2">
							Manage Products
						</span>
						<span className="text-gray-500 text-center">
							Edit or remove existing products from the shop.
						</span>
					</Link>
					<Link
						href="/dashboard/admin/users"
						className="bg-white/90 rounded-2xl shadow-xl border border-pink-100 p-8 flex flex-col items-center hover:shadow-2xl transition"
					>
						<FaUsers className="text-pink-500 text-4xl mb-4" />
						<span className="text-xl font-bold text-pink-700 mb-2">
							User Management
						</span>
						<span className="text-gray-500 text-center">
							View and manage all users and their roles.
						</span>
					</Link>
					<Link
						href="/dashboard/admin/payments"
						className="bg-white/90 rounded-2xl shadow-xl border border-pink-100 p-8 flex flex-col items-center hover:shadow-2xl transition"
					>
						<FaCreditCard className="text-pink-500 text-4xl mb-4" />
						<span className="text-xl font-bold text-pink-700 mb-2">
							Payments
						</span>
						<span className="text-gray-500 text-center">
							View and manage all payments made on the platform.
						</span>
					</Link>
				</div>
			</div>
		</div>
	);
}

export default function AdminDashboardPage() {
	return (
		<AdminProtected>
			<AdminDashboardContent />
		</AdminProtected>
	);
}
