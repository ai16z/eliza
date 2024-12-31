import { Plugin } from "@elizaos/core";
import useFerePro from "./actions/UseFereProAction";

export const fereProPlugin: Plugin = {
  name: "Fere Pro",
  description: "Answer questions about blockchain, cryptocurrencies, and related topics using a dedicated API.",
  actions: [useFerePro],
  evaluators: [],
  providers: [],
  services: [],
};

export default fereProPlugin;
