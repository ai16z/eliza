// Order status enums
enum OrderStatus {
    NEW = "NEW",
    AWAITING_CUSTOMER_INFO = "AWAITING_CUSTOMER_INFO",
    AWAITING_PAYMENT = "AWAITING_PAYMENT",
    AWAITING_CONFIRMATION = "AWAITING_CONFIRMATION",
    PROCESSING = "PROCESSING",
    CONFIRMED = "CONFIRMED",
    FAILED = "FAILED",
}

interface Order {
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod?: PaymentMethod;
    customer?: Customer;
    items?: OrderItem[];
}

// Order progress tracking
interface OrderProgress {
    hasCustomerInfo: boolean;
    hasPaymentMethod: boolean;
    hasValidPayment: boolean;
    isConfirmed: boolean;
}

// Payment status types
enum PaymentStatus {
    NOT_PROVIDED = "NOT_PROVIDED",
    INVALID = "INVALID",
    VALID = "VALID",
    ON_FILE = "ON_FILE",
    PROCESSED = "PROCESSED",
}

// Payment method interface
interface PaymentMethod {
    type: string;
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    postalCode?: string;
    isValid: boolean;
}

// Customer interface
interface Customer {
    id?: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    paymentMethod?: {
        cardNumber?: string;
        expiryDate?: string;
        cvv?: string;
        postalCode?: string;
    };
    isReturning: boolean;
}

// Pizza size enum
enum PizzaSize {
    SMALL = "SMALL",
    MEDIUM = "MEDIUM",
    LARGE = "LARGE",
    XLARGE = "XLARGE",
}

// Pizza crust enum
enum PizzaCrust {
    HAND_TOSSED = "HAND_TOSSED",
    THIN = "THIN",
    PAN = "PAN",
    GLUTEN_FREE = "GLUTEN_FREE",
    BROOKLYN = "BROOKLYN",
}

// Topping portion enum
enum ToppingPortion {
    LEFT = "LEFT",
    RIGHT = "RIGHT",
    ALL = "ALL",
}

// Pizza topping interface
interface PizzaTopping {
    code: string;
    portion: ToppingPortion;
    amount: number; // 1 for normal, 2 for extra
}

// Order item interface
interface OrderItem {
    productCode: string;
    size: PizzaSize;
    crust: PizzaCrust;
    quantity: number;
    toppings: PizzaTopping[];
    specialInstructions?: string;
}

// Error types
enum ErrorType {
    PAYMENT_FAILED = "PAYMENT_FAILED",
    VALIDATION_FAILED = "VALIDATION_FAILED",
    CUSTOMER_NOT_FOUND = "CUSTOMER_NOT_FOUND",
    SYSTEM_ERROR = "SYSTEM_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
}

// Custom error interface
interface OrderError {
    type: ErrorType;
    message: string;
    code: string;
    details?: any;
}

// Order provider interface
export interface OrderManager {
    storeId: string;
    availability: {
        isStoreOpen: boolean;
        isDeliveryAvailable: boolean;
        isCarryoutAvailable: boolean;
    };
    requiredFields: {
        requiresCustomerName: boolean;
        requiresAddress: boolean;
        requiresPayment: boolean;
        requiresPhone: boolean;
        requiresEmail: boolean;
    };
    paymentConfig: {
        acceptsCash: boolean;
        acceptsCredit: boolean;
        requiresCVV: boolean;
        requiresPostalCode: boolean;
        maxFailedAttempts: number;
    };
}

// Event types for state management
type OrderEvent =
    | { type: "UPDATE_CUSTOMER_INFO"; payload: Partial<Customer> }
    | { type: "ADD_ITEM"; payload: OrderItem }
    | { type: "REMOVE_ITEM"; payload: string }
    | { type: "UPDATE_PAYMENT"; payload: PaymentMethod }
    | { type: "PROCESS_ORDER"; payload: Order }
    | { type: "HANDLE_ERROR"; payload: OrderError };

// Export all types
export {
    OrderStatus,
    PaymentStatus,
    PizzaSize,
    PizzaCrust,
    ToppingPortion,
    ErrorType,
    type OrderProgress,
    type PaymentMethod,
    type Customer,
    type PizzaTopping,
    type OrderItem,
    type Order,
    type OrderError,
    type OrderEvent,
};
