import {
    composeContext,
    generateImage,
    generateText,
    generateObjectDeprecated,
} from "@elizaos/core";
import {
    ActionExample,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    type Action,
} from "@elizaos/core";
import { idlFactory } from "../canisters/pick-pump/index.did";
import { _SERVICE } from "../canisters/pick-pump/index.did.d";
import { idlFactory as bobidlFactory } from "../canisters/launch-bob/index.did";
import { _SERVICE as _BOB_SERVICE, CreateTokenArg } from "../canisters/launch-bob/index.did.d";
import { ActorCreator, CreateMemeTokenArg, Platform } from "../types";
import { unwrapOption, wrapOption } from "../utils/common/types/options";
import { unwrapRustResultMap } from "../utils/common/types/results";
import { icpWalletProvider } from "../providers/wallet";
import { uploadFileToWeb3Storage } from "../apis/uploadFile";
import { createTokenTemplate, logoPromptTemplate } from "./prompts/token";
import { CANISTER_IDS } from "../constants/canisters";

async function createTokenTransaction(
    creator: ActorCreator,
    tokenInfo: CreateMemeTokenArg,
    platform: Platform,
): Promise<any> {
    if (platform == 'launch-bob') {
        const actor: _BOB_SERVICE = await creator(
            bobidlFactory,
            CANISTER_IDS.LAUNCH_BOB_FUN
        );

        const result = await actor.create_token({
            name: tokenInfo.name,
            ticker: tokenInfo.symbol,
            description: tokenInfo.description,
            image: tokenInfo.logo,
            maybe_twitter: wrapOption(tokenInfo.twitter),
            maybe_website: wrapOption(tokenInfo.website),
            maybe_telegram: wrapOption(tokenInfo.telegram),
        } as CreateTokenArg);

        return unwrapRustResultMap(
            result,
            (ok) => ({...ok}),
            (err) => {
                throw new Error(`Token creation failed: ${err}`);
            }
        );
    }

    const actor: _SERVICE = await creator(idlFactory, CANISTER_IDS.PICK_PUMP);
    const result = await actor.create_token({
        ...tokenInfo,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        description: tokenInfo.description,
        logo: tokenInfo.logo,
        twitter: wrapOption(tokenInfo.twitter),
        website: wrapOption(tokenInfo.website),
        telegram: wrapOption(tokenInfo.telegram),
    });

    return unwrapRustResultMap(
        result,
        (ok) => ({
            ...ok,
            id: ok.id.toString(),
            created_at: ok.created_at.toString(),
            available_token: ok.available_token.toString(),
            volume_24h: ok.volume_24h.toString(),
            last_tx_time: ok.last_tx_time.toString(),
            market_cap_icp: ok.market_cap_icp.toString(),
            twitter: unwrapOption(ok.twitter),
            website: unwrapOption(ok.website),
            telegram: unwrapOption(ok.telegram),
        }),
        (err) => {
            throw new Error(`Token creation failed: ${err}`);
        }
    );
}

async function generateTokenLogo(
    description: string,
    runtime: IAgentRuntime
): Promise<string | null> {
    const logoPrompt = `Create a fun and memorable logo for a cryptocurrency token with these characteristics: ${description}. The logo should be simple, iconic, and suitable for a meme token. Style: minimal, bold colors, crypto-themed.`;

    const result = await generateImage(
        {
            prompt: logoPrompt,
            width: 512,
            height: 512,
            count: 1,
        },
        runtime as any
    );

    if (result.success && result.data && result.data.length > 0) {
        return result.data[0];
    }

    return null;
}

export const executeCreateToken: Action = {
    name: "CREATE_TOKEN",
    similes: [
        "CREATE_PICKPUMP_TOKEN",
        "MINT_PICKPUMP",
        "PICKPUMP_TOKEN",
        "PP_TOKEN",
        "PICKPUMP发币",
        "PP发币",
        "在PICKPUMP上发币",
        "PICKPUMP代币",
    ],
    description:
        "Create a new meme token on PickPump platform (Internet Computer). This action helps users create and launch tokens specifically on the PickPump platform.",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const keywords = [
            "pickpump",
            "pp",
            "皮克帮",
            "token",
            "coin",
            "代币",
            "币",
            "create",
            "mint",
            "launch",
            "deploy",
            "创建",
            "发行",
            "铸造",
        ];

        const messageText = (
            typeof message.content === "string"
                ? message.content
                : message.content.text || ""
        ).toLowerCase();

        return keywords.some((keyword) =>
            messageText.includes(keyword.toLowerCase())
        );
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        _options: { [key: string]: unknown } | undefined,
        callback?: HandlerCallback
    ): Promise<void> => {
        callback?.({
            text: "🔄 Creating meme token...",
            action: "CREATE_TOKEN",
            type: "processing",
        });

        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        const createTokenContext = composeContext({
            state,
            template: createTokenTemplate,
        });

        const response = await generateObjectDeprecated({
            runtime,
            context: createTokenContext,
            modelClass: ModelClass.LARGE,
        });

        const logoPromptContext = composeContext({
            state,
            template: logoPromptTemplate.replace(
                "{{description}}",
                response.description
            ),
        });

        const logoPrompt = await generateText({
            runtime,
            context: logoPromptContext,
            modelClass: ModelClass.LARGE,
        });

        const logo = await generateTokenLogo(logoPrompt, runtime);
        if (!logo) {
            throw new Error("Failed to generate token logo");
        }

        const logoUploadResult = await uploadFileToWeb3Storage(logo);
        if (!logoUploadResult.urls?.gateway) {
            throw new Error("Failed to upload logo to Web3Storage");
        }

        try {
            const { wallet } = await icpWalletProvider.get(
                runtime,
                message,
                state
            );

            const creator = wallet.createActor;
            const createTokenResult = await createTokenTransaction(creator, {
                name: response.name,
                symbol: response.symbol,
                description: response.description,
                website: response.website,
                twitter: response.twitter,
                telegram: response.telegram,
                logo: logoUploadResult.urls.gateway,
            }, 'launch-bob');

            const responseMsg = {
                text: `✨ Created new meme token:\n🪙 ${response.name} (${response.symbol})\n📝 ${response.description}`,
                data: createTokenResult,
                action: "CREATE_TOKEN",
                type: "success",
            };
            callback?.(responseMsg);
        } catch (error: any) {
            const responseMsg = {
                text: `Failed to create token: ${error.message}`,
                action: "CREATE_TOKEN",
                type: "error",
            };
            callback?.(responseMsg);
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: "I want to create a space cat token on PickPump",
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Creating space cat token on PickPump...",
                    action: "CREATE_TOKEN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "✨ Token created successfully!",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: "Help me create a pizza-themed funny token on PP",
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Creating pizza token on PickPump...",
                    action: "CREATE_TOKEN",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
