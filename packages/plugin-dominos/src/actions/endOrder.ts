import { Action, ActionExample, IAgentRuntime, Memory } from "@ai16z/eliza";
import { PizzaOrderManager } from "../PizzaOrderManager";

export const endOrder: Action = {
    name: "CANCEL_ORDER",
    description: "Ends the current pizza order and clears the order data.",
    similes: ["END_ORDER", "FINISH_ORDER", "COMPLETE_ORDER", "STOP_ORDER"],
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Actually, I need to cancel my order",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Your order has been canceled.",
                    action: "CANCEL_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "nevermind, cancel the pizza order",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Your order has been canceled.",
                    action: "CANCEL_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "stop the order please",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Your order has been canceled.",
                    action: "CANCEL_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "can you cancel my pizza order",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Your order has been canceled.",
                    action: "CANCEL_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I changed my mind, don't want pizza anymore",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Your order has been canceled.",
                    action: "CANCEL_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "end order",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Your order has been canceled.",
                    action: "CANCEL_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "sorry but I need to cancel this order",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Your order has been canceled.",
                    action: "CANCEL_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "stop my dominos order",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Your order has been canceled.",
                    action: "CANCEL_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "finish order",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Your order has been canceled.",
                    action: "CANCEL_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "cancel everything",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Your order has been canceled.",
                    action: "CANCEL_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "hey can you clear my current order",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Your order has been canceled.",
                    action: "CANCEL_ORDER",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "scratch that order",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Your order has been canceled.",
                    action: "CANCEL_ORDER",
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
            return "There is no active order to end.";
        }

        // Clear the order data
        await runtime.cacheManager.delete(`pizza-order-${userId}`);
        await runtime.cacheManager.delete(`pizza-customer-${userId}`);

        return "Your order has been canceled.";
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
