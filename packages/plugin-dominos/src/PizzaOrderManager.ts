import { IAgentRuntime, UUID } from "@ai16z/eliza";
import { NearbyStores, Order } from "dominos";
import {
    Customer,
    ErrorType,
    OrderError,
    OrderItem,
    OrderManager,
    OrderProgress,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    PizzaCrust,
    PizzaSize,
    PizzaTopping,
    ToppingPortion,
} from "./types";

export class PizzaOrderManager implements OrderManager {
    storeId: string;

    // System state
    availability = {
        isStoreOpen: true,
        isDeliveryAvailable: true,
        isCarryoutAvailable: true,
    };

    // Required field configuration
    requiredFields = {
        requiresCustomerName: true,
        requiresAddress: true,
        requiresPayment: true,
        requiresPhone: true,
        requiresEmail: true,
    };

    // Payment configuration
    paymentConfig = {
        acceptsCash: false,
        acceptsCredit: true,
        requiresCVV: true,
        requiresPostalCode: true,
        maxFailedAttempts: 3,
    };

    // Menu configuration
    private readonly menuConfig = {
        defaultProductCode: "PIZZA",
        basePrices: {
            [PizzaSize.SMALL]: 9.99,
            [PizzaSize.MEDIUM]: 11.99,
            [PizzaSize.LARGE]: 13.99,
            [PizzaSize.XLARGE]: 15.99,
        },
        crustPrices: {
            [PizzaCrust.HAND_TOSSED]: 0,
            [PizzaCrust.THIN]: 0,
            [PizzaCrust.PAN]: 1.0,
            [PizzaCrust.GLUTEN_FREE]: 2.5,
            [PizzaCrust.BROOKLYN]: 1.5,
        },
        toppingPrices: {
            STANDARD: 1.5,
            PREMIUM: 2.5,
            SPECIALTY: 3.5,
        },
        toppingCategories: {
            STANDARD: [
                "PEPPERONI",
                "MUSHROOMS",
                "ONIONS",
                "GREEN_PEPPERS",
                "BLACK_OLIVES",
                "TOMATOES",
            ],
            PREMIUM: [
                "ITALIAN_SAUSAGE",
                "BACON",
                "EXTRA_CHEESE",
                "GROUND_BEEF",
                "HAM",
                "PINEAPPLE",
                "JALAPENOS",
            ],
            SPECIALTY: [
                "GRILLED_CHICKEN",
                "PHILLY_STEAK",
                "FETA_CHEESE",
                "SPINACH",
                "ANCHOVIES",
                "ARTICHOKE_HEARTS",
            ],
        },
        availableToppings: {
            // Standard Toppings
            PEPPERONI: "Pepperoni",
            MUSHROOMS: "Fresh Mushrooms",
            ONIONS: "Fresh Onions",
            GREEN_PEPPERS: "Green Peppers",
            BLACK_OLIVES: "Black Olives",
            TOMATOES: "Diced Tomatoes",

            // Premium Toppings
            ITALIAN_SAUSAGE: "Italian Sausage",
            BACON: "Applewood Smoked Bacon",
            EXTRA_CHEESE: "Extra Cheese Blend",
            GROUND_BEEF: "Seasoned Ground Beef",
            HAM: "Premium Ham",
            PINEAPPLE: "Sweet Pineapple",
            JALAPENOS: "Fresh Jalapeños",

            // Specialty Toppings
            GRILLED_CHICKEN: "Grilled Chicken Breast",
            PHILLY_STEAK: "Premium Philly Steak",
            FETA_CHEESE: "Feta Cheese",
            SPINACH: "Fresh Baby Spinach",
            ANCHOVIES: "Premium Anchovies",
            ARTICHOKE_HEARTS: "Artichoke Hearts",
        },
        specialCombos: {
            MEAT_LOVERS: {
                name: "Meat Lovers",
                discount: 2.0,
                requiredToppings: [
                    "PEPPERONI",
                    "ITALIAN_SAUSAGE",
                    "BACON",
                    "HAM",
                ],
            },
            VEGGIE_SUPREME: {
                name: "Veggie Supreme",
                discount: 2.0,
                requiredToppings: [
                    "MUSHROOMS",
                    "GREEN_PEPPERS",
                    "ONIONS",
                    "BLACK_OLIVES",
                    "TOMATOES",
                ],
            },
            HAWAIIAN: {
                name: "Hawaiian",
                discount: 1.5,
                requiredToppings: ["HAM", "PINEAPPLE"],
            },
            SUPREME: {
                name: "Supreme",
                discount: 3.0,
                requiredToppings: [
                    "PEPPERONI",
                    "ITALIAN_SAUSAGE",
                    "MUSHROOMS",
                    "ONIONS",
                    "GREEN_PEPPERS",
                ],
            },
        },
        incompatibleToppings: [
            ["ANCHOVIES", "CHICKEN"], // Example of toppings that don't go well together
            ["PINEAPPLE", "ANCHOVIES"],
            ["ARTICHOKE_HEARTS", "GROUND_BEEF"],
        ],
    };

