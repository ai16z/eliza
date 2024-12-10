import {
    Client,
    composeContext,
    Content,
    elizaLogger,
    generateMessageResponse,
    generateShouldRespond,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    messageCompletionFooter,
    ModelClass,
    Plugin,
    shouldRespondFooter,
    stringToUuid,
    getEmbeddingZeroVector,
} from "@ai16z/eliza";

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

// Type definitions
interface ModelInfo {
    username: string;
    model: string;
}

interface ChatMessage {
    id: string;
    content: string;
    sender: ModelInfo;
    timestamp: string;
    roomId: string;
}

interface ChatRoom {
    id: string;
    name: string;
    topic: string;
    tags: string[];
    participants: ModelInfo[];
    createdAt: string;
    messageCount: number;
}

interface EchoChamberConfig {
    apiUrl: string;
    apiKey: string;
    defaultRoom?: string;
    username?: string;
    model?: string;
}

interface ListRoomsResponse {
    rooms: ChatRoom[];
}

interface RoomHistoryResponse {
    messages: ChatMessage[];
}

interface MessageResponse {
    message: ChatMessage;
}

enum RoomEvent {
    MESSAGE_CREATED = "message_created",
    ROOM_CREATED = "room_created",
    ROOM_UPDATED = "room_updated",
    ROOM_JOINED = "room_joined",
    ROOM_LEFT = "room_left",
}

// Template functions
function createMessageTemplate(currentRoom: string, roomTopic: string) {
    return (
        `
# About {{agentName}}:
{{bio}}
{{lore}}
{{knowledge}}

Current Room: ${currentRoom}
Room Topic: ${roomTopic}

{{messageDirections}}

Recent conversation history:
{{recentMessages}}

Thread Context:
{{formattedConversation}}

# Task: Generate a response in the voice and style of {{agentName}} while:
1. Staying relevant to the room's topic
2. Maintaining conversation context
3. Being helpful but not overly talkative
4. Responding naturally to direct questions or mentions
5. Contributing meaningfully to ongoing discussions

Remember:
- Keep responses concise and focused
- Stay on topic for the current room
- Don't repeat information already shared
- Be natural and conversational
` + messageCompletionFooter
    );
}

function createShouldRespondTemplate(currentRoom: string, roomTopic: string) {
    return (
        `
# About {{agentName}}:
{{bio}}
{{knowledge}}

Current Room: ${currentRoom}
Room Topic: ${roomTopic}

Response options are [RESPOND], [IGNORE] and [STOP].

{{agentName}} should:
- RESPOND when:
  * Directly mentioned or asked a question
  * Can contribute relevant expertise to the discussion
  * Topic aligns with their knowledge and background
  * Conversation is active and engaging

- IGNORE when:
  * Message is not relevant to their expertise
  * Already responded recently without new information to add
  * Conversation has moved to a different topic
  * Message is too short or lacks substance
  * Other participants are handling the discussion well

- STOP when:
  * Asked to stop participating
  * Conversation has concluded
  * Discussion has completely diverged from their expertise
  * Room topic has changed significantly

Recent messages:
{{recentMessages}}

Thread Context:
{{formattedConversation}}

# Task: Choose whether {{agentName}} should respond to the last message.
Consider:
1. Message relevance to {{agentName}}'s expertise
2. Current conversation context
3. Time since last response
4. Value of potential contribution
` + shouldRespondFooter
    );
}

// Main client class
export class EchoChamberClient {
    private runtime: IAgentRuntime;
    private config: EchoChamberConfig;
    private apiUrl: string;
    private modelInfo: ModelInfo;
    private pollInterval: NodeJS.Timeout | null = null;
    private watchedRoom: string | null = null;
    private reconnectAttempts: number = 0;
    private readonly maxReconnectAttempts: number = 5;

    constructor(runtime: IAgentRuntime, config: EchoChamberConfig) {
        this.runtime = runtime;
        this.config = config;
        this.apiUrl = `${config.apiUrl}/api/rooms`;
        this.modelInfo = {
            username: config.username || `agent-${runtime.agentId}`,
            model: config.model || runtime.modelProvider,
        };
    }

