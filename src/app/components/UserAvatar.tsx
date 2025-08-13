import Image from "next/image";
import { FaUser } from "react-icons/fa";

interface UserAvatarProps {
	photoURL?: string | null;
	displayName?: string;
	email?: string;
	size?: number;
	className?: string;
}

export default function UserAvatar({
	photoURL,
	displayName,
	email,
	size = 32,
	className = "",
}: UserAvatarProps) {
	const getInitials = (name?: string) => {
		if (!name) return "?";
		const parts = name.split(" ");
		return parts
			.map((p) => p[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const userName = displayName || email?.split("@")[0] || "User";

	if (photoURL) {
		return (
			<Image
				src={photoURL}
				alt={userName}
				width={size}
				height={size}
				className={`rounded-full object-cover border border-pink-200 bg-white ${className}`}
				onError={(e) => {
					// If image fails to load, replace with initials
					const target = e.target as HTMLImageElement;
					target.style.display = "none";
					const parent = target.parentElement;
					if (parent) {
						const initialsDiv = document.createElement("div");
						initialsDiv.className = `w-${size} h-${size} rounded-full bg-gradient-to-r from-pink-200 via-pink-100 to-rose-100 flex items-center justify-center text-pink-600 font-bold border border-pink-200 ${className}`;
						initialsDiv.style.width = `${size}px`;
						initialsDiv.style.height = `${size}px`;
						initialsDiv.style.fontSize = `${Math.max(size * 0.4, 12)}px`;
						initialsDiv.textContent = getInitials(userName);
						parent.appendChild(initialsDiv);
					}
				}}
			/>
		);
	}

	return (
		<div
			className={`rounded-full bg-gradient-to-r from-pink-200 via-pink-100 to-rose-100 flex items-center justify-center text-pink-600 font-bold border border-pink-200 ${className}`}
			style={{
				width: `${size}px`,
				height: `${size}px`,
				fontSize: `${Math.max(size * 0.4, 12)}px`,
			}}
		>
			{getInitials(userName)}
		</div>
	);
}
