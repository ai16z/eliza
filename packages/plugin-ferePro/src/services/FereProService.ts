import WebSocket from "ws";
import { IAgentRuntime, Service } from "@elizaos/core";

interface ChatResponse {
    answer: string;
    chat_id: string;
    representation?: Record<string, any>[];
    agent_api_name: string;
    query_summary: string;
    agent_credits: number;
    credits_available: number;
}

interface FereMessage {
    message: string;
    stream?: boolean;
    debug?: boolean;
}

interface FereResponse {
    success: boolean;
    data?: ChatResponse;
    error?: string;
}

export class FereProService extends Service {
    private ws: WebSocket | null = null;
    private user: string = "1a5b4a29-9d95-44c8-aef3-05a8e515f43e";
    private runtime: IAgentRuntime | null = null;

    async initialize(runtime: IAgentRuntime): Promise<void> {
        console.log("Initializing FerePro WebSocket Service");
        this.runtime = runtime;
        this.user = runtime.getSetting("FERE_USER_ID") ?? this.user;
    }

    /**
     * Connect to WebSocket and send a message
     */
    async sendMessage(payload: FereMessage): Promise<FereResponse> {
        return new Promise((resolve, reject) => {
            try {
                const url = `wss:/api.fereai.xyz/chat/v2/ws/${this.user}`;
                this.ws = new WebSocket(url);

                this.ws.on("open", () => {
                    console.log("Connected to FerePro WebSocket");
                    this.ws?.send(JSON.stringify(payload));
                    console.log("Message sent:", payload.message);
                });

                this.ws.on("message", (data) => {
                    try {
                        const response = JSON.parse(data.toString());
                        const chatResponse: ChatResponse = {
                            answer: response.answer,
                            chat_id: response.chat_id,
                            representation: response.representation || null,
                            agent_api_name: response.agent_api_name,
                            query_summary: response.query_summary,
                            agent_credits: response.agent_credits,
                            credits_available: response.credits_available,
                        };

                        console.log("Received ChatResponse:", chatResponse);

                        resolve({
                            success: true,
                            data: chatResponse,
                        });
                    } catch (err) {
                        console.error("Error parsing response:", err);
                        reject({
                            success: false,
                            error: "Invalid response format",
                        });
                    }
                });

                this.ws.on("close", () => {
                    console.log("Disconnected from FerePro WebSocket");
                });

                this.ws.on("error", (err) => {
                    console.error("WebSocket error:", err);
                    reject({
                        success: false,
                        error: err.message,
                    });
                });
            } catch (error) {
                reject({
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Error Occured",
                });
            }
        });
    }
}

export default FereProService;