    public getUsername(): string {
        return this.modelInfo.username;
    }

    public getModelInfo(): ModelInfo {
        return { ...this.modelInfo };
    }

    public getConfig(): EchoChamberConfig {
        return { ...this.config };
    }

    private getAuthHeaders(): { [key: string]: string } {
        return {
            "Content-Type": "application/json",
            "x-api-key": this.config.apiKey,
        };
    }

    public async setWatchedRoom(roomId: string): Promise<void> {
        try {
            const rooms = await this.listRooms();
            const room = rooms.find((r) => r.id === roomId);

            if (!room) {
                throw new Error(`Room ${roomId} not found`);
            }

            this.watchedRoom = roomId;
            elizaLogger.success(`Now watching room: ${room.name}`);
        } catch (error) {
            elizaLogger.error("Error setting watched room:", error);
            throw error;
        }
    }

    public getWatchedRoom(): string | null {
        return this.watchedRoom;
    }

    private async retryOperation<T>(
        operation: () => Promise<T>,
        retries: number = MAX_RETRIES
    ): Promise<T> {
        for (let i = 0; i < retries; i++) {
            try {
                return await operation();
            } catch (error) {
                if (i === retries - 1) throw error;
                const delay = RETRY_DELAY * Math.pow(2, i);
                elizaLogger.warn(`Retrying operation in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        throw new Error("Max retries exceeded");
    }

    private async handleReconnection(): Promise<void> {
        this.reconnectAttempts++;
        if (this.reconnectAttempts <= this.maxReconnectAttempts) {
            elizaLogger.warn(
                `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
            );
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        } else {
            elizaLogger.error(
                "Max reconnection attempts reached, stopping client"
            );
            await this.stop();
        }
    }

    public async start(): Promise<void> {
        elizaLogger.log("🚀 Starting EchoChamber client...");
        try {
            await this.retryOperation(() => this.listRooms());
            elizaLogger.success(
                `✅ EchoChamber client successfully started for ${this.modelInfo.username}`
            );

            if (this.config.defaultRoom && !this.watchedRoom) {
                await this.setWatchedRoom(this.config.defaultRoom);
            }
        } catch (error) {
            elizaLogger.error("❌ Failed to start EchoChamber client:", error);
            throw error;
        }
    }

    public async stop(): Promise<void> {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }

        if (this.watchedRoom) {
            this.watchedRoom = null;
        }

        elizaLogger.log("Stopping EchoChamber client...");
    }

    public async listRooms(tags?: string[]): Promise<ChatRoom[]> {
        try {
            const url = new URL(this.apiUrl);
            if (tags?.length) {
                url.searchParams.append("tags", tags.join(","));
            }

            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Failed to list rooms: ${response.statusText}`);
            }

            const data = (await response.json()) as ListRoomsResponse;
            return data.rooms;
        } catch (error) {
            elizaLogger.error("Error listing rooms:", error);
            throw error;
        }
    }

    public async getRoomHistory(roomId: string): Promise<ChatMessage[]> {
        return this.retryOperation(async () => {
            const response = await fetch(`${this.apiUrl}/${roomId}/history`);
            if (!response.ok) {
                throw new Error(
                    `Failed to get room history: ${response.statusText}`
                );
            }

            const data = (await response.json()) as RoomHistoryResponse;
            return data.messages;
        });
    }

    public async sendMessage(
        roomId: string,
        content: string
    ): Promise<ChatMessage> {
        return this.retryOperation(async () => {
            const response = await fetch(`${this.apiUrl}/${roomId}/message`, {
                method: "POST",
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    content,
                    sender: this.modelInfo,
                }),
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to send message: ${response.statusText}`
                );
            }

            const data = (await response.json()) as MessageResponse;
            return data.message;
        });
    }
}

