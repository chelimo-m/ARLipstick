import { Product, Order } from "../types/models";

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
	if (!email || typeof email !== "string") return false;

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email.trim());
}

/**
 * Validate Kenyan phone number format
 */
export function validatePhone(phone: string): boolean {
	if (!phone || typeof phone !== "string") return false;

	// Remove spaces and dashes
	const cleanPhone = phone.replace(/[\s-]/g, "");

	// Kenyan phone number patterns
	const patterns = [
		/^\+254\d{9}$/, // +254712345678
		/^254\d{9}$/, // 254712345678
		/^0\d{9}$/, // 0712345678
	];

	return patterns.some((pattern) => pattern.test(cleanPhone));
}

/**
 * Validate price (must be non-negative number)
 */
export function validatePrice(price: number): boolean {
	return typeof price === "number" && price >= 0;
}

/**
 * Validate product data
 */
export function validateProductData(product: Partial<Product>): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	// Required fields
	if (
		!product.name ||
		typeof product.name !== "string" ||
		product.name.trim() === ""
	) {
		errors.push("name");
	}

	if (
		product.price === undefined ||
		product.price === null ||
		!validatePrice(product.price)
	) {
		errors.push("price");
	}

	// Optional but if provided, must be valid
	if (product.imageUrl && typeof product.imageUrl === "string") {
		try {
			new URL(product.imageUrl);
		} catch {
			errors.push("imageUrl");
		}
	}

	if (product.oldPrice && !validatePrice(product.oldPrice)) {
		errors.push("oldPrice");
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Validate order data
 */
export function validateOrderData(order: Partial<Order>): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	// Required fields
	if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
		errors.push("items");
	} else {
		// Validate each item
		order.items.forEach((item, index) => {
			if (
				!item.productId ||
				!item.quantity ||
				!validatePrice(item.priceAtPurchase || 0)
			) {
				errors.push(`items[${index}]`);
			}
		});
	}

	if (!validatePrice(order.total || 0)) {
		errors.push("total");
	}

	if (
		!order.deliveryLocation ||
		typeof order.deliveryLocation !== "string" ||
		order.deliveryLocation.trim() === ""
	) {
		errors.push("deliveryLocation");
	}

	if (!order.phoneNumber || !validatePhone(order.phoneNumber)) {
		errors.push("phoneNumber");
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Validate user data
 */
export function validateUserData(user: any): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (!user.email || !validateEmail(user.email)) {
		errors.push("email");
	}

	if (user.phone && !validatePhone(user.phone)) {
		errors.push("phone");
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}