    constructor(private runtime: IAgentRuntime) {
        this.runtime = runtime;
    }

    async getNearestStoreId(address: string): Promise<string> {
        try {
            const nearbyStores = await new NearbyStores(address);

            if (nearbyStores.stores.length === 0) {
                throw new Error("No nearby stores found.");
            }

            let nearestStore: any = null;
            let minDistance = Infinity;

            for (const store of nearbyStores.stores) {
                if (
                    store.IsOnlineCapable &&
                    store.IsDeliveryStore &&
                    store.IsOpen &&
                    store.ServiceIsOpen.Delivery &&
                    store.MinDistance < minDistance
                ) {
                    minDistance = store.MinDistance;
                    nearestStore = store;
                }
            }

            if (!nearestStore) {
                throw new Error("No open stores found for delivery.");
            }

            return nearestStore.StoreID;
        } catch (error) {
            console.error("Error finding nearest store:", error);
            throw error;
        }
    }

    async getOrder(userId: UUID): Promise<Order | null> {
        const cachedOrder = await this.runtime.cacheManager.get<Order>(
            `pizza-order-${userId}`
        );
        return cachedOrder || null;
    }

    async saveOrder(userId: UUID, order: Order): Promise<void> {
        await this.runtime.cacheManager.set(`pizza-order-${userId}`, order);
    }

    async getCustomer(userId: UUID): Promise<Customer | null> {
        const customer = this.runtime.cacheManager.get<Customer>(
            `pizza-customer-${userId}`
        );
        return customer || null;
    }

    async saveCustomer(userId: UUID, customer: Customer): Promise<void> {
        await this.runtime.cacheManager.set(
            `pizza-customer-${userId}`,
            customer
        );
    }

    getNextRequiredAction(order: Order, customer: Customer): string {
        if (!order.items || order.items.length === 0) {
            return "Collect initial pizza order details";
        }

        if (!customer.name) {
            return "Request customer name";
        }

        if (!customer.phone) {
            return "Request customer phone number";
        }

        if (!customer.address) {
            return "Request delivery address";
        }

        if (!customer.email) {
            return "Request email for order confirmation";
        }

        if (!customer.paymentMethod) {
            return "Request credit card information for payment";
        }

        if (!order.progress.isConfirmed) {
            return "Review order details with customer and obtain final confirmation";
        }

        return "Provide order confirmation number and estimated delivery time";
    }

    getNextRequiredActionDialogue(order: Order, customer: Customer): string {
        if (!order.items || order.items.length === 0) {
            return "Let me help you build your perfect pizza! What size would you like?";
        }

        if (!customer.name) {
            return "Could you please tell me your name for the order?";
        }

        if (!customer.phone) {
            return "What phone number can we reach you at if needed?";
        }

        if (!customer.address) {
            return "Where would you like your pizza delivered?";
        }

        if (!customer.email) {
            return "What email address should we send your order confirmation to?";
        }

        if (!customer.paymentMethod) {
            return "To complete your order, I'll need your credit card information. Could you please provide your card number, expiration date (MM/YY), CVV, and billing zip code?";
        }

        if (!order.progress.isConfirmed) {
            return "Great! I have all your information. Would you like me to review everything before placing your order?";
        }

        return "Your order is confirmed! Let me get your confirmation number and estimated delivery time.";
    }