// Interaction client class
export class InteractionClient {
    private client: EchoChamberClient;
    private runtime: IAgentRuntime;
    private lastCheckedTimestamps: Map<string, string> = new Map();
    private lastResponseTimes: Map<string, number> = new Map();
    private messageThreads: Map<string, ChatMessage[]> = new Map();
    private pollInterval: NodeJS.Timeout | null = null;

    constructor(client: EchoChamberClient, runtime: IAgentRuntime) {
        this.client = client;
        this.runtime = runtime;
    }

    async start() {
        const pollInterval = Number(
            this.runtime.getSetting("ECHOCHAMBERS_POLL_INTERVAL") || 60
        );

        const handleInteractionsLoop = () => {
            this.handleInteractions();
            this.pollInterval = setTimeout(
                handleInteractionsLoop,
                pollInterval * 1000
            );
        };

        handleInteractionsLoop();
    }

    async stop() {
        if (this.pollInterval) {
            clearTimeout(this.pollInterval);
            this.pollInterval = null;
        }
    }

    private async buildMessageThread(
        message: ChatMessage,
        messages: ChatMessage[]
    ): Promise<ChatMessage[]> {
        const thread: ChatMessage[] = [];
        const maxThreadLength = Number(
            this.runtime.getSetting("ECHOCHAMBERS_MAX_MESSAGES") || 10
        );
        thread.push(message);

        const roomMessages = messages
            .filter((msg) => msg.roomId === message.roomId)
            .sort(
                (a, b) =>
                    new Date(b.timestamp).getTime() -
                    new Date(a.timestamp).getTime()
            );

        for (const msg of roomMessages) {
            if (thread.length >= maxThreadLength) break;
            if (msg.id !== message.id) {
                thread.unshift(msg);
            }
        }

        return thread;
    }

    private shouldProcessMessage(
        message: ChatMessage,
        room: { topic: string }
    ): boolean {
        const modelInfo = this.client.getModelInfo();

        if (message.sender.username === modelInfo.username) {
            return false;
        }

        const lastChecked =
            this.lastCheckedTimestamps.get(message.roomId) || "0";
        if (message.timestamp <= lastChecked) {
            return false;
        }

        const lastResponseTime =
            this.lastResponseTimes.get(message.roomId) || 0;
        const minTimeBetweenResponses = 30000; // 30 seconds
        if (Date.now() - lastResponseTime < minTimeBetweenResponses) {
            return false;
        }

        const isMentioned = message.content
            .toLowerCase()
            .includes(`@${modelInfo.username.toLowerCase()}`);
        const isRelevantToTopic =
            (room.topic &&
                message.content
                    .toLowerCase()
                    .includes(room.topic.toLowerCase())) ||
            false;

        return isMentioned || isRelevantToTopic;
    }

    private async handleInteractions() {
        elizaLogger.log("Checking EchoChambers interactions");
        try {
            const defaultRoom =
                this.runtime.getSetting("ECHOCHAMBERS_DEFAULT_ROOM") ||
                "general";
            const rooms = await this.client.listRooms();

            for (const room of rooms) {
                if (defaultRoom && room.id !== defaultRoom) {
                    continue;
                }

                const messages = await this.client.getRoomHistory(room.id);
                this.messageThreads.set(room.id, messages);

                const latestMessages = messages
                    .filter((msg) => !this.shouldProcessMessage(msg, room))
                    .sort(
                        (a, b) =>
                            new Date(b.timestamp).getTime() -
                            new Date(a.timestamp).getTime()
                    );

                if (latestMessages.length > 0) {
                    const latestMessage = latestMessages[0];
                    await this.handleMessage(latestMessage, room.topic);

                    if (
                        latestMessage.timestamp >
                        (this.lastCheckedTimestamps.get(room.id) || "0")
                    ) {
                        this.lastCheckedTimestamps.set(
                            room.id,
                            latestMessage.timestamp
                        );
                    }
                }
            }
            elizaLogger.log("Finished checking EchoChambers interactions");
        } catch (error) {
            elizaLogger.error(
                "Error handling EchoChambers interactions:",
                error
            );
        }
    }

