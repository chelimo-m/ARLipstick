describe("User Workflow Tests", () => {
	beforeEach(() => {
		// Visit the home page before each test
		cy.visit("/");
	});

	describe("Product Browsing and Shopping Cart", () => {
		it("should allow users to browse products and add to cart", () => {
			// Navigate to shop page
			cy.get('[data-testid="shop-link"]').click();
			cy.url().should("include", "/shop");

			// Check if products are displayed
			cy.get('[data-testid="product-card"]').should(
				"have.length.greaterThan",
				0
			);

			// Add first product to cart
			cy.get('[data-testid="product-card"]')
				.first()
				.within(() => {
					cy.get('[data-testid="add-to-cart-btn"]').click();
				});

			// Verify cart notification
			cy.get('[data-testid="cart-notification"]').should("be.visible");
			cy.get('[data-testid="cart-count"]').should("contain", "1");
		});

		it("should display product details correctly", () => {
			cy.visit("/shop");

			cy.get('[data-testid="product-card"]')
				.first()
				.within(() => {
					cy.get('[data-testid="product-name"]').should("be.visible");
					cy.get('[data-testid="product-price"]').should("be.visible");
					cy.get('[data-testid="product-image"]').should("be.visible");
					cy.get('[data-testid="product-description"]').should("be.visible");
				});
		});

		it("should handle empty cart state", () => {
			cy.visit("/cart");

			cy.get('[data-testid="empty-cart-message"]').should("be.visible");
			cy.get('[data-testid="continue-shopping-btn"]').should("be.visible");
		});
	});

	describe("AR Try-On Experience", () => {
		it("should request camera permissions for AR try-on", () => {
			cy.visit("/virtual-tryon");

			// Check if camera permission request is shown
			cy.get('[data-testid="camera-permission"]').should("be.visible");

			// Mock camera access
			cy.window().then((win) => {
				cy.stub(win.navigator.mediaDevices, "getUserMedia").resolves();
			});

			cy.get('[data-testid="enable-camera-btn"]').click();

			// Should show camera view
			cy.get('[data-testid="camera-viewport"]').should("be.visible");
		});

		it("should display lipstick color options", () => {
			cy.visit("/virtual-tryon");

			cy.get('[data-testid="color-palette"]').should("be.visible");
			cy.get('[data-testid="color-option"]').should(
				"have.length.greaterThan",
				0
			);
		});

		it("should allow color selection and application", () => {
			cy.visit("/virtual-tryon");

			// Select a color
			cy.get('[data-testid="color-option"]').first().click();

			// Verify color is selected
			cy.get('[data-testid="selected-color"]').should("be.visible");

			// Check if AR overlay is applied
			cy.get('[data-testid="ar-overlay"]').should("be.visible");
		});
	});

	describe("User Authentication", () => {
		it("should allow user login with Google OAuth", () => {
			cy.visit("/login");

			// Check login form is displayed
			cy.get('[data-testid="login-form"]').should("be.visible");

			// Mock Google OAuth
			cy.window().then((win) => {
				cy.stub(win, "open").as("googleAuth");
			});

			cy.get('[data-testid="google-login-btn"]').click();

			// Verify Google OAuth was triggered
			cy.get("@googleAuth").should("have.been.called");
		});

		it("should redirect authenticated users to dashboard", () => {
			// Mock authenticated user
			cy.window().then((win) => {
				win.localStorage.setItem(
					"user",
					JSON.stringify({
						uid: "test-user",
						email: "test@example.com",
					})
				);
			});

			cy.visit("/login");

			// Should redirect to dashboard
			cy.url().should("include", "/dashboard");
		});
	});

	describe("Checkout Process", () => {
		beforeEach(() => {
			// Add items to cart
			cy.visit("/shop");
			cy.get('[data-testid="add-to-cart-btn"]').first().click();
			cy.visit("/cart");
		});

		it("should display cart items and totals", () => {
			cy.get('[data-testid="cart-item"]').should("have.length.greaterThan", 0);
			cy.get('[data-testid="cart-subtotal"]').should("be.visible");
			cy.get('[data-testid="cart-vat"]').should("be.visible");
			cy.get('[data-testid="cart-total"]').should("be.visible");
		});

		it("should allow quantity updates", () => {
			cy.get('[data-testid="quantity-increase"]').first().click();
			cy.get('[data-testid="quantity-decrease"]').first().click();

			// Verify quantity changes are reflected
			cy.get('[data-testid="item-quantity"]').should("contain", "1");
		});

		it("should allow item removal", () => {
			cy.get('[data-testid="remove-item"]').first().click();

			// Verify item is removed
			cy.get('[data-testid="cart-item"]').should("have.length", 0);
		});

		it("should proceed to checkout", () => {
			cy.get('[data-testid="proceed-checkout-btn"]').click();

			// Should navigate to checkout page
			cy.url().should("include", "/checkout");
		});
	});

	describe("Payment Integration", () => {
		it("should display payment options", () => {
			cy.visit("/checkout");

			cy.get('[data-testid="payment-methods"]').should("be.visible");
			cy.get('[data-testid="paystack-option"]').should("be.visible");
		});

		it("should redirect to Paystack for payment", () => {
			cy.visit("/checkout");

			// Mock Paystack redirect
			cy.window().then((win) => {
				cy.stub(win, "open").as("paystackRedirect");
			});

			cy.get('[data-testid="pay-now-btn"]').click();

			// Verify Paystack redirect
			cy.get("@paystackRedirect").should("have.been.called");
		});
	});

	describe("Order Management", () => {
		it("should display order history", () => {
			cy.visit("/dashboard/orders");

			cy.get('[data-testid="order-history"]').should("be.visible");
		});

		it("should show order details", () => {
			cy.visit("/dashboard/orders");

			cy.get('[data-testid="order-item"]').first().click();

			// Should show order details
			cy.get('[data-testid="order-details"]').should("be.visible");
			cy.get('[data-testid="order-status"]').should("be.visible");
		});
	});

	describe("Responsive Design", () => {
		it("should be responsive on mobile devices", () => {
			cy.viewport("iphone-x");
			cy.visit("/");

			// Check mobile menu
			cy.get('[data-testid="mobile-menu"]').should("be.visible");

			// Verify layout adapts
			cy.get('[data-testid="main-content"]').should("be.visible");
		});

		it("should be responsive on tablet devices", () => {
			cy.viewport("ipad-2");
			cy.visit("/");

			// Verify tablet layout
			cy.get('[data-testid="main-content"]').should("be.visible");
		});
	});

	describe("Error Handling", () => {
		it("should handle network errors gracefully", () => {
			// Mock network error
			cy.intercept("GET", "/api/products", { forceNetworkError: true });

			cy.visit("/shop");

			// Should show error message
			cy.get('[data-testid="error-message"]').should("be.visible");
		});

		it("should handle 404 pages", () => {
			cy.visit("/non-existent-page");

			// Should show 404 page
			cy.get('[data-testid="404-page"]').should("be.visible");
		});
	});
});