    // Get topping category and price
    private getToppingInfo(toppingCode: string): {
        category: string;
        price: number;
    } {
        if (this.menuConfig.toppingCategories.STANDARD.includes(toppingCode)) {
            return {
                category: "STANDARD",
                price: this.menuConfig.toppingPrices.STANDARD,
            };
        }
        if (this.menuConfig.toppingCategories.PREMIUM.includes(toppingCode)) {
            return {
                category: "PREMIUM",
                price: this.menuConfig.toppingPrices.PREMIUM,
            };
        }
        if (this.menuConfig.toppingCategories.SPECIALTY.includes(toppingCode)) {
            return {
                category: "SPECIALTY",
                price: this.menuConfig.toppingPrices.SPECIALTY,
            };
        }
        throw new Error(`Invalid topping code: ${toppingCode}`);
    }

    // Check for special combinations
    private checkSpecialCombos(toppings: PizzaTopping[]): number {
        const toppingCodes = toppings.map((t) => t.code);
        let maxDiscount = 0;

        for (const [_, combo] of Object.entries(
            this.menuConfig.specialCombos
        )) {
            if (combo.requiredToppings.every((t) => toppingCodes.includes(t))) {
                maxDiscount = Math.max(maxDiscount, combo.discount);
            }
        }

        return maxDiscount;
    }

    // Format currency
    private formatCurrency(amount: number): string {
        return `$${amount?.toFixed(2) || "?"}`;
    }

    // Format topping for display with category
    private formatTopping(topping: PizzaTopping): string {
        const toppingInfo = this.getToppingInfo(topping.code);
        const amount = topping.amount > 1 ? "Extra " : "";
        const portion =
            topping.portion === ToppingPortion.ALL
                ? "Whole Pizza"
                : `${topping.portion} Half`;
        const category =
            toppingInfo.category.charAt(0) +
            toppingInfo.category.slice(1).toLowerCase();

        return (
            `${amount}${this.menuConfig.availableToppings[topping.code]} ` +
            `(${portion}) - ${category} Topping`
        );
    }

    // Generate detailed order summary
    getOrderSummary(order: Order, customer: Customer): string {
        console.log("getOrderSummary: ", order, customer);
        let summary = "===== CURRENT ORDER =====\n\n";

        // Add items
        order.items?.forEach((item, index) => {
            summary += `PIZZA ${index + 1}\n`;
            summary += `==================\n`;
            summary += `Size: ${item.size} (${this.formatCurrency(this.menuConfig.basePrices[item.size])})\n`;
            summary += `Crust: ${item.crust.replace("_", " ")}`;

            const crustPrice = this.menuConfig.crustPrices[item.crust];
            if (crustPrice > 0) {
                summary += ` (+${this.formatCurrency(crustPrice)})\n`;
            } else {
                summary += "\n";
            }

            if (item.toppings && item.toppings.length > 0) {
                summary += "\nTOPPINGS:\n";
                item.toppings?.forEach((topping) => {
                    const toppingInfo = this.getToppingInfo(topping.code);
                    summary += `• ${this.formatTopping(topping)} `;
                    summary += `(+${this.formatCurrency(
                        toppingInfo.price *
                            topping.amount *
                            (topping.portion === ToppingPortion.ALL ? 1 : 0.5)
                    )})\n`;
                });

                const comboDiscount = this.checkSpecialCombos(item.toppings);
                if (comboDiscount > 0) {
                    summary += `\nSpecial Combination Discount: -${this.formatCurrency(comboDiscount)}\n`;
                }
            } else {
                summary += "\nClassic Cheese Pizza (No extra toppings)\n";
            }

            if (item.specialInstructions) {
                summary += `\nSpecial Instructions:\n${item.specialInstructions}\n`;
            }

            summary += `\nItem Total: ${this.formatCurrency(this.calculatePizzaPrice(item))}\n`;
            summary += "==================\n\n";
        });

        // Add customer info if available
        if (customer) {
            summary += "CUSTOMER INFORMATION\n";
            summary += "==================\n";
            if (customer.name) summary += `Name: ${customer.name}\n`;
            if (customer.phone) summary += `Phone: ${customer.phone}\n`;
            if (customer.address) {
                summary += "Delivery Address:\n";
                summary += `${(customer?.address && JSON.stringify(customer.address)) || "Not provided"}\n`;
            }
            if (customer.email) summary += `Email: ${customer.email}\n`;
            summary += "==================\n\n";
        }

        // Add payment info if available
        if (order.paymentMethod) {
            summary += "PAYMENT INFORMATION\n";
            summary += "==================\n";
            summary += `Card: ****${order.paymentMethod.cardNumber.slice(-4)}\n`;
            summary += `Status: ${order.paymentStatus}\n`;
            summary += "==================\n\n";
        }

        // Add order totals
        summary += "ORDER TOTALS\n";
        summary += "==================\n";
        summary += `Subtotal: ${this.formatCurrency(order.total)}\n`;
        const tax = order.total * 0.08; // Example tax rate
        summary += `Tax (8%): ${this.formatCurrency(tax)}\n`;
        const deliveryFee = 3.99;
        summary += `Delivery Fee: ${this.formatCurrency(deliveryFee)}\n`;
        summary += `Total: ${this.formatCurrency(order.total + tax + deliveryFee)}\n`;
        summary += "==================\n";

        return summary;
    }

