import { NextRequest } from "next/server";
import { GET, POST } from "../products/route";

// Mock Firebase Admin
jest.mock("../../firebaseAdmin", () => ({
	db: {
		collection: jest.fn(() => ({
			get: jest.fn(),
			add: jest.fn(),
			doc: jest.fn(() => ({
				get: jest.fn(),
				update: jest.fn(),
				delete: jest.fn(),
			})),
		})),
	},
}));

// Mock Firebase Auth
jest.mock("firebase-admin/auth", () => ({
	getAuth: jest.fn(() => ({
		verifyIdToken: jest.fn(),
	})),
}));

describe("Products API", () => {
	let mockDb: any;
	let mockAuth: any;

	beforeEach(() => {
		jest.clearAllMocks();
		mockDb = require("../../firebaseAdmin").db;
		mockAuth = require("firebase-admin/auth").getAuth();
	});

	describe("GET /api/products", () => {
		it("should return products successfully", async () => {
			const mockProducts = [
				{
					id: "1",
					name: "Ruby Red Lipstick",
					price: 1500,
					imageUrl: "/test.jpg",
				},
			];

			mockDb.collection().get.mockResolvedValue({
				docs: mockProducts.map((product) => ({
					id: product.id,
					data: () => product,
				})),
			});

			const request = new NextRequest("http://localhost:3000/api/products");
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual(mockProducts);
		});

		it("should handle database errors", async () => {
			mockDb.collection().get.mockRejectedValue(new Error("Database error"));

			const request = new NextRequest("http://localhost:3000/api/products");
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe("Failed to fetch products");
		});

		it("should return empty array when no products", async () => {
			mockDb.collection().get.mockResolvedValue({
				docs: [],
			});

			const request = new NextRequest("http://localhost:3000/api/products");
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual([]);
		});
	});

	describe("POST /api/products", () => {
		it("should create product successfully", async () => {
			const newProduct = {
				name: "New Lipstick",
				price: 1200,
				description: "A new lipstick",
				imageUrl: "/new.jpg",
			};

			mockAuth.verifyIdToken.mockResolvedValue({ uid: "admin-user" });
			mockDb.collection().add.mockResolvedValue({ id: "new-id" });

			const request = new NextRequest("http://localhost:3000/api/products", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer valid-token",
				},
				body: JSON.stringify(newProduct),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data.message).toBe("Product created successfully");
			expect(data.productId).toBe("new-id");
		});

		it("should reject unauthorized requests", async () => {
			mockAuth.verifyIdToken.mockRejectedValue(new Error("Invalid token"));

			const request = new NextRequest("http://localhost:3000/api/products", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer invalid-token",
				},
				body: JSON.stringify({ name: "Test" }),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe("Unauthorized");
		});

		it("should validate required fields", async () => {
			mockAuth.verifyIdToken.mockResolvedValue({ uid: "admin-user" });

			const request = new NextRequest("http://localhost:3000/api/products", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer valid-token",
				},
				body: JSON.stringify({ description: "Missing name and price" }),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toContain("name");
			expect(data.error).toContain("price");
		});

		it("should handle database errors during creation", async () => {
			mockAuth.verifyIdToken.mockResolvedValue({ uid: "admin-user" });
			mockDb.collection().add.mockRejectedValue(new Error("Database error"));

			const request = new NextRequest("http://localhost:3000/api/products", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer valid-token",
				},
				body: JSON.stringify({
					name: "Test Product",
					price: 1000,
				}),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe("Failed to create product");
		});
	});
});
