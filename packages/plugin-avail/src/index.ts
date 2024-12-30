import type { Plugin } from "@elizaos/eliza";

//export * from "./actions/bridge";
export * from "./actions/submitData";
export * from "./actions/transfer";


// import { bridgeAction } from "./actions/bridge";
import transfer  from "./actions/transfer";
import submitData from "./actions/submitData";


export const availPlugin: Plugin = {
    name: "avail",
    description: "Avail DA integration plugin",
    providers: [],
    evaluators: [],
    services: [],
    actions: [transfer, submitData],
};


export default availPlugin;