    // Validate pizza toppings
    private validateToppings(toppings: PizzaTopping[]): OrderError | null {
        for (const topping of toppings) {
            // Check if topping code exists
            if (!this.menuConfig.availableToppings[topping.code]) {
                return {
                    type: ErrorType.VALIDATION_FAILED,
                    message: `Invalid topping code: ${topping.code}`,
                    code: "INVALID_TOPPING",
                };
            }

            // Check if portion is valid
            if (!Object.values(ToppingPortion).includes(topping.portion)) {
                return {
                    type: ErrorType.VALIDATION_FAILED,
                    message: `Invalid topping portion: ${topping.portion}`,
                    code: "INVALID_PORTION",
                };
            }

            // Check if amount is valid (1 for normal, 2 for extra)
            if (topping.amount !== 1 && topping.amount !== 2) {
                return {
                    type: ErrorType.VALIDATION_FAILED,
                    message: "Topping amount must be 1 (normal) or 2 (extra)",
                    code: "INVALID_AMOUNT",
                };
            }
        }

        // Check maximum number of toppings
        if (toppings.length > 10) {
            return {
                type: ErrorType.VALIDATION_FAILED,
                message: "Maximum of 10 toppings per pizza",
                code: "TOO_MANY_TOPPINGS",
            };
        }

        return null;
    }

    // Calculate pizza price including toppings and discounts
    private calculatePizzaPrice(item: OrderItem): number {
        let price =
            this.menuConfig.basePrices[item.size] ||
            this.menuConfig.basePrices[PizzaSize.MEDIUM];

        // Add crust price
        price += this.menuConfig.crustPrices[item.crust] || 0;

        // Calculate topping prices (continuing calculatePizzaPrice)
        if (item.toppings) {
            for (const topping of item.toppings) {
                const toppingInfo = this.getToppingInfo(topping.code);
                const portionMultiplier =
                    topping.portion === ToppingPortion.ALL ? 1 : 0.5;
                price += toppingInfo.price * topping.amount * portionMultiplier;
            }

            // Apply combo discounts
            const comboDiscount = this.checkSpecialCombos(item.toppings);
            price -= comboDiscount;
        }

        return price * item.quantity;
    }

