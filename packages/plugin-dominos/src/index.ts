import { Plugin } from "@ai16z/eliza";
import { startOrder } from "./actions/startOrder.ts";
import { pizzaOrderProvider } from "./providers/pizzaOrder.ts";
import { endOrder } from "./actions/endOrder.ts";
import { updateCustomer } from "./actions/updateCustomer.ts";
import { updateOrder } from "./actions/updateOrder.ts";
import { confirmOrder } from "./actions/confirmOrder.ts";

export * as actions from "./actions/index.ts";
export * as providers from "./providers/index.ts";

export const dominosPlugin: Plugin = {
    name: "dominos",
    description: "Order a dominos pizza",
    actions: [startOrder, endOrder, updateCustomer, updateOrder, confirmOrder],
    providers: [pizzaOrderProvider],
};
