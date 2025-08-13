const features = [
	{
		icon: (
			<svg
				className="w-14 h-14 mb-4 text-pink-500"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		),
		title: "Premium Quality Ingredients",
		description:
			"Formulated with the finest ingredients, our lipsticks provide long-lasting color, hydration, and comfort while maintaining the highest standards of quality and safety.",
	},
	{
		icon: (
			<svg
				className="w-14 h-14 mb-4 text-pink-500"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M13 10V3L4 14h7v7l9-11h-7z"
				/>
			</svg>
		),
		title: "Advanced Virtual Try-On",
		description:
			"Experience our cutting-edge AR technology that lets you see every shade on your lips in real-time. Find your perfect match before you buy with our innovative virtual try-on.",
	},
	{
		icon: (
			<svg
				className="w-14 h-14 mb-4 text-pink-500"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
				/>
			</svg>
		),
		title: "Cruelty-Free & Ethical",
		description:
			"Committed to beauty without cruelty. Our products are never tested on animals and we maintain the highest ethical standards in our manufacturing and sourcing practices.",
	},
];

export default function FeatureSection() {
	return (
		<section className="w-full flex justify-center">
			<div className="w-full container max-w-8xl py-20 px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
				{features.map((feature, i) => (
					<div key={i} className="flex flex-col items-center">
						{feature.icon}
						<h3 className="text-2xl font-bold mb-2 text-pink-600">
							{feature.title}
						</h3>
						<p className="text-gray-600 text-lg">{feature.description}</p>
					</div>
				))}
			</div>
		</section>
	);
}
