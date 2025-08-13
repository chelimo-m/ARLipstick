// src/app/paystackHandler.ts

export interface PaystackPaymentParams {
	amount: number;
	phoneNumber: string;
	deliveryLocation: string;
	orderItems: Array<{
		productId: string;
		quantity: number;
		priceAtPurchase: number;
		name?: string;
		imageUrl?: string;
	}>;
	user: { email: string };
	idToken: string;
	subtotal: number;
	vat: number;
	deliveryFee: number;
}

// Utility to load Paystack script dynamically
export function loadPaystackScript(): Promise<void> {
	return new Promise((resolve, reject) => {
		if (typeof window === "undefined") return reject("Not in browser");
		if ((window as unknown as { PaystackPop?: unknown })?.PaystackPop)
			return resolve();
		const script = document.createElement("script");
		script.src = "https://js.paystack.co/v1/inline.js";
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => reject("Failed to load Paystack script");
		document.body.appendChild(script);
	});
}

declare global {
	interface Window {
		PaystackPop?: unknown;
	}
}

export async function handlePaystackPayment(
	params: PaystackPaymentParams
): Promise<void> {
	const PAYSTACK_PUBLIC_KEY =
		process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
		process.env.PAYSTACK_PUBLIC_KEY;
	if (!PAYSTACK_PUBLIC_KEY) {
		throw new Error("Paystack public key is not set in environment variables.");
	}
	if (typeof window === "undefined") {
		throw new Error("Paystack can only be used in the browser.");
	}
	await loadPaystackScript();
	if (!(window as unknown as { PaystackPop?: unknown })?.PaystackPop) {
		throw new Error(
			"Paystack SDK not loaded. Make sure the Paystack script is included in your app."
		);
	}
	const email = params.user?.email;
	if (!email) {
		throw new Error("User email is required for payment");
	}
	return new Promise((resolve, reject) => {
		const handler = (
			window.PaystackPop as {
				setup: (config: Record<string, unknown>) => unknown;
			}
		)?.setup({
			key: PAYSTACK_PUBLIC_KEY,
			email,
			amount: params.amount * 100, // Paystack expects amount in kobo
			currency: "KES", // Change to "NGN" if using Naira
			ref: "ARLIPSTICK_" + Date.now(),
			metadata: {
				custom_fields: [
					{
						display_name: "Phone Number",
						variable_name: "phone_number",
						value: params.phoneNumber,
					},
					{
						display_name: "Delivery Location",
						variable_name: "delivery_location",
						value: params.deliveryLocation,
					},
				],
			},
			callback: function (response: { reference: string }) {
				(async () => {
					try {
						const res = await fetch("/api/orders", {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Authorization: `Bearer ${params.idToken}`,
							},
							body: JSON.stringify({
								items: params.orderItems,
								total: params.amount,
								subtotal: params.subtotal,
								vat: params.vat,
								deliveryFee: params.deliveryFee,
								status: "paid",
								createdAt: new Date().toISOString(),
								deliveryLocation: params.deliveryLocation,
								phoneNumber: params.phoneNumber,
								paystackRef: response.reference,
							}),
						});
						if (!res.ok) {
							const data = await res.json();
							throw new Error(
								data.error ||
									data.message ||
									"Failed to create order after payment"
							);
						}
						resolve();
					} catch (err: unknown) {
						reject(err);
					}
				})();
			},
			onClose: function () {
				reject(new Error("Payment window closed"));
			},
		});
		(handler as unknown as { openIframe: () => void })?.openIframe();
	});
}
