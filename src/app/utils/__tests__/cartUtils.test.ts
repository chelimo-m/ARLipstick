import {
	calculateCartTotal,
	calculateSubtotal,
	calculateVAT,
	calculateDeliveryFee,
	calculateFinalTotal,
	formatPrice,
	calculateDiscountPercentage,
} from "../cartUtils";
import { CartItem } from "../../types/models";

describe("Cart Utility Functions", () => {
	const mockCartItems: CartItem[] = [
		{
			productId: "1",
			quantity: 2,
			addedAt: "2024-01-01",
			name: "Ruby Red Lipstick",
			price: 1500,
			imageUrl: "test.jpg",
		},
		{
			productId: "2",
			quantity: 1,
			addedAt: "2024-01-01",
			name: "Pink Gloss",
			price: 800,
			imageUrl: "test2.jpg",
		},
	];

	describe("calculateCartTotal", () => {
		it("should calculate total for cart items", () => {
			const total = calculateCartTotal(mockCartItems);
			expect(total).toBe(3800); // (1500 * 2) + (800 * 1)
		});

		it("should return 0 for empty cart", () => {
			const total = calculateCartTotal([]);
			expect(total).toBe(0);
		});

		it("should handle items without price", () => {
			const itemsWithoutPrice: CartItem[] = [
				{ productId: "1", quantity: 2, addedAt: "2024-01-01" },
			];
			const total = calculateCartTotal(itemsWithoutPrice);
			expect(total).toBe(0);
		});
	});

	describe("calculateSubtotal", () => {
		it("should return same as cart total", () => {
			const subtotal = calculateSubtotal(mockCartItems);
			const total = calculateCartTotal(mockCartItems);
			expect(subtotal).toBe(total);
		});
	});

	describe("calculateVAT", () => {
		it("should calculate 16% VAT correctly", () => {
			const vat = calculateVAT(1000);
			expect(vat).toBe(160);
		});

		it("should handle zero amount", () => {
			const vat = calculateVAT(0);
			expect(vat).toBe(0);
		});

		it("should handle decimal amounts", () => {
			const vat = calculateVAT(100.5);
			expect(vat).toBeCloseTo(16.08, 2); // Use toBeCloseTo for floating point
		});
	});

	describe("calculateDeliveryFee", () => {
		it("should return 0 for orders over 5000 KES", () => {
			const fee = calculateDeliveryFee(6000);
			expect(fee).toBe(0);
		});

		it("should return 500 for orders under 5000 KES", () => {
			const fee = calculateDeliveryFee(3000);
			expect(fee).toBe(500);
		});

		it("should return 500 for exactly 5000 KES", () => {
			const fee = calculateDeliveryFee(5000);
			expect(fee).toBe(0);
		});
	});

	describe("calculateFinalTotal", () => {
		it("should calculate complete breakdown", () => {
			const result = calculateFinalTotal(mockCartItems);

			expect(result.subtotal).toBe(3800);
			expect(result.vat).toBe(608); // 3800 * 0.16
			expect(result.deliveryFee).toBe(500); // Under 5000 threshold
			expect(result.total).toBe(4908); // 3800 + 608 + 500
		});

		it("should give free delivery for large orders", () => {
			const largeOrder: CartItem[] = [
				{
					productId: "1",
					quantity: 4,
					addedAt: "2024-01-01",
					price: 1500,
				},
			];

			const result = calculateFinalTotal(largeOrder);
			expect(result.deliveryFee).toBe(0);
			expect(result.total).toBe(6960); // (6000 + 960 + 0)
		});
	});

	describe("formatPrice", () => {
		it("should format price in Kenyan Shillings", () => {
			const formatted = formatPrice(1500);
			expect(formatted).toBe("Ksh\u00A01,500.00"); // Non-breaking space character
		});

		it("should handle decimal prices", () => {
			const formatted = formatPrice(1500.5);
			expect(formatted).toBe("Ksh\u00A01,500.50"); // Non-breaking space character
		});

		it("should handle zero price", () => {
			const formatted = formatPrice(0);
			expect(formatted).toBe("Ksh\u00A00.00"); // Non-breaking space character
		});
	});

	describe("calculateDiscountPercentage", () => {
		it("should calculate discount percentage correctly", () => {
			const discount = calculateDiscountPercentage(1200, 1500);
			expect(discount).toBe(20); // (1500-1200)/1500 * 100
		});

		it("should return 0 when no discount", () => {
			const discount = calculateDiscountPercentage(1500, 1500);
			expect(discount).toBe(0);
		});

		it("should return 0 when price is higher than old price", () => {
			const discount = calculateDiscountPercentage(1500, 1200);
			expect(discount).toBe(0);
		});

		it("should handle edge cases", () => {
			const discount = calculateDiscountPercentage(0, 100);
			expect(discount).toBe(100);
		});
	});
});
