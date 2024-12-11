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
import { Item } from "dominos";
import { PizzaCrust, PizzaSize, ToppingPortion } from "../types";

import { z } from "zod";
import { PizzaOrderManager } from "../PizzaOrderManager";

const ModificationSchema = z.object({
    type: z.enum([
        "UPDATE_SIZE",
        "UPDATE_CRUST",
        "ADD_TOPPING",
        "REMOVE_TOPPING",
        "ADD_PIZZA",
        "UPDATE_QUANTITY",
        "UPDATE_INSTRUCTIONS",
    ]),
    itemIndex: z.number().int().min(0),
    data: z.object({
        size: z.enum(["SMALL", "MEDIUM", "LARGE", "XLARGE"]).optional(),
        crust: z
            .enum(["HAND_TOSSED", "THIN", "PAN", "GLUTEN_FREE", "BROOKLYN"])
            .optional(),
        topping: z
            .object({
                code: z.string(),
                portion: z.enum(["LEFT", "RIGHT", "ALL"]),
                amount: z.union([z.literal(1), z.literal(2)]),
            })
            .optional(),
        quantity: z.number().int().positive().optional(),
        specialInstructions: z.string().optional(),
        newPizza: z
            .object({
                size: z.enum(["SMALL", "MEDIUM", "LARGE", "XLARGE"]),
                crust: z.enum([
                    "HAND_TOSSED",
                    "THIN",
                    "PAN",
                    "GLUTEN_FREE",
                    "BROOKLYN",
                ]),
                toppings: z
                    .array(
                        z.object({
                            code: z.string(),
                            portion: z.enum(["LEFT", "RIGHT", "ALL"]),
                            amount: z.union([z.literal(1), z.literal(2)]),
                        })
                    )
                    .optional(),
                quantity: z.number().int().positive(),
                specialInstructions: z.string().optional(),
            })
            .optional(),
    }),
});

type OrderModifications = {
    modifications: z.infer<typeof ModificationSchema>[];
};

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
        return "There is no active order to update. Please start a new order first.";
    }

    const customer = await orderManager.getCustomer(userId);
    if (!customer) {
        return "Customer details not found. Please provide customer information first.";
    }

    // Extract order modifications using LLM and schema
    const extractionTemplate = `
    Extract pizza order modifications from the conversation. Consider all types of changes:
    - Size changes
    - Crust changes
    - Adding/removing toppings
    - Quantity changes
    - Special instructions
    - Adding new pizzas

    Current order:
    ${orderManager.getOrderSummary(order, customer)}

    {{recentConversation}}

    Provide the modifications as an array of change operations:
    {
        "modifications": [{
            "type": "UPDATE_SIZE" | "UPDATE_CRUST" | "ADD_TOPPING" | "REMOVE_TOPPING" | "ADD_PIZZA" | "UPDATE_QUANTITY" | "UPDATE_INSTRUCTIONS",
            "itemIndex": number,
            "data": {
                // For size updates
                "size": string,
                // For crust updates
                "crust": string,
                // For topping changes
                "topping": {
                    "code": string,
                    "portion": "LEFT" | "RIGHT" | "ALL",
                    "amount": 1 | 2
                },
                // For quantity updates
                "quantity": number,
                // For special instructions
                "specialInstructions": string,
                // For new pizzas
                "newPizza": {
                    "size": string,
                    "crust": string,
                    "toppings": array,
                    "quantity": number,
                    "specialInstructions": string
                }
            }
        }]
    }
    `;

    const context = composeContext({
        state,
        template: extractionTemplate,
    });

    try {
        const orderUpdates = (await generateObjectV2({
            runtime,
            context,
            modelClass: ModelClass.LARGE,
            schema: z.object({
                modifications: z.array(ModificationSchema),
            }),
        })) as unknown as OrderModifications;

        // Apply modifications
        for (const mod of orderUpdates.modifications) {
            const item = order.items && order.items[mod.itemIndex];
            if (!item) continue;

            switch (mod.type) {
                case "UPDATE_SIZE":
                    if (mod.data.size) item.size = mod.data.size as PizzaSize;
                    break;

                case "UPDATE_CRUST":
                    if (mod.data.crust)
                        item.crust = mod.data.crust as PizzaCrust;
                    break;

                case "ADD_TOPPING":
                    if (mod.data.topping) {
                        if (!item.toppings) item.toppings = [];
                        item.toppings.push({
                            code: mod.data.topping.code,
                            portion: mod.data.topping.portion as ToppingPortion,
                            amount: mod.data.topping.amount,
                        });
                    }
                    break;

                case "REMOVE_TOPPING":
                    if (mod.data.topping && item.toppings) {
                        item.toppings = item.toppings.filter(
                            (t) =>
                                t.code !== mod.data.topping.code ||
                                t.portion !== mod.data.topping.portion
                        );
                    }
                    break;

                case "ADD_PIZZA":
                    if (mod.data.newPizza) {
                        const newItem = new Item({
                            code: "PIZZA",
                            size: mod.data.newPizza.size as PizzaSize,
                            crust: mod.data.newPizza.crust as PizzaCrust,
                            toppings:
                                mod.data.newPizza.toppings?.map((t) => ({
                                    ...t,
                                    portion: t.portion as ToppingPortion,
                                })) || [],
                            quantity: mod.data.newPizza.quantity,
                            specialInstructions:
                                mod.data.newPizza.specialInstructions,
                        });
                        order.addItem(newItem);
                    }
                    break;

                case "UPDATE_QUANTITY":
                    if (mod.data.quantity) item.quantity = mod.data.quantity;
                    break;

                case "UPDATE_INSTRUCTIONS":
                    if (mod.data.specialInstructions) {
                        item.specialInstructions = mod.data.specialInstructions;
                    }
                    break;
            }
        }

        // Process updated order
        const processedOrder = await orderManager.processOrder(order, customer);
        if (!("type" in processedOrder)) {
            await orderManager.saveOrder(userId, processedOrder);
        }

        let response = "I've updated your order.\n\n";
        response += orderManager.getOrderSummary(order, customer);
        response +=
            "\n" + orderManager.getNextRequiredActionDialogue(order, customer);

        return response;
    } catch (error) {
        return "I couldn't understand the requested changes. Please try again with clearer modifications.";
    }
};

