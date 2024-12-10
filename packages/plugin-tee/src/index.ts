import { Plugin } from "@ai16z/eliza";
import { remoteAttestationProvider } from "./providers/remoteAttestationProvider";
import { deriveKeyProvider } from "./providers/deriveKeyProvider";

export { DeriveKeyProvider } from "./providers/deriveKeyProvider";
export { RemoteAttestationProvider } from "./providers/remoteAttestationProvider";
export { RemoteAttestationQuote, TEEMode } from "./types/tee";

export const teePlugin: Plugin = {
    name: "tee",
    description:
        "TEE plugin with actions to generate remote attestations and derive keys",
    actions: [
        /* custom actions */
    ],
    evaluators: [
        /* custom evaluators */
    ],
    providers: [
        /* custom providers */
        remoteAttestationProvider,
        deriveKeyProvider,
    ],
    services: [
        /* custom services */
    ],
};