    private async handleMessage(message: ChatMessage, roomTopic: string) {
        try {
            const roomId = stringToUuid(message.roomId);
            const userId = stringToUuid(message.sender.username);

            await this.runtime.ensureConnection(
                userId,
                roomId,
                message.sender.username,
                message.sender.username,
                "echochambers"
            );

            const thread = await this.buildMessageThread(
                message,
                this.messageThreads.get(message.roomId) || []
            );

            const memory: Memory = {
                id: stringToUuid(message.id),
                userId,
                agentId: this.runtime.agentId,
                roomId,
                content: {
                    text: message.content,
                    source: "echochambers",
                    thread: thread.map((msg) => ({
                        text: msg.content,
                        sender: msg.sender.username,
                        timestamp: msg.timestamp,
                    })),
                },
                createdAt: new Date(message.timestamp).getTime(),
                embedding: getEmbeddingZeroVector(),
            };

            const existing =
                memory.id &&
                (await this.runtime.messageManager.getMemoryById(memory.id));
            if (existing) {
                elizaLogger.log(
                    `Already processed message ${message.id}, skipping`
                );
                return;
            }

            await this.runtime.messageManager.createMemory(memory);
            let state = await this.runtime.composeState(memory);
            state = await this.runtime.updateRecentMessageState(state);

            const shouldRespondContext = composeContext({
                state,
                template:
                    this.runtime.character.templates?.shouldRespondTemplate ||
                    createShouldRespondTemplate(message.roomId, roomTopic),
            });

            const shouldRespond = await generateShouldRespond({
                runtime: this.runtime,
                context: shouldRespondContext,
                modelClass: ModelClass.SMALL,
            });

            if (shouldRespond !== "RESPOND") {
                elizaLogger.log(
                    `Not responding to message ${message.id}: ${shouldRespond}`
                );
                return;
            }

            const responseContext = composeContext({
                state,
                template:
                    this.runtime.character.templates?.messageHandlerTemplate ||
                    createMessageTemplate(message.roomId, roomTopic),
            });

            const response = await generateMessageResponse({
                runtime: this.runtime,
                context: responseContext,
                modelClass: ModelClass.SMALL,
            });

            if (!response || !response.text) {
                elizaLogger.log("No response generated");
                return;
            }

            const callback: HandlerCallback = async (content: Content) => {
                const sentMessage = await this.client.sendMessage(
                    message.roomId,
                    content.text
                );
                this.lastResponseTimes.set(message.roomId, Date.now());

                const responseMemory: Memory = {
                    id: stringToUuid(sentMessage.id),
                    userId: this.runtime.agentId,
                    agentId: this.runtime.agentId,
                    roomId,
                    content: {
                        text: sentMessage.content,
                        source: "echochambers",
                        action: content.action,
                        thread: thread.map((msg) => ({
                            text: msg.content,
                            sender: msg.sender.username,
                            timestamp: msg.timestamp,
                        })),
                    },
                    createdAt: new Date(sentMessage.timestamp).getTime(),
                    embedding: getEmbeddingZeroVector(),
                };

                await this.runtime.messageManager.createMemory(responseMemory);
                return [responseMemory];
            };

            const responseMessages = await callback(response);
            state = await this.runtime.updateRecentMessageState(state);
            await this.runtime.processActions(
                memory,
                responseMessages,
                state,
                callback
            );
            await this.runtime.evaluate(memory, state, true);
        } catch (error) {
            elizaLogger.error("Error handling message:", error);
        }
    }
}

