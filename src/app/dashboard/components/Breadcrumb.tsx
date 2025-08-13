"use client";

import { AiOutlineHome } from "react-icons/ai";
import React from "react";
import Link from "next/link";

type Crumb = {
	name: string;
	href?: string;
};

type BreadcrumbProps = {
	items: Crumb[];
	rightContent?: React.ReactNode;
};

export default function Breadcrumb({ items, rightContent }: BreadcrumbProps) {
	return (
		<div className="w-full h-14 p-2 flex justify-between items-center bg-gradient-to-r from-pink-200 via-pink-100 to-rose-100 border-b-2 border-pink-300">
			{/* Left: Home icon and breadcrumb items */}
			<div className="flex items-center h-full gap-2">
				{/* Home icon and all breadcrumb items in a single flex row for perfect centering and uniform font */}
				{items && items.length > 0 ? (
					<div className="flex items-center h-full gap-2 text-pink-600 text-base sm:text-lg md:text-xl font-semibold">
						{/* First item (Home/Dashboard) */}
						<Link
							href={items[0].href || "/"}
							className="flex items-center h-full hover:text-pink-800"
						>
							<AiOutlineHome size={28} className="mr-1" />
							<span className="flex items-center h-full">{items[0].name}</span>
						</Link>
						{/* If more than 2 items, show ellipsis */}
						{items.length > 2 && <span className="mx-2 text-pink-400">/</span>}
						{items.length > 2 && (
							<span className="mx-2 text-pink-400">...</span>
						)}
						{/* If more than 1 item, show separator and last item */}
						{items.length > 1 && <span className="mx-2 text-pink-400">/</span>}
						{items.length > 1 &&
							(items[items.length - 1].href ? (
								<Link
									href={items[items.length - 1].href!}
									className="hover:underline transition h-full flex items-center"
								>
									{items[items.length - 1].name}
								</Link>
							) : (
								<span className="h-full flex items-center">
									{items[items.length - 1].name}
								</span>
							))}
					</div>
				) : (
					<Link
						href="/"
						className="flex items-center h-full hover:text-pink-800 text-pink-600 text-base sm:text-lg md:text-xl font-semibold"
					>
						<AiOutlineHome size={28} className="mr-1" />
					</Link>
				)}
			</div>
			{/* Right: Profile or right content */}
			<div className="flex items-center h-full min-w-[40px] justify-end">
				{rightContent && (
					<span className="h-full flex items-center">{rightContent}</span>
				)}
			</div>
		</div>
	);
}
