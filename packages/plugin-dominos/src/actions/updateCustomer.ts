import {
    Action,
    ActionExample,
    composeContext,
    generateObjectV2,
    Handler,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
} from "@ai16z/eliza";
import { Customer, Payment } from "dominos";
import { z } from "zod";
import { PizzaOrderManager } from "../PizzaOrderManager";

// Shared schemas
const CustomerSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z
        .string()
        .regex(/^\d{3}[-.]?\d{3}[-.]?\d{4}$/)
        .optional(),
    email: z.string().email().optional(),
    address: z.string().min(10).optional(),
    paymentMethod: z
        .object({
            cardNumber: z.string().regex(/^\d{16}$/),
            expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/),
            cvv: z.string().regex(/^\d{3,4}$/),
            postalCode: z.string().regex(/^\d{5}$/),
        })
        .optional(),
});

export const handler: Handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State
) => {
    const orderManager = new PizzaOrderManager(runtime);
    const userId = message.userId;

    // Get active order and customer
    const order = await orderManager.getOrder(userId);
    if (!order) {
        return "There is no active order to update customer details for. Please start a new order first.";
    }

    let customer = await orderManager.getCustomer(userId);
    if (!customer) {
        customer = new Customer({});
    }

    // Extract customer details using LLM and schema
    const extractionTemplate = `
Extract customer information from the following conversation. Keep existing information if not mentioned in the update.

Current customer information:
Name: ${customer.name || "Not provided"}
Phone: ${customer.phone || "Not provided"}
Email: ${customer.email || "Not provided"}
Address: ${customer.address || "Not provided"}
Payment: ${customer.paymentMethod ? "Provided" : "Not provided"}

{{recentConversation}}

Provide updated customer information as a JSON object, including only fields that should be changed:
{
    "name": string (optional),
    "phone": string (optional, format: XXX-XXX-XXXX),
    "email": string (optional, valid email),
    "address": string (optional, full delivery address),
    "paymentMethod": {
        "cardNumber": string (16 digits),
        "expiryDate": string (MM/YY),
        "cvv": string (3-4 digits),
        "postalCode": string (5 digits)
    }
}
`;

    const context = composeContext({
        state,
        template: extractionTemplate,
    });

    try {
        const customerUpdates = (await generateObjectV2({
            runtime,
            context,
            modelClass: ModelClass.LARGE,
            schema: CustomerSchema,
        })) as z.infer<typeof CustomerSchema>;

        // Update only provided fields
        if (customerUpdates.name) customer.name = customerUpdates.name;
        if (customerUpdates.phone) customer.phone = customerUpdates.phone;
        if (customerUpdates.email) customer.email = customerUpdates.email;
        if (customerUpdates.address) customer.address = customerUpdates.address;

        // Update the handler logic
        if (customerUpdates.paymentMethod) {
            // Create Dominos Payment object
            const payment = new Payment({
                number: customerUpdates.paymentMethod.cardNumber,
                expiration: customerUpdates.paymentMethod.expiryDate,
                securityCode: customerUpdates.paymentMethod.cvv,
                postalCode: customerUpdates.paymentMethod.postalCode,
                amount: order.amountsBreakdown.customer,
            });

            // Clear existing payments and add new one
            order.payments = [payment];

            // Update customer payment method
            customer.paymentMethod = customerUpdates.paymentMethod;
        }

        await orderManager.saveCustomer(userId, customer);

        // Process updated order
        const processedOrder = await orderManager.processOrder(order, customer);
        if (!("type" in processedOrder)) {
            await orderManager.saveOrder(userId, processedOrder);
        }

        let response = "I've updated your customer information.\n\n";
        response += orderManager.getOrderSummary(order, customer);
        response +=
            "\n" + orderManager.getNextRequiredActionDialogue(order, customer);

        return response;
    } catch (error) {
        return "I couldn't understand the customer information provided. Please try again with clearer details.";
    }
};

export const updateCustomer: Action = {
    name: "UPDATE_CUSTOMER",
    description: "Updates customer information based on the message text.",
    similes: [
        "UPDATE_CUSTOMER_DETAILS",
        "UPDATE_CUSTOMER_INFO",
        "SET_CUSTOMER",
        "CHANGE_CUSTOMER_INFO",
        "MODIFY_CUSTOMER",
    ],
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "My name is John Smith, phone number is 555-123-4567",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Thanks John, I've updated your contact information. Here's your updated order summary...",
                    action: "UPDATE_CUSTOMER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Deliver to 123 Main Street, Apt 4B, New York, NY 10001",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I've updated your delivery address. Here's your updated order summary...",
                    action: "UPDATE_CUSTOMER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "My email is john.smith@email.com",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I've added your email address. Here's your updated order summary...",
                    action: "UPDATE_CUSTOMER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Change my phone number to 555-987-6543",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I've updated your phone number. Here's your updated order summary...",
                    action: "UPDATE_CUSTOMER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Update my info - Sarah Johnson, sarah.j@email.com, 555-555-5555, 456 Oak Ave, Chicago IL 60601",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Thanks Sarah, I've updated all your customer information. Here's your updated order summary...",
                    action: "UPDATE_CUSTOMER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Need to change my address to 789 Pine Street, Suite 301, Boston MA 02108",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I've updated your delivery address. Here's your updated order summary...",
                    action: "UPDATE_CUSTOMER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you update my contact details? Name: Mike Wilson, Phone: 555-111-2222",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I've updated your name and phone number, Mike. Here's your updated order summary...",
                    action: "UPDATE_CUSTOMER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Change everything to: Alex Lee, alex@email.com, 555-333-4444, 321 Maple Drive, Austin TX 78701",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Thanks Alex, I've updated all your customer information. Here's your updated order summary...",
                    action: "UPDATE_CUSTOMER",
                },
            },
        ],
    ] as ActionExample[][],
    handler,
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const orderManager = new PizzaOrderManager(runtime);
        const userId = message.userId;

        // Check if there is an active order
        const existingOrder = await orderManager.getOrder(userId);

        // Only validate if there is an active order
        return !!existingOrder;
    },
};
