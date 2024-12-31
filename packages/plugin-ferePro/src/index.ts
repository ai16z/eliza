import { Plugin } from "@elizaos/core";
import sendFereProMessage from "./actions/FereProAction";
import { FereProService } from "./services/FereProService";

export const fereProPlugin: Plugin = {
  name: "ferePro",
  description:
    "FerePro Plugin for Eliza - Enables WebSocket communication for AI-driven market insights",
  actions: [sendFereProMessage], 
  evaluators: [],
  providers: [],
  services: [new FereProService()], 
};

export default fereProPlugin;
