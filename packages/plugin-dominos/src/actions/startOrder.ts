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
import { Customer, Item, Order } from "dominos";
import { PizzaCrust, PizzaSize } from "../types";

import { z } from "zod";
import { PizzaOrderManager } from "../PizzaOrderManager";

const handler: Handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State
) => {
    const orderManager = new PizzaOrderManager(runtime);
    const userId = message.userId;

    // Check for existing order
    const existingOrder = await orderManager.getOrder(userId);
    if (existingOrder) {
        return "There is already an active order. Please complete or cancel the existing order before starting a new one.";
    }

    console.log("Existing order: ", existingOrder);

    // Extract order details from message using LLM
    const extractionTemplate = `
      Extract pizza order details from the following text. Include size, crust type, toppings, quantity, and any special instructions.
      If information is missing, use default values: medium size, hand tossed crust, no toppings, quantity 1.

      {{recentConversation}}

      Format the response as a JSON object with these fields:
      {
        "size": "SMALL"|"MEDIUM"|"LARGE"|"XLARGE",
        "crust": "HAND_TOSSED"|"THIN"|"PAN"|"GLUTEN_FREE"|"BROOKLYN",
        "toppings": [{"code": string, "portion": "LEFT"|"RIGHT"|"ALL", "amount": 1|2}],
        "quantity": number,
        "specialInstructions": string
      }
    `;

    const context = composeContext({
        state,
        template: extractionTemplate,
    });

    const PizzaOrderSchema = z.object({
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
    });

    try {
        const orderDetails = (await generateObjectV2({
            runtime,
            context,
            modelClass: ModelClass.LARGE,
            schema: PizzaOrderSchema,
        })) as z.infer<typeof PizzaOrderSchema>;

        // Create new order
        const customer = new Customer({});
        await orderManager.saveCustomer(userId, customer);

        const order = new Order(customer);

        // Add extracted item
        const item = new Item({
            code: "PIZZA",
            size: orderDetails.size,
            crust: orderDetails.crust,
            toppings: orderDetails.toppings || [],
            quantity: orderDetails.quantity,
            specialInstructions: orderDetails.specialInstructions,
        });

        order.addItem(item);
        await orderManager.saveOrder(userId, order);

        // Generate response
        let response = "Great! I've started a new pizza order for you.\n\n";
        response += orderManager.getOrderSummary(order, customer);
        response +=
            "\n" + orderManager.getNextRequiredActionDialogue(order, customer);

        return response;
    } catch (error) {
        // Fallback to basic order if extraction fails
        const customer = new Customer({});
        await orderManager.saveCustomer(userId, customer);

        const order = new Order(customer);
        const defaultItem = new Item({
            code: "PIZZA",
            size: PizzaSize.MEDIUM,
            crust: PizzaCrust.HAND_TOSSED,
            quantity: 1,
        });

        order.addItem(defaultItem);
        await orderManager.saveOrder(userId, order);

        let response =
            "I've started a new pizza order with default options.\n\n";
        response += orderManager.getOrderSummary(order, customer);
        response +=
            "\n" + orderManager.getNextRequiredActionDialogue(order, customer);

        return response;
    }
};

export const startOrder: Action = {
    name: "START_ORDER",
    description: "Starts a new pizza order.",
    similes: ["BEGIN_ORDER", "CREATE_ORDER", "NEW_ORDER"],
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I'd like to order a pizza please",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll help you build your perfect pizza! What size would you like? We have Small, Medium, Large and Extra Large.",
                    action: "START_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you help me order some Dominos?",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Of course! I'll help you place your Dominos order. Let's start with the size - would you like a Small, Medium, Large, or Extra Large pizza?",
                    action: "START_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "start pizza order",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Let's get your pizza order started! What size pizza would you like? We offer Small, Medium, Large and Extra Large options.",
                    action: "START_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "im hungry for some dominos",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I can help you order Dominos! First, what size pizza would you like - Small, Medium, Large, or Extra Large?",
                    action: "START_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "new pizza order",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll help you place your order! To get started, what size pizza would you prefer? We have Small, Medium, Large and Extra Large available.",
                    action: "START_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "hey can you order me a large pepperoni pizza",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll help you order a Large pizza! Before we add the pepperoni, would you like our Hand Tossed, Thin, Pan, Brooklyn, or Gluten Free crust?",
                    action: "START_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "begin dominos order",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll help you order from Dominos! Let's start by choosing your pizza size - would you like Small, Medium, Large, or Extra Large?",
                    action: "START_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "place pizza order",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Happy to help you order a pizza! First things first - what size would you like? You can choose from Small, Medium, Large, or Extra Large.",
                    action: "START_ORDER",
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

        // Only validate if there is no active order
        return !existingOrder;
    },
};
