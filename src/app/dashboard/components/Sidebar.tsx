"use client";
import Image from "next/image";
import Link from "next/link";
import {
	AiOutlineHome,
	AiOutlineUser,
	AiOutlineAppstore,
	AiOutlinePlusSquare,
	AiOutlineTeam,
	AiOutlineShoppingCart,
	AiOutlineShopping,
	AiOutlineCreditCard,
} from "react-icons/ai";

type SidebarProps = {
	// user: {
	// 	displayName: string;
	// 	email: string;
	// 	photoURL: string | null;
	// } | null;
	isAdmin: boolean;
	onLogout: () => void;
	current: string;
};

export default function Sidebar({
	// user,
	isAdmin,
	onLogout,
	current,
	open = true,
}: SidebarProps & { open?: boolean }) {
	// Admin links
	const adminLinks = [
		{
			name: "Dashboard",
			href: "/dashboard",
			icon: <AiOutlineHome size={20} />,
		},
		{
			name: "Manage Products",
			href: "/dashboard/admin/products",
			icon: <AiOutlineAppstore size={20} />,
		},
		{
			name: "Add Product",
			href: "/dashboard/admin/add-product",
			icon: <AiOutlinePlusSquare size={20} />,
		},
		{
			name: "Orders",
			href: "/dashboard/admin/orders",
			icon: <AiOutlineShopping size={20} />,
		},
		{
			name: "User Management",
			href: "/dashboard/admin/users",
			icon: <AiOutlineTeam size={20} />,
		},
		{
			name: "Payments",
			href: "/dashboard/admin/payments",
			icon: <AiOutlineCreditCard size={20} />,
		},
		{
			name: "Profile",
			href: "/dashboard/profile",
			icon: <AiOutlineUser size={20} />,
		},
	];

	// User links
	const userLinks = [
		{
			name: "Dashboard",
			href: "/dashboard",
			icon: <AiOutlineHome size={20} />,
		},
		{
			name: "Profile",
			href: "/dashboard/profile",
			icon: <AiOutlineUser size={20} />,
		},
		{
			name: "Orders",
			href: "/dashboard/orders",
			icon: <AiOutlineShopping size={20} />,
		},
		{
			name: "Cart",
			href: "/dashboard/cart",
			icon: <AiOutlineShoppingCart size={20} />,
		},
		{
			name: "Payment",
			href: "/dashboard/payment",
			icon: <AiOutlineCreditCard size={20} />,
		},
	];

	const linksToShow = isAdmin ? adminLinks : userLinks;

	return (
		<aside
			className={`bg-white/90 border-r border-pink-100 shadow-lg flex flex-col items-center py-6 sm:py-8 min-h-screen h-screen fixed left-0 top-0 z-30 transition-transform duration-300 w-56 md:w-64 overflow-y-auto ${
				open ? "translate-x-0" : "-translate-x-full"
			} md:translate-x-0`}
		>
			<div className="flex flex-col items-center mb-6 sm:mb-8">
				<Image
					src="/ar-lipstick-logo.svg"
					alt="LushLips Logo"
					width={48}
					height={48}
					className="w-12 h-12 sm:w-16 sm:h-16 mb-2 object-contain"
				/>
				<span className="font-extrabold text-lg sm:text-2xl text-pink-600 tracking-tight">
					LushLips
				</span>
			</div>
			<nav className="flex flex-col gap-1.5 sm:gap-2 w-full px-3 sm:px-6 flex-1">
				{linksToShow.map((link) => (
					<a
						key={link.href}
						href={link.href}
						className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-semibold transition text-pink-700 hover:bg-pink-50 ${
							current === link.href ? "bg-pink-100" : ""
						}`}
					>
						{link.icon} {link.name}
					</a>
				))}
				<button
					onClick={onLogout}
					className="text-left px-3 sm:px-4 py-2 rounded-lg font-semibold transition mt-6 sm:mt-8 bg-red-500 text-white hover:bg-red-600 shadow"
				>
					Logout
				</button>
			</nav>
			<div className="mt-auto w-full px-3 sm:px-6 pb-3 sm:pb-4">
				<Link
					href="/"
					className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-semibold text-pink-700 hover:bg-pink-50 transition w-full justify-center"
				>
					<AiOutlineHome size={20} /> Back to Home
				</Link>
			</div>
		</aside>
	);
}
