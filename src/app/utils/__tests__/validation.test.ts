import {
	validateEmail,
	validatePhone,
	validatePrice,
	validateProductData,
	validateOrderData,
} from "../validation";

describe("Validation Utilities", () => {
	describe("validateEmail", () => {
		it("should validate correct email formats", () => {
			expect(validateEmail("test@example.com")).toBe(true);
			expect(validateEmail("user.name@domain.co.uk")).toBe(true);
			expect(validateEmail("test+tag@example.org")).toBe(true);
		});

		it("should reject invalid email formats", () => {
			expect(validateEmail("invalid-email")).toBe(false);
			expect(validateEmail("test@")).toBe(false);
			expect(validateEmail("@example.com")).toBe(false);
			expect(validateEmail("")).toBe(false);
			expect(validateEmail("test@.com")).toBe(false);
		});

		it("should handle edge cases", () => {
			expect(validateEmail(null as any)).toBe(false);
			expect(validateEmail(undefined as any)).toBe(false);
			expect(validateEmail("   test@example.com   ")).toBe(true); // trim() is applied
		});
	});

	describe("validatePhone", () => {
		it("should validate Kenyan phone numbers", () => {
			expect(validatePhone("+254712345678")).toBe(true);
			expect(validatePhone("0712345678")).toBe(true);
			expect(validatePhone("254712345678")).toBe(true);
		});

		it("should reject invalid phone numbers", () => {
			expect(validatePhone("123")).toBe(false);
			expect(validatePhone("071234567")).toBe(false); // Too short
			expect(validatePhone("07123456789")).toBe(false); // Too long
			expect(validatePhone("")).toBe(false);
			expect(validatePhone("abc123def")).toBe(false);
		});

		it("should handle edge cases", () => {
			expect(validatePhone(null as any)).toBe(false);
			expect(validatePhone(undefined as any)).toBe(false);
		});
	});

	describe("validatePrice", () => {
		it("should validate positive prices", () => {
			expect(validatePrice(100)).toBe(true);
			expect(validatePrice(0)).toBe(true);
			expect(validatePrice(999999.99)).toBe(true);
		});

		it("should reject negative prices", () => {
			expect(validatePrice(-100)).toBe(false);
			expect(validatePrice(-0.01)).toBe(false);
		});

		it("should handle edge cases", () => {
			expect(validatePrice(null as any)).toBe(false);
			expect(validatePrice(undefined as any)).toBe(false);
			expect(validatePrice("100" as any)).toBe(false);
		});
	});

	describe("validateProductData", () => {
		it("should validate complete product data", () => {
			const validProduct = {
				name: "Test Product",
				price: 1500,
				description: "A test product",
				imageUrl: "https://example.com/image.jpg",
			};

			const result = validateProductData(validProduct);
			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		it("should reject product without required fields", () => {
			const invalidProduct = {
				description: "Missing name and price",
			};

			const result = validateProductData(invalidProduct);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("name");
			expect(result.errors).toContain("price");
		});

		it("should validate price constraints", () => {
			const productWithInvalidPrice = {
				name: "Test Product",
				price: -100,
				imageUrl: "https://example.com/image.jpg",
			};

			const result = validateProductData(productWithInvalidPrice);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("price");
		});

		it("should validate image URL format", () => {
			const productWithInvalidImage = {
				name: "Test Product",
				price: 1500,
				imageUrl: "not-a-url",
			};

			const result = validateProductData(productWithInvalidImage);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("imageUrl");
		});
	});

	describe("validateOrderData", () => {
		it("should validate complete order data", () => {
			const validOrder = {
				items: [{ productId: "1", quantity: 2, priceAtPurchase: 1500 }],
				total: 3000,
				deliveryLocation: "Nairobi, Kenya",
				phoneNumber: "+254712345678",
			};

			const result = validateOrderData(validOrder);
			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		it("should reject order without items", () => {
			const invalidOrder = {
				total: 3000,
				deliveryLocation: "Nairobi, Kenya",
			};

			const result = validateOrderData(invalidOrder);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("items");
		});

		it("should validate item structure", () => {
			const orderWithInvalidItems = {
				items: [
					{ productId: "1" }, // Missing quantity and price
				],
				total: 3000,
				deliveryLocation: "Nairobi, Kenya",
			};

			const result = validateOrderData(orderWithInvalidItems);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("items[0]"); // Specific item error
			expect(result.errors).toContain("phoneNumber");
		});

		it("should validate delivery information", () => {
			const orderWithoutDelivery = {
				items: [{ productId: "1", quantity: 2, priceAtPurchase: 1500 }],
				total: 3000,
			};

			const result = validateOrderData(orderWithoutDelivery);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("deliveryLocation");
			expect(result.errors).toContain("phoneNumber");
		});

		it("should validate phone number format", () => {
			const orderWithInvalidPhone = {
				items: [{ productId: "1", quantity: 2, priceAtPurchase: 1500 }],
				total: 3000,
				deliveryLocation: "Nairobi, Kenya",
				phoneNumber: "invalid-phone",
			};

			const result = validateOrderData(orderWithInvalidPhone);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("phoneNumber");
		});
	});
});
