import { Plugin } from "@ai16z/eliza";
import { currentNewsAction } from "./actions/news.ts";

export * as actions from "./actions";

export const newsPlugin: Plugin = {
    name: "news",
    description: "Get the latest news about a specific topic if asked by the user.",
    actions: [currentNewsAction],
};
