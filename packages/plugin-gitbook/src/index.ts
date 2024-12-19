import { Plugin } from "@ai16z/eliza";
import { gitbookProvider } from "./providers/gitbook";

export const gitbookPlugin: Plugin = {
    name: "GitBook Documentation",
    description: "Plugin for querying GitBook documentation",
    actions: [],
    providers: [gitbookProvider],
    evaluators: []
};

export default gitbookPlugin;

export * from './types';