export const updateOrder: Action = {
    name: "UPDATE_ORDER",
    description: "Updates an existing pizza order with new order details.",
    similes: ["MODIFY_ORDER", "CHANGE_ORDER", "SET_ORDER"],
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you make that a large pizza instead of medium?",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I've updated your pizza size to Large. Here's your updated order summary...",
                    action: "UPDATE_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Add extra cheese to my pizza",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I've added extra cheese to your pizza. Here's your updated order summary...",
                    action: "UPDATE_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Change the crust to thin crust please",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I've changed your crust to Thin Crust. Here's your updated order summary...",
                    action: "UPDATE_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Add pepperoni to the whole pizza",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I've added pepperoni to your pizza. Here's your updated order summary...",
                    action: "UPDATE_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can I get mushrooms on half of it?",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I've added mushrooms to half of your pizza. Here's your updated order summary...",
                    action: "UPDATE_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Make it a gluten free crust",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I've updated your crust to Gluten Free. Note that there's a $2.50 upcharge for gluten-free crust. Here's your updated order summary...",
                    action: "UPDATE_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Add another pizza to my order - medium with pepperoni",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I've added a Medium Pepperoni Pizza to your order. Here's your updated order summary...",
                    action: "UPDATE_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you make it well done?",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I've added a special instruction for well-done cooking. Here's your updated order summary...",
                    action: "UPDATE_ORDER",
                },
            },
        ],
    ] as ActionExample[][],
    handler: async (runtime: IAgentRuntime, message: Memory) => {
        const orderManager = new PizzaOrderManager(runtime);
        const userId = message.userId;

        // Get the active order
        const order = await orderManager.getOrder(userId);
        if (!order) {
            return "There is no active order to update. Please start a new order first.";
        }

        // Get the customer details
        const customer = await orderManager.getCustomer(userId);
        if (!customer) {
            return "Customer details not found. Please provide customer information.";
        }

        // TODO: Update order details based on user input
        // This could include adding/removing items, updating customer info, etc.

        // Validate and process the updated order
        const processedOrder = await orderManager.processOrder(order, customer);
        if (!("type" in processedOrder)) {
            await orderManager.saveOrder(userId, processedOrder);
            await orderManager.saveCustomer(userId, customer);
        }

        // Provide updated order summary and prompt for next action
        let response = "Your order has been updated.\n\n";
        response += orderManager.getOrderSummary(order, customer);

        response += orderManager.getNextRequiredActionDialogue(order, customer);

        return response;
    },
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const orderManager = new PizzaOrderManager(runtime);
        const userId = message.userId;

        // Check if there is an active order
        const existingOrder = await orderManager.getOrder(userId);

        // Only validate if there is an active order
        return !!existingOrder;
    },
};
