import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
	variable: "--font-roboto-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "LushLips - Virtual Try-On",
	description: "Try on lipstick virtually with AR technology",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
			</head>
			<body className={`${inter.variable} ${robotoMono.variable} antialiased`}>
				{children}
			</body>
		</html>
	);
}
