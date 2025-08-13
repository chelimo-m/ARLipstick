import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProductGrid from "../ProductGrid";
import { Product } from "../../types/models";

// Mock the cart utility
jest.mock("../../utils/cart", () => ({
	addToCart: jest.fn(),
}));

// Mock Firebase auth
jest.mock("firebase/auth", () => ({
	getAuth: jest.fn(() => ({
		currentUser: { uid: "test-user-id" },
	})),
}));

const mockProducts: Product[] = [
	{
		productId: "1",
		name: "Ruby Red Lipstick",
		description: "A beautiful ruby red lipstick",
		price: 1500,
		imageUrl: "/test-image-1.jpg",
		category: "lipstick",
		stock: 10,
		colorName: "Ruby Red",
		hexColor: "#FF0000",
	},
	{
		productId: "2",
		name: "Pink Gloss",
		description: "Shiny pink lip gloss",
		price: 800,
		imageUrl: "/test-image-2.jpg",
		category: "lip gloss",
		stock: 5,
		colorName: "Pink",
		hexColor: "#FFC0CB",
	},
];

describe("ProductGrid Component", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders product grid with products", () => {
		render(<ProductGrid products={mockProducts} />);

		expect(screen.getByText("Ruby Red Lipstick")).toBeInTheDocument();
		expect(screen.getByText("Pink Gloss")).toBeInTheDocument();
		expect(
			screen.getByText("A beautiful ruby red lipstick")
		).toBeInTheDocument();
	});

	it("displays product prices correctly", () => {
		render(<ProductGrid products={mockProducts} />);

		expect(screen.getByText(/Ksh\s*1,500/)).toBeInTheDocument();
		expect(screen.getByText(/Ksh\s*800/)).toBeInTheDocument();
	});

	it('shows "Add to Cart" buttons for each product', () => {
		render(<ProductGrid products={mockProducts} />);

		const addToCartButtons = screen.getAllByText("Add to Cart");
		expect(addToCartButtons).toHaveLength(2);
	});

	it("displays product images", () => {
		render(<ProductGrid products={mockProducts} />);

		const images = screen.getAllByRole("img");
		expect(images).toHaveLength(2);
		expect(images[0]).toHaveAttribute("alt", "Ruby Red Lipstick");
		expect(images[1]).toHaveAttribute("alt", "Pink Gloss");
	});

	it("shows stock information", () => {
		render(<ProductGrid products={mockProducts} />);

		const stock10 = screen.queryByText(
			(content, node) =>
				!!node?.textContent?.replace(/\s+/g, "").includes("InStock:10")
		);
		const stock5 = screen.queryByText(
			(content, node) =>
				!!node?.textContent?.replace(/\s+/g, "").includes("InStock:5")
		);
		expect(stock10).toBeInTheDocument();
		expect(stock5).toBeInTheDocument();
	});

	it("handles empty products array", () => {
		render(<ProductGrid products={[]} />);

		const emptyMsg = screen.queryByText(
			(content, node) =>
				!!node?.textContent?.toLowerCase().includes("no products found")
		);
		expect(emptyMsg).toBeInTheDocument();
	});

	it("displays color information when available", () => {
		render(<ProductGrid products={mockProducts} />);

		const colorRuby = screen.queryByText(
			(content, node) =>
				!!node?.textContent?.replace(/\s+/g, "").includes("Color:RubyRed")
		);
		const colorPink = screen.queryByText(
			(content, node) =>
				!!node?.textContent?.replace(/\s+/g, "").includes("Color:Pink")
		);
		expect(colorRuby).toBeInTheDocument();
		expect(colorPink).toBeInTheDocument();
	});

	it("shows discount when old price is available", () => {
		const productsWithDiscount: Product[] = [
			{
				...mockProducts[0],
				oldPrice: 2000,
			},
		];

		render(<ProductGrid products={productsWithDiscount} />);

		const oldPrice = screen.queryByText(
			(content, node) =>
				!!node?.textContent?.replace(/\s+/g, "").includes("Ksh2,000")
		);
		const discount = screen.queryByText(
			(content, node) => !!node?.textContent?.includes("%")
		);
		expect(oldPrice).toBeInTheDocument();
		expect(discount).toBeInTheDocument();
	});

	it("handles products without optional fields", () => {
		const minimalProducts: Product[] = [
			{
				productId: "1",
				name: "Basic Lipstick",
				price: 1000,
				imageUrl: "/test.jpg",
			},
		];

		render(<ProductGrid products={minimalProducts} />);

		expect(screen.getByText("Basic Lipstick")).toBeInTheDocument();
		expect(screen.getByText(/Ksh\s*1,000/)).toBeInTheDocument();
	});
});
