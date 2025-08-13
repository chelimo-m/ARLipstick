export default function Footer() {
	return (
		<footer className="w-full bg-pink-50 text-gray-500 text-center py-6 border-t border-pink-100 mt-12">
			<div className="container max-w-8xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-4 text-sm sm:text-base">
				<div className="flex items-center gap-2 text-sm font-bold text-pink-600">
					{/* Lipstick SVG Icon */}
					<svg
						width="24"
						height="24"
						viewBox="0 0 36 36"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect x="15" y="8" width="6" height="14" rx="3" fill="#dc3753" />
						<rect x="13" y="22" width="10" height="6" rx="2" fill="#fbb6ce" />
						<rect x="15" y="28" width="6" height="3" rx="1.5" fill="#e11d48" />
						<rect x="16.5" y="5" width="3" height="5" rx="1.5" fill="#f472b6" />
					</svg>
					Joanna K Cosmetics &copy; {new Date().getFullYear()}. All rights
					reserved.
				</div>
				<div className="flex items-center gap-4 text-base">
					<a href="#" className="hover:text-pink-500 transition">
						Privacy Policy
					</a>
					<a href="#" className="hover:text-pink-500 transition">
						Terms
					</a>
					{/* Social icons placeholder */}
					<span className="inline-flex gap-2 ml-2">
						<a href="#" className="hover:text-pink-500">
							<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
								<path d="M22.46 6c-.77.35-1.6.59-2.47.7a4.3 4.3 0 0 0 1.88-2.37 8.59 8.59 0 0 1-2.72 1.04A4.28 4.28 0 0 0 16.11 4c-2.37 0-4.29 1.92-4.29 4.29 0 .34.04.67.11.99C7.69 8.99 4.07 7.13 1.64 4.15c-.37.64-.58 1.39-.58 2.19 0 1.51.77 2.84 1.94 3.62-.72-.02-1.39-.22-1.98-.55v.06c0 2.11 1.5 3.87 3.5 4.27-.36.1-.74.16-1.13.16-.28 0-.54-.03-.8-.08.54 1.68 2.11 2.9 3.97 2.93A8.6 8.6 0 0 1 2 19.54c-.29 0-.57-.02-.85-.05A12.13 12.13 0 0 0 8.29 21.5c7.55 0 11.68-6.26 11.68-11.68 0-.18-.01-.36-.02-.54A8.18 8.18 0 0 0 24 4.59a8.36 8.36 0 0 1-2.54.7z" />
							</svg>
						</a>
						<a href="#" className="hover:text-pink-500">
							<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 2.04c-5.5 0-9.96 4.46-9.96 9.96 0 4.41 3.6 8.07 8.24 8.93v-6.32h-2.48v-2.61h2.48V9.41c0-2.45 1.49-3.8 3.68-3.8 1.07 0 2.19.19 2.19.19v2.41h-1.24c-1.22 0-1.6.76-1.6 1.54v1.85h2.72l-.44 2.61h-2.28v6.32c4.64-.86 8.24-4.52 8.24-8.93 0-5.5-4.46-9.96-9.96-9.96z" />
							</svg>
						</a>
					</span>
				</div>
			</div>
		</footer>
	);
}
