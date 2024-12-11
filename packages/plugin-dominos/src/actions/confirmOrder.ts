import { Action, IAgentRuntime, Memory } from "@ai16z/eliza";
import { PizzaOrderManager } from "../PizzaOrderManager";
import { OrderStatus } from "../types";

export const confirmOrder: Action = {
    name: "CONFIRM_ORDER",
    similes: ["FINALIZE_ORDER", "FINISH_ORDER", "PLACE_ORDER"],
    examples: [
        // TODO
    ],
    description: "Confirms and places the final order with Dominos",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const orderManager = new PizzaOrderManager(runtime);
        const userId = message.userId;
        const order = await orderManager.getOrder(userId);
        const customer = await orderManager.getCustomer(userId);

        if (!order || !customer) return false;

        // Only valid if we have complete customer info and valid payment
        return (
            order.progress &&
            order.progress.hasCustomerInfo &&
            order.progress.hasValidPayment &&
            !order.progress.isConfirmed
        );
    },
    handler: async (runtime: IAgentRuntime, message: Memory) => {
        const orderManager = new PizzaOrderManager(runtime);
        const userId = message.userId;
        const order = await orderManager.getOrder(userId);
        const customer = await orderManager.getCustomer(userId);

        try {
            // Final validation with Dominos
            await order.validate();

            // Get final pricing
            await order.price();

            // Place the order
            await order.place();

            // Update order status
            order.status = OrderStatus.CONFIRMED;
            await orderManager.saveOrder(userId, order);

            return (
                `Great news! Your order has been confirmed and is being prepared.\n\n` +
                `Order Number: ${order.orderID}\n` +
                `Estimated Delivery Time: ${order.estimatedWaitMinutes} minutes\n\n` +
                orderManager.getOrderSummary(order, customer)
            );
        } catch (error) {
            return "There was an issue placing your order: " + error.message;
        }
    },
};
