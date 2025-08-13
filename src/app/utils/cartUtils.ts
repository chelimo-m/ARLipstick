import { CartItem, Product } from "../types/models";

/**
 * Calculate the total price of cart items
 */
export function calculateCartTotal(items: CartItem[]): number {
	return items.reduce((total, item) => {
		return total + (item.price || 0) * item.quantity;
	}, 0);
}

/**
 * Calculate subtotal before taxes and fees
 */
export function calculateSubtotal(items: CartItem[]): number {
	return calculateCartTotal(items);
}

/**
 * Calculate VAT (16% in Kenya)
 */
export function calculateVAT(subtotal: number): number {
	return subtotal * 0.16;
}

/**
 * Calculate delivery fee based on total
 */
export function calculateDeliveryFee(subtotal: number): number {
	if (subtotal >= 5000) return 0; // Free delivery for orders over 5000 KES
	return 500; // Standard delivery fee
}

/**
 * Calculate final total including VAT and delivery
 */
export function calculateFinalTotal(items: CartItem[]): {
	subtotal: number;
	vat: number;
	deliveryFee: number;
	total: number;
} {
	const subtotal = calculateSubtotal(items);
	const vat = calculateVAT(subtotal);
	const deliveryFee = calculateDeliveryFee(subtotal);
	const total = subtotal + vat + deliveryFee;

	return {
		subtotal,
		vat,
		deliveryFee,
		total,
	};
}

/**
 * Format price in Kenyan Shillings
 */
export function formatPrice(price: number): string {
	return new Intl.NumberFormat("en-KE", {
		style: "currency",
		currency: "KES",
	}).format(price);
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercentage(
	price: number,
	oldPrice: number
): number {
	if (oldPrice <= price) return 0;
	return Math.round(((oldPrice - price) / oldPrice) * 100);
}