// Environment validation
async function validateEchoChamberConfig(
    runtime: IAgentRuntime
): Promise<void> {
    const apiUrl = runtime.getSetting("ECHOCHAMBERS_API_URL");
    const apiKey = runtime.getSetting("ECHOCHAMBERS_API_KEY");

    if (!apiUrl) {
        elizaLogger.error(
            "ECHOCHAMBERS_API_URL is required. Please set it in your environment variables."
        );
        throw new Error("ECHOCHAMBERS_API_URL is required");
    }

    if (!apiKey) {
        elizaLogger.error(
            "ECHOCHAMBERS_API_KEY is required. Please set it in your environment variables."
        );
        throw new Error("ECHOCHAMBERS_API_KEY is required");
    }

    try {
        new URL(apiUrl);
    } catch (error) {
        elizaLogger.error(
            `Invalid ECHOCHAMBERS_API_URL format: ${apiUrl}. Please provide a valid URL.`
        );
        throw new Error("Invalid ECHOCHAMBERS_API_URL format");
    }

    const username =
        runtime.getSetting("ECHOCHAMBERS_USERNAME") ||
        `agent-${runtime.agentId}`;
    const defaultRoom =
        runtime.getSetting("ECHOCHAMBERS_DEFAULT_ROOM") || "general";
    const pollInterval = Number(
        runtime.getSetting("ECHOCHAMBERS_POLL_INTERVAL") || 120
    );

    if (isNaN(pollInterval) || pollInterval < 1) {
        elizaLogger.error(
            "ECHOCHAMBERS_POLL_INTERVAL must be a positive number in seconds"
        );
        throw new Error("Invalid ECHOCHAMBERS_POLL_INTERVAL");
    }

    elizaLogger.log("EchoChambers configuration validated successfully");
    elizaLogger.log(`API URL: ${apiUrl}`);
    elizaLogger.log(`Username: ${username}`);
    elizaLogger.log(`Default Room: ${defaultRoom || "Not specified"}`);
    elizaLogger.log(`Poll Interval: ${pollInterval}s`);
}

// Client interface
export const EchoChamberClientInterface: Client = {
    async start(runtime: IAgentRuntime) {
        try {
            await validateEchoChamberConfig(runtime);

            const apiUrl =
                runtime.getSetting("ECHOCHAMBERS_API_URL") ||
                "http://127.0.0.1:3333";
            const apiKey = runtime.getSetting("ECHOCHAMBERS_API_KEY");

            if (!apiKey) {
                throw new Error("ECHOCHAMBERS_API_KEY is required");
            }

            const config: EchoChamberConfig = {
                apiUrl,
                apiKey,
                username:
                    runtime.getSetting("ECHOCHAMBERS_USERNAME") ||
                    `agent-${runtime.agentId}`,
                model: runtime.modelProvider,
                defaultRoom:
                    runtime.getSetting("ECHOCHAMBERS_DEFAULT_ROOM") ||
                    "general",
            };

            elizaLogger.log("Starting EchoChambers client...");
            const client = new EchoChamberClient(runtime, config);
            await client.start();

            const interactionClient = new InteractionClient(client, runtime);
            await interactionClient.start();

            elizaLogger.success(
                `✅ EchoChambers client successfully started for character ${runtime.character.name}`
            );

            return { client, interactionClient };
        } catch (error) {
            elizaLogger.error("Failed to start EchoChambers client:", error);
            throw error;
        }
    },

    async stop(_runtime: IAgentRuntime) {
        try {
            elizaLogger.warn("Stopping EchoChambers client...");
            // TODO: Stop clients
            // const clients = runtime.clients?.filter(
            //     (c) =>
            //         c instanceof EchoChamberClient ||
            //         c instanceof InteractionClient
            // );

            // for (const client of clients) {
            //     await client.stop();
            // }

            elizaLogger.success("EchoChambers client stopped successfully");
        } catch (error) {
            elizaLogger.error("Error stopping EchoChambers client:", error);
            throw error;
        }
    },
};

// Plugin definition
export const echoChamberPlugin: Plugin = {
    name: "echochambers",
    description: "Plugin for enabling Eliza conversations in EchoChambers",
    actions: [],
    evaluators: [],
    providers: [],
    clients: [EchoChamberClientInterface],
};

export default echoChamberPlugin;

// Export all types and classes
export {
    ChatMessage,
    ChatRoom,
    EchoChamberConfig,
    ListRoomsResponse,
    MessageResponse,
    ModelInfo,
    RoomEvent,
    RoomHistoryResponse,
};
