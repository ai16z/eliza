import {
    ActionExample,
    Content,
    generateText,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    type Action,
} from "@ai16z/eliza";


export const currentNewsAction: Action = {
    name: "CURRENT_NEWS",
    similes: ["NEWS", "GET_NEWS", "GET_CURRENT_NEWS"],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },
    description:
        "Get the latest news about a specific topic if asked by the user.",
    handler: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        _state: State,
        _options: { [key: string]: unknown; },
        _callback: HandlerCallback,
    ): Promise<boolean> => {
        async function getCurrentNews(searchTerm: string) {
            try {
                const apiKey = process.env.NEWS_API_KEY;
                if (!apiKey) {
                    throw new Error('NEWS_API_KEY environment variable is not set');
                }

                const response = await fetch(`https://newsapi.org/v2/everything?q=${searchTerm}&sortBy=publishedAt&apiKey=${apiKey}`);
                const data = await response.json();

                if (!data.articles || !Array.isArray(data.articles)) {
                    return "No news articles found.";
                }

                return data.articles.slice(0, 5).map(article => {
                    const content = article.content || article.description || "No content available";
                    return `${article.title || "No title"}\n${article.description || "No description"}\n${article.url || ""}\n${content.slice(0, 1000)}`;
                }).join("\n\n");
            } catch (error) {
                console.error("Error fetching news:", error);
                return "Sorry, there was an error fetching the news.";
            }
        }

        const context = `Extract the search term from the {{userName}} message. The message is: ${_message.content.text}. Only return the search term, no other text.`

        const searchTerm = await generateText({
            runtime: _runtime,
            context,
            modelClass: ModelClass.SMALL,
            stop: ["\n"],
        });

        const currentNews = await getCurrentNews(searchTerm);
        const responseText = ` *protocol droid noises*\n\n${currentNews}`;


        const newMemory: Memory = {
            userId: _message.agentId,
            agentId: _message.agentId,
            roomId: _message.roomId,
            content: {
                text: responseText,
                action: "CURRENT_NEWS_RESPONSE",
                source: _message.content?.source,
            } as Content,
        };

        await _runtime.messageManager.createMemory(newMemory);

        _callback(newMemory.content);
        return true;

    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "what's the latest news about <searchTerm>?" },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "CURRENT NEWS" },
            },
        ],

        [
            {
                user: "{{user1}}",
                content: { text: "can you show me the latest news about <searchTerm>?" },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "CURRENT NEWS" },
            },
        ],

        [
            {
                user: "{{user1}}",
                content: { text: "what's in the <searchTerm> news today?" },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "CURRENT NEWS" },
            },
        ],

        [
            {
                user: "{{user1}}",
                content: { text: "show me current events about <searchTerm>?" },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "CURRENT NEWS" },
            },
        ],

        [
            {
                user: "{{user1}}",
                content: { text: "what's going on in the world of <searchTerm>?" },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "CURRENT NEWS" },
            },
        ],

        [
            {
                user: "{{user1}}",
                content: { text: "give me the latest headlines about <searchTerm>?" },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "CURRENT NEWS" },
            },
        ],

        [
            {
                user: "{{user1}}",
                content: { text: "show me news updates about <searchTerm>?" },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "CURRENT NEWS" },
            },
        ],

        [
            {
                user: "{{user1}}",
                content: { text: "what are today's top stories about <searchTerm>?" },
            },
            {
                user: "{{user2}}",
                content: { text: "", action: "CURRENT NEWS" },
            },
        ],
    ] as ActionExample[][],
} as Action;