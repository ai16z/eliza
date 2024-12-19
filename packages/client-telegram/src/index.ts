import { elizaLogger } from "@ai16z/eliza";
import { Client, IAgentRuntime } from "@ai16z/eliza";
import { TelegramClient } from "./telegramClient.ts";
import { validateTelegramConfig } from "./environment.ts";
import fetch from 'node-fetch';

export const TelegramClientInterface: Client = {
    start: async (runtime: IAgentRuntime) => {
        await validateTelegramConfig(runtime);

        const tg = new TelegramClient(
            runtime,
            runtime.getSetting("TELEGRAM_BOT_TOKEN")
        );

        await tg.start();

        elizaLogger.success(
            `✅ Telegram client successfully started for character ${runtime.character.name}`
        );
        return tg;
    },
    validate: async (token) => {
    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        if (!response.ok) {
            elizaLogger.error('Invalid telegram token:', response.statusText);
            return false;
        }
        const data = await response.json();
        elizaLogger.log('data', data)
        if (data["ok"]) {
            return true;
        } else {
            elizaLogger.error('Invalid telegram token:', data["description"]);
            return false;
        }
      } catch (error) {
          // maybe don't log error.message as it may have secret in it
          elizaLogger.error('Error verifying telegram token:', error.message);
          return false;
      }
    },
    stop: async (_runtime: IAgentRuntime) => {
        elizaLogger.warn("Telegram client does not support stopping yet");
    },
};

export default TelegramClientInterface;
