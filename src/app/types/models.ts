// User document
export interface User {
	userId: string;
	email: string;
	displayName?: string;
	photoURL?: string;
	roleId: string;
	phone?: string;
	bio?: string;
	profileCompleted: boolean;
	status: string;
	createdAt?: string;
	lastLoginAt?: string;
}

// UserRole document
export interface UserRole {
	roleId: string;
	roleName: string;
	description?: string;
	permissions?: string;
	createdAt?: string;
}

// Product document
export interface Product {
	productId: string;
	name: string;
	description?: string;
	price: number;
	imageUrl: string;
	category?: string;
	stock?: number;
	colorName?: string;
	hexColor?: string;
	finish?: string;
	oldPrice?: number;
	createdAt: string;
	updatedAt?: string;
}

// Cart document
export interface Cart {
	cartId: string;
	userId: string;
	createdAt?: string;
	updatedAt?: string;
}

// Cart item
export interface CartItem {
	cartItemId: string;
	cartId: string;
	productId: string;
	quantity: number;
	price?: number;
	name?: string;
	imageUrl?: string;
	addedAt?: string;
}

// Order document
export interface Order {
	orderId: string;
	userId: string;
	cartId?: string;
	total?: number;
	subtotal?: number;
	vat?: number;
	deliveryFee?: number;
	status?: string;
	createdAt?: string;
	shippingAddress?: any;
	deliveryLocation?: string;
	phoneNumber?: string;
	paystackRef?: string;
	items?: OrderItem[];
}

// OrderItem document
export interface OrderItem {
	orderItemId: string;
	orderId: string;
	productId: string;
	quantity: number;
	priceAtPurchase?: number;
	subtotal?: number;
	name?: string;
	imageUrl?: string;
}

// Payment document
export interface Payment {
	paymentId: string;
	orderId: string;
	userId: string;
	amount?: number;
	status?: string;
	method?: string;
	transactionRef?: string;
	createdAt?: string;
	orderStatus?: string; // Status of the associated order
	deliveryLocation?: string; // Delivery location from associated order
}

// RegistrationCode document
export interface RegistrationCode {
	codeId: string;
	userId: string;
	code: string;
	expiresAt: string;
	used?: boolean;
	createdAt?: string;
}

// LoginCode document
export interface LoginCode {
	codeId: string;
	userId: string;
	code: string;
	expiresAt: string;
	used?: boolean;
	createdAt?: string;
}