    // Validate customer information
    private validateCustomerInfo(customer: Customer): OrderError | null {
        const phoneRegex = /^\d{3}[-.]?\d{3}[-.]?\d{4}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const nameRegex = /^[a-zA-Z0-9\s'-]{2,50}$/;

        if (!customer.name || !nameRegex.test(customer.name)) {
            return {
                type: ErrorType.VALIDATION_FAILED,
                message: "Please provide a valid name (2-50 characters)",
                code: "INVALID_NAME",
            };
        }

        if (!customer.phone || !phoneRegex.test(customer.phone)) {
            return {
                type: ErrorType.VALIDATION_FAILED,
                message: "Please provide a valid 10-digit phone number",
                code: "INVALID_PHONE",
            };
        }

        if (!customer.email || !emailRegex.test(customer.email)) {
            return {
                type: ErrorType.VALIDATION_FAILED,
                message: "Please provide a valid email address",
                code: "INVALID_EMAIL",
            };
        }

        if (!customer.address || customer.address.length < 10) {
            return {
                type: ErrorType.VALIDATION_FAILED,
                message: "Please provide a complete delivery address",
                code: "INVALID_ADDRESS",
            };
        }

        return null;
    }

    // Validate payment method
    private validatePaymentMethod(payment: PaymentMethod): OrderError | null {
        const cardNumberRegex = /^\d{16}$/;
        const cvvRegex = /^\d{3,4}$/;
        const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
        const postalRegex = /^\d{5}(-\d{4})?$/;

        if (!payment.cardNumber || !cardNumberRegex.test(payment.cardNumber)) {
            return {
                type: ErrorType.PAYMENT_FAILED,
                message: "Please provide a valid 16-digit credit card number",
                code: "INVALID_CARD_NUMBER",
            };
        }

        if (!payment.expiryDate || !expiryRegex.test(payment.expiryDate)) {
            return {
                type: ErrorType.PAYMENT_FAILED,
                message: "Please provide a valid expiration date (MM/YY)",
                code: "INVALID_EXPIRY",
            };
        }

        // Check if card is expired
        if (payment.expiryDate) {
            const [month, year] = payment.expiryDate.split("/");
            const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
            if (expiry < new Date()) {
                return {
                    type: ErrorType.PAYMENT_FAILED,
                    message: "The card has expired",
                    code: "CARD_EXPIRED",
                };
            }
        }

        if (!payment.cvv || !cvvRegex.test(payment.cvv)) {
            return {
                type: ErrorType.PAYMENT_FAILED,
                message: "Please provide a valid CVV (3-4 digits)",
                code: "INVALID_CVV",
            };
        }

        if (
            this.paymentConfig.requiresPostalCode &&
            (!payment.postalCode || !postalRegex.test(payment.postalCode))
        ) {
            return {
                type: ErrorType.PAYMENT_FAILED,
                message: "Please provide a valid postal code",
                code: "INVALID_POSTAL",
            };
        }

        return null;
    }

    // Calculate order progress
    calculateOrderProgress(order: Order, customer: Customer): OrderProgress {
        return {
            hasCustomerInfo: Boolean(
                customer.name &&
                    customer.phone &&
                    customer.email &&
                    customer.address
            ),
            hasPaymentMethod: Boolean(customer.paymentMethod),
            hasValidPayment: Boolean(
                customer.paymentMethod && order.payments?.[0]?.isValid
            ),
            isConfirmed: order.status === OrderStatus.CONFIRMED,
        };
    }

    // Process the order
    async processOrder(
        order: Order,
        customer: Customer
    ): Promise<Order | OrderError> {
        // Validate pizza configuration
        if (order && order.items) {
            for (const item of order.items) {
                // Validate size
                if (!Object.values(PizzaSize).includes(item.size)) {
                    return {
                        type: ErrorType.VALIDATION_FAILED,
                        message: `Invalid pizza size: ${item.size}`,
                        code: "INVALID_SIZE",
                    };
                }

                // Validate crust
                if (!Object.values(PizzaCrust).includes(item.crust)) {
                    return {
                        type: ErrorType.VALIDATION_FAILED,
                        message: `Invalid crust type: ${item.crust}`,
                        code: "INVALID_CRUST",
                    };
                }

                // Validate toppings
                if (item.toppings) {
                    const toppingError = this.validateToppings(item.toppings);
                    if (toppingError) return toppingError;
                }

                // Validate quantity
                if (item.quantity < 1 || item.quantity > 10) {
                    return {
                        type: ErrorType.VALIDATION_FAILED,
                        message: "Quantity must be between 1 and 10",
                        code: "INVALID_QUANTITY",
                    };
                }
            }
        } else {
            console.warn("No order items found");
        }

        // Calculate total price
        if (order.items) {
            order.total = order.items?.reduce(
                (total, item) => total + this.calculatePizzaPrice(item),
                0
            );
        } else {
            console.warn("No order items found");
        }

        // Validate customer information
        const customerError = this.validateCustomerInfo(customer);
        if (customerError) return customerError;

        // Validate payment if provided
        if (order.paymentMethod) {
            const paymentError = this.validatePaymentMethod(
                order.paymentMethod
            );
            if (paymentError) {
                order.paymentStatus = PaymentStatus.INVALID;
                return paymentError;
            }
            order.paymentStatus = PaymentStatus.VALID;
        }

        // Update order progress
        order.progress = this.calculateOrderProgress(order, customer);

        // Update order status based on current state
        if (order.progress) {
            if (!order.progress.hasCustomerInfo) {
                order.status = OrderStatus.AWAITING_CUSTOMER_INFO;
            } else if (!order.progress.hasValidPayment) {
                order.status = OrderStatus.AWAITING_PAYMENT;
            } else if (!order.progress.isConfirmed) {
                order.status = OrderStatus.PROCESSING;
            } else {
                order.status = OrderStatus.CONFIRMED;
            }
        }

        return order;
    }
}